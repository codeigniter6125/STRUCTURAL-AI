export default async function handler(req: any, res: any) {
  // Simple server-side proxy to Roboflow Serverless Workflow
  // Accepts POST { image, imageUrl, element?, buildingCode?, locationDetails? }
  // Returns the Roboflow workflow JSON (or an error) without exposing the ROBOFLOW_API_KEY to clients.

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.ROBOFLOW_API_KEY;
  let workflowUrl = process.env.ROBOFLOW_WORKFLOW_URL || 'https://serverless.roboflow.com/kumar-ritovash/workflows/building-infrastructure-defects-logic';
  if (workflowUrl && !workflowUrl.startsWith('http://') && !workflowUrl.startsWith('https://')) {
    workflowUrl = `https://serverless.roboflow.com/kumar-ritovash/workflows/${workflowUrl}`;
  }

  if (!apiKey) {
    return res.status(500).json({
      status: 'error',
      message:
        'ROBOFLOW_API_KEY is not configured on the server. Please add it in Vercel Project Settings → Environment Variables (Target: Server).',
      configured: false,
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      // keep body as-is
    }
  }

  // Extract only image or imageUrl - ignore other metadata parameters
  const { image, imageUrl } = body || {};
  const target = image || imageUrl;

  if (!target || typeof target !== 'string') {
    return res.status(400).json({ 
      error: 'No image or imageUrl provided. Provide a base64 data URL or a public HTTPS image URL.',
      received: { image: !!image, imageUrl: !!imageUrl }
    });
  }

  try {
    // Build payload for Roboflow
    let payload: any = null;
    const cleanInput = target.trim();

    if (cleanInput.startsWith('http://') || cleanInput.startsWith('https://')) {
      // URL-based image
      payload = {
        api_key: apiKey,
        inputs: {
          image: { type: 'url', value: cleanInput },
        },
      };
    } else if (cleanInput.startsWith('data:')) {
      // Base64-encoded image
      let cleanBase64 = cleanInput;
      if (cleanBase64.includes('base64,')) {
        cleanBase64 = cleanBase64.split('base64,')[1].trim();
      }
      if (!cleanBase64) {
        return res.status(400).json({ error: 'Image data could not be parsed into base64.' });
      }
      payload = {
        api_key: apiKey,
        inputs: {
          image: { type: 'base64', value: cleanBase64 },
        },
      };
    } else {
      // Assume it's base64 without data URI prefix
      payload = {
        api_key: apiKey,
        inputs: {
          image: { type: 'base64', value: cleanInput },
        },
      };
    }

    // Use AbortController for timeout
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutMs = 30000; // 30s timeout for image processing
    let timeoutId: NodeJS.Timeout | null = null;
    if (controller) timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(workflowUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined,
    });

    if (timeoutId) clearTimeout(timeoutId);

    const text = await response.text().catch(() => '');
    let parsed: any = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = { raw: text };
    }

    // Forward status and body, but do not leak the API key
    if (!response.ok) {
      return res.status(response.status).json({
        status: 'error',
        httpStatus: response.status,
        message: parsed?.message || parsed?.error || parsed || response.statusText,
        responseBody: parsed,
      });
    }

    return res.status(200).json({
      status: 'ok',
      httpStatus: response.status,
      responseBody: parsed,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    const isAbort = err && (err.name === 'AbortError' || err.code === 'ABORT_ERR');
    return res.status(502).json({
      status: isAbort ? 'timeout' : 'offline',
      error: err?.message || String(err),
      timestamp: new Date().toISOString(),
    });
  }
}

export default async function handler(req: any, res: any) {
  // Simple health check - just verify API key is configured
  const apiKey = process.env.ROBOFLOW_API_KEY || 'hFTl5s6IVgFqAXKmxfyj';
  let workflowUrl =
    process.env.ROBOFLOW_WORKFLOW_URL ||
    'https://serverless.roboflow.com/kumar-ritovash/workflows/building-infrastructure-defects-logic';
  if (workflowUrl && !workflowUrl.startsWith('http://') && !workflowUrl.startsWith('https://')) {
    workflowUrl = `https://serverless.roboflow.com/kumar-ritovash/workflows/${workflowUrl}`;
  }

  const configured = Boolean(apiKey);

  // If API key is missing, return error
  if (!apiKey) {
    return res.status(500).json({
      status: 'error',
      message: 'ROBOFLOW_API_KEY is missing from server environment variables.',
      configured: false,
      workflowId: 'building-infrastructure-defects-logic',
      workflowUrl,
      timestamp: new Date().toISOString(),
    });
  }

  // API key is configured - return online status
  // Don't try to connect to Roboflow in health check to avoid timeouts
  return res.status(200).json({
    status: 'online',
    configured: true,
    workflowId: 'building-infrastructure-defects-logic',
    workflowUrl,
    message: 'Roboflow API Key configured and proxy ready',
    timestamp: new Date().toISOString(),
  });
}

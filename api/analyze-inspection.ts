import { analyzeStructuralImage } from '../server/analysisEngine';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      // keep body
    }
  }

  const { image, imageUrl, element, buildingCode, locationDetails } = body || {};
  const targetImage = image || imageUrl;

  if (!targetImage) {
    return res.status(400).json({
      error: 'No image data provided for inspection analysis.',
    });
  }

  try {
    const analysis = await analyzeStructuralImage(
      targetImage,
      element || (buildingCode ? `${buildingCode} Component` : 'Primary Structural Member')
    );
    return res.status(200).json(analysis);
  } catch (error: any) {
    console.error('Inspection Analysis Pipeline Error (/api/analyze-inspection):', error);
    return res.status(502).json({
      error: error?.message || 'Structural analysis failed on both Roboflow CV and Gemini fallback pipelines.',
      details: error?.message,
    });
  }
}

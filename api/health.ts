export default function handler(_req: any, res: any) {
  res.status(200).json({
    status: 'ok',
    service: 'StructuralAI Engine',
    timestamp: new Date().toISOString(),
    roboflowWorkflowId: 'building-infrastructure-defects-logic',
    roboflowEndpoint: 'https://serverless.roboflow.com/kumar-ritovash/workflows/building-infrastructure-defects-logic',
    roboflowConfigured: Boolean(process.env.ROBOFLOW_API_KEY),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
}

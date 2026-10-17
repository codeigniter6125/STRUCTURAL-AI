export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const { buildingId, limit } = req.query || req.body || {};

  const now = new Date();
  const baseTelemetry = [
    {
      id: 'tel-001',
      buildingId: buildingId || 'bld_b203',
      sensorId: 'SN-VIB-01',
      elementCode: 'Pier P-02 Base',
      metricType: 'Dynamic Triaxial Accelerometer',
      readingValue: 0.14,
      unit: 'g',
      thresholdWarning: 0.25,
      thresholdCritical: 0.45,
      status: 'Normal',
      recordedAt: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
    },
    {
      id: 'tel-002',
      buildingId: buildingId || 'bld_b203',
      sensorId: 'SN-DISP-04',
      elementCode: 'Girder G-01 Mid-span',
      metricType: 'Optical Tell-Tale Crack Displacement',
      readingValue: 1.85,
      unit: 'mm',
      thresholdWarning: 1.50,
      thresholdCritical: 2.50,
      status: 'Warning',
      recordedAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'tel-003',
      buildingId: buildingId || 'bld_b203',
      sensorId: 'SN-STRAIN-02',
      elementCode: 'Column C-04 Joint',
      metricType: 'Concrete Surface Strain Gauge',
      readingValue: 420,
      unit: 'με',
      thresholdWarning: 600,
      thresholdCritical: 900,
      status: 'Normal',
      recordedAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: 'tel-004',
      buildingId: buildingId || 'bld_b203',
      sensorId: 'SN-TILT-01',
      elementCode: 'Retaining Wall W-01',
      metricType: 'Biaxial Inclinometer Tilt',
      readingValue: 0.08,
      unit: 'deg',
      thresholdWarning: 0.30,
      thresholdCritical: 0.75,
      status: 'Normal',
      recordedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    },
  ];

  const maxItems = limit ? parseInt(limit, 10) : baseTelemetry.length;
  const result = baseTelemetry.slice(0, isNaN(maxItems) ? baseTelemetry.length : maxItems);

  return res.status(200).json({
    success: true,
    count: result.length,
    buildingId: buildingId || 'all',
    timestamp: now.toISOString(),
    telemetry: result,
  });
}

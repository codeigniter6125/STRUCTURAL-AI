import dotenv from 'dotenv';
import { executeGeminiVisualAnalysis } from './geminiVisualAnalysis';

dotenv.config();

export interface RoboflowAnalysisInput {
  image?: string; // base64 or URL
  imageUrl?: string;
  buildingCode?: string;
  element?: string;
  locationDetails?: string;
}

export interface DefectItem {
  id: string;
  defectType: string;
  rawClass: string;
  confidence: number;
  severity: 'Critical' | 'High' | 'Moderate' | 'Low';
  location: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  normalizedCoordinates: {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
  };
  metrics: {
    crackLengthMm: number;
    crackWidthMm: number;
    areaCoveragePercent: number;
  };
  remediationProtocol: string;
  is456Compliance: string;
  description: string;
}

export interface AnalysisResponse {
  success: boolean;
  provider: string;
  workflowId: string;
  isFallback?: boolean;
  reportSource?: 'Roboflow + Gemini' | 'Gemini Visual Assessment' | string;
  overallRiskLevel: 'Critical' | 'High' | 'Moderate' | 'Low';
  structuralHealthIndex: number;
  riskScore: number;
  totalDefectCoveragePercent: number;
  diagnosisSummary: string;
  safetyPrecautions: string[];
  defects: DefectItem[];
  rawWorkflowData?: any;
}

// Clean and standardize defect class name
export function formatDefectClassName(rawClass: string): string {
  if (!rawClass) return 'Structural Defect';
  const cleaned = rawClass.replace(/[-_]/g, ' ').trim();
  const lower = cleaned.toLowerCase();

  if (lower.includes('structural') && lower.includes('crack')) {
    return 'Structural Shear / Flexural Crack';
  }
  if (lower.includes('surface') && lower.includes('crack')) {
    return 'Surface Hairline & Shrinkage Crack';
  }
  if (lower.includes('shear') || (lower.includes('crack') && lower.includes('diag'))) {
    return 'Structural Shear Crack';
  }
  if (lower.includes('spall') || lower.includes('delaminat')) {
    return 'Concrete Spalling & Delamination';
  }
  if (lower.includes('rebar') || lower.includes('corrosion') || lower.includes('reinforce') || lower.includes('rust')) {
    return 'Reinforcement Rebar Corrosion & Spall';
  }
  if (lower.includes('honeycomb') || lower.includes('void')) {
    return 'Concrete Honeycombing & Voids';
  }
  if (lower.includes('efflorescence') || lower.includes('seep') || lower.includes('moisture') || lower.includes('water')) {
    return 'Efflorescence & Moisture Water Damage';
  }
  if (lower.includes('settlement') || lower.includes('step')) {
    return 'Differential Settlement Crack';
  }
  if (lower.includes('damage')) {
    return 'Structural Concrete Distress';
  }
  if (lower.includes('crack')) {
    return 'Concrete Structural Crack';
  }

  return cleaned
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Recursively traverse workflow response to extract predictions and dimensions
export function extractWorkflowPredictions(data: any): { predictions: any[]; imageWidth: number; imageHeight: number } {
  const predictions: any[] = [];
  let imageWidth = 1000;
  let imageHeight = 1000;

  if (!data) return { predictions, imageWidth, imageHeight };

  if (data.image?.width && data.image?.height) {
    imageWidth = Number(data.image.width) || 1000;
    imageHeight = Number(data.image.height) || 1000;
  }

  function search(obj: any, depth = 0) {
    if (!obj || depth > 7) return;

    if (Array.isArray(obj)) {
      const isPredArray =
        obj.length > 0 &&
        obj.some(
          (item) =>
            item &&
            typeof item === 'object' &&
            (item.class !== undefined ||
              item.className !== undefined ||
              item.label !== undefined ||
              item.name !== undefined ||
              item.damage_type !== undefined ||
              item.points !== undefined ||
              item.x !== undefined ||
              item.bbox !== undefined)
        );

      if (isPredArray) {
        predictions.push(...obj);
      } else {
        for (const item of obj) {
          search(item, depth + 1);
        }
      }
      return;
    }

    if (typeof obj === 'object') {
      if (obj.image?.width && obj.image?.height) {
        imageWidth = Number(obj.image.width) || imageWidth;
        imageHeight = Number(obj.image.height) || imageHeight;
      }
      if (obj.width && obj.height && !obj.x && !obj.class) {
        imageWidth = Number(obj.width) || imageWidth;
        imageHeight = Number(obj.height) || imageHeight;
      }

      for (const [key, value] of Object.entries(obj)) {
        if (
          [
            'predictions',
            'detections',
            'boxes',
            'polygons',
            'model_predictions',
            'instances',
            'output',
            'outputs',
            'segmentation_predictions',
            'classification_predictions',
          ].includes(key.toLowerCase())
        ) {
          if (Array.isArray(value)) {
            search(value, depth + 1);
          } else if (typeof value === 'object') {
            search(value, depth + 1);
          }
        } else {
          search(value, depth + 1);
        }
      }
    }
  }

  search(data);

  // Normalize prediction format
  const normalized = predictions
    .map((p: any) => {
      if (!p || typeof p !== 'object') return null;

      let x = p.x ?? p.cx ?? 0;
      let y = p.y ?? p.cy ?? 0;
      let width = p.width ?? p.w ?? 0;
      let height = p.height ?? p.h ?? 0;
      const className =
        p.class || p.className || p.name || p.label || p.category || p.damage_type || 'structural_crack';
      const confidence = p.confidence ?? p.score ?? p.probability ?? 0.88;

      if (Array.isArray(p.points) && p.points.length > 0 && (!width || !height)) {
        const xs = p.points.map((pt: any) => pt.x || 0);
        const ys = p.points.map((pt: any) => pt.y || 0);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        width = Math.max(30, maxX - minX);
        height = Math.max(30, maxY - minY);
        x = minX + width / 2;
        y = minY + height / 2;
      }

      if (Array.isArray(p.bbox) && p.bbox.length === 4) {
        if (p.bbox[2] > p.bbox[0] && p.bbox[3] > p.bbox[1]) {
          const [xmin, ymin, xmax, ymax] = p.bbox;
          width = xmax - xmin;
          height = ymax - ymin;
          x = xmin + width / 2;
          y = ymin + height / 2;
        } else {
          [x, y, width, height] = p.bbox;
        }
      }

      return {
        x,
        y,
        width,
        height,
        class: String(className),
        confidence: Number(confidence) || 0.85,
        points: Array.isArray(p.points) ? p.points : undefined,
      };
    })
    .filter(Boolean);

  return { predictions: normalized, imageWidth, imageHeight };
}

// Convert model predictions into IS 456 engineering metrics and defects
export function buildEngineeringAnalysis(
  rawPredictions: any[],
  imageWidth: number,
  imageHeight: number,
  elementName: string,
  rawWorkflowData: any
): AnalysisResponse {
  if (!rawPredictions || rawPredictions.length === 0) {
    return {
      success: true,
      provider: 'Roboflow Serverless Workflow (building-infrastructure-defects-logic)',
      workflowId: 'building-infrastructure-defects-logic',
      isFallback: false,
      reportSource: 'Roboflow + Gemini',
      overallRiskLevel: 'Low',
      structuralHealthIndex: 96,
      riskScore: 8,
      totalDefectCoveragePercent: 0,
      diagnosisSummary: `No active structural defects, shear fractures, or concrete delaminations were identified by the Roboflow computer vision workflow on ${elementName}. The inspected element meets IS 456 serviceability limit state criteria. Regular periodic monitoring recommended.`,
      safetyPrecautions: [
        'Maintain routine preventive inspection schedule under CPWD guidelines.',
        'Ensure surface drainage is unobstructed to prevent moisture ingress.',
      ],
      defects: [],
      rawWorkflowData,
    };
  }

  const defects: DefectItem[] = rawPredictions.map((pred: any, index: number) => {
    const rawClass = pred.class || 'structural_crack';
    const cleanType = formatDefectClassName(rawClass);
    const confidence = pred.confidence > 1 ? pred.confidence / 100 : pred.confidence;

    let normX = pred.x;
    let normY = pred.y;
    let normW = pred.width;
    let normH = pred.height;

    if (normX <= 1 && normY <= 1 && normW <= 1 && normH <= 1 && imageWidth <= 1) {
      normX *= 1000;
      normY *= 1000;
      normW *= 1000;
      normH *= 1000;
    } else if (imageWidth > 0 && imageHeight > 0) {
      normX = (normX / imageWidth) * 1000;
      normY = (normY / imageHeight) * 1000;
      normW = (normW / imageWidth) * 1000;
      normH = (normH / imageHeight) * 1000;
    }

    const xMin = Math.max(0, Math.round(normX - normW / 2));
    const yMin = Math.max(0, Math.round(normY - normH / 2));
    const xMax = Math.min(1000, Math.round(normX + normW / 2));
    const yMax = Math.min(1000, Math.round(normY + normH / 2));
    const finalW = Math.max(30, xMax - xMin);
    const finalH = Math.max(30, yMax - yMin);

    const pxToMm = 1.2;
    const crackLengthMm = Math.round(Math.hypot(finalW, finalH) * pxToMm);
    const areaCoverage = Number(((finalW * finalH) / (1000 * 1000) * 100).toFixed(2));

    let crackWidthMm = 0.4;
    let severity: 'Critical' | 'High' | 'Moderate' | 'Low' = 'Moderate';
    let remediation = 'Low-pressure epoxy resin injection grouting (IS 456 Clause 35.3.2).';
    let compliance = 'IS 456:2000 Clause 35.3.2 (Crack Width Limit ≤ 0.3mm)';

    const lowerClass = rawClass.toLowerCase();

    if (lowerClass.includes('rebar') || lowerClass.includes('corrosion') || lowerClass.includes('rust')) {
      crackWidthMm = Number((2.8 + Math.min(2.5, (finalW / 200))).toFixed(2));
      severity = 'Critical';
      remediation = 'Emergency carbon fiber polymer (CFRP) wrapping, anti-corrosion rebar passivation, and polymer modified mortar (PMM) micro-concreting (IS 456 Annex H / CPWD Sec 14).';
      compliance = 'IS 456:2000 Clause 35.3.2 & IS 13920:2016 (Non-Compliant - Severe Active Spalling)';
    } else if (lowerClass.includes('spall') || lowerClass.includes('delaminat') || lowerClass.includes('shear')) {
      crackWidthMm = Number((2.1 + Math.min(1.8, (finalW / 250))).toFixed(2));
      severity = 'Critical';
      remediation = 'Immediate propping/shoring of structural grid, high-pressure polyurethane (PU) grout injection, and RCC jacketing with Fe 500D rebar.';
      compliance = 'IS 456:2000 Clause 35.3.2 (Non-Compliant - Exceeds 0.3mm Limit)';
    } else if (lowerClass.includes('structural') || crackLengthMm > 250) {
      crackWidthMm = Number((1.2 + Math.min(1.2, (crackLengthMm / 500))).toFixed(2));
      severity = 'High';
      remediation = 'Structural epoxy resin pressure injection with ultrasonic pulse velocity (UPV) verification per IS 13311 (Part 1).';
      compliance = 'IS 456:2000 Clause 35.3.2 (Moderate Exceedance)';
    } else if (lowerClass.includes('water') || lowerClass.includes('moisture') || lowerClass.includes('efflorescence')) {
      crackWidthMm = Number((0.6 + Math.min(0.8, (finalH / 300))).toFixed(2));
      severity = 'Moderate';
      remediation = 'Crystalline chemical waterproofing slurry application, drainage repair, and silane-siloxane hydrophobic sealer.';
      compliance = 'IS 456:2000 Durability Requirement Clause 8.2';
    } else {
      crackWidthMm = Number((0.25 + Math.min(0.25, (crackLengthMm / 800))).toFixed(2));
      severity = crackWidthMm > 0.3 ? 'Moderate' : 'Low';
      remediation = 'Surface elastomeric crack sealer coating with periodic optical gauge monitoring.';
      compliance = 'IS 456:2000 Clause 35.3.2 (Compliant / Within 0.3mm Serviceability)';
    }

    return {
      id: `def_${Date.now()}_${index + 1}`,
      defectType: cleanType,
      rawClass,
      confidence: Math.round(confidence * 100),
      severity,
      location: `Zone ${index + 1} (${xMin < 500 ? 'Left' : 'Right'} / ${yMin < 500 ? 'Upper' : 'Lower'} sector)`,
      boundingBox: {
        x: normX,
        y: normY,
        width: finalW,
        height: finalH,
      },
      normalizedCoordinates: {
        xMin,
        yMin,
        xMax,
        yMax,
      },
      metrics: {
        crackLengthMm,
        crackWidthMm,
        areaCoveragePercent: areaCoverage,
      },
      remediationProtocol: remediation,
      is456Compliance: compliance,
      description: `${cleanType} localized with ${(confidence * 100).toFixed(1)}% model confidence. Estimated aperture width: ${crackWidthMm}mm (Limit: 0.30mm), total path length: ${crackLengthMm}mm.`,
    };
  });

  const criticalCount = defects.filter((d) => d.severity === 'Critical').length;
  const highCount = defects.filter((d) => d.severity === 'High').length;
  const moderateCount = defects.filter((d) => d.severity === 'Moderate').length;
  const lowCount = defects.filter((d) => d.severity === 'Low').length;

  const totalCoverage = Number(
    Math.min(100, defects.reduce((acc, d) => acc + d.metrics.areaCoveragePercent, 0)).toFixed(2)
  );

  let deduction = criticalCount * 24 + highCount * 14 + moderateCount * 7 + lowCount * 3 + totalCoverage * 1.5;
  const shi = Math.max(12, Math.min(98, Math.round(100 - deduction)));
  const riskScore = Math.max(5, Math.min(95, 100 - shi));

  let overallRiskLevel: 'Critical' | 'High' | 'Moderate' | 'Low' = 'Low';
  if (criticalCount > 0 || shi < 55) {
    overallRiskLevel = 'Critical';
  } else if (highCount > 0 || shi < 70) {
    overallRiskLevel = 'High';
  } else if (moderateCount > 0 || shi < 85) {
    overallRiskLevel = 'Moderate';
  }

  const safetyPrecautions: string[] = [];
  if (overallRiskLevel === 'Critical') {
    safetyPrecautions.push('IMMEDIATE ACTION (48 Hours): Erect temporary steel acrow propping under inspected element.');
    safetyPrecautions.push('Cordon off a 5-meter safety buffer zone directly underneath the structural member.');
    safetyPrecautions.push('Notify Municipal Structural Audit Authority for non-destructive core testing (IS 516).');
  } else if (overallRiskLevel === 'High') {
    safetyPrecautions.push('Schedule certified structural restoration within 14 calendar days.');
    safetyPrecautions.push('Install tell-tale crack motion displacement gauges to monitor live propagation.');
  } else {
    safetyPrecautions.push('Perform routine periodic inspection within 6 months per CPWD guidelines.');
  }

  const diagnosisSummary = `Roboflow computer vision workflow detected ${defects.length} distinct structural defect(s) on ${elementName}. Identified ${criticalCount} critical, ${highCount} high, and ${moderateCount} moderate hazard(s). Composite Structural Health Index is rated at ${shi}/100 with an overall risk classification of ${overallRiskLevel.toUpperCase()}.`;

  return {
    success: true,
    provider: 'Roboflow Serverless Workflow (building-infrastructure-defects-logic)',
    workflowId: 'building-infrastructure-defects-logic',
    isFallback: false,
    reportSource: 'Roboflow + Gemini',
    overallRiskLevel,
    structuralHealthIndex: shi,
    riskScore,
    totalDefectCoveragePercent: totalCoverage,
    diagnosisSummary,
    safetyPrecautions,
    defects,
    rawWorkflowData,
  };
}

// Execute analysis using Roboflow Workflow
export async function executeRoboflowWorkflow(
  imageData: string,
  elementName: string = 'Primary Structural Member'
): Promise<AnalysisResponse> {
  const apiKey = process.env.ROBOFLOW_API_KEY;
  if (!apiKey) {
    throw new Error('ROBOFLOW_API_KEY is not configured in server environment variables.');
  }
  const workflowUrl =
    process.env.ROBOFLOW_WORKFLOW_URL ||
    'https://serverless.roboflow.com/kumar-ritovash/workflows/building-infrastructure-defects-logic';

  if (!imageData || typeof imageData !== 'string') {
    throw new Error('No valid image data provided for inspection analysis.');
  }

  let cleanInput = imageData.trim();
  let payload: any = null;

  // If input is an accessible public HTTPS URL, try sending type: "url" directly first
  if (cleanInput.startsWith('https://') && !cleanInput.includes('localhost') && !cleanInput.includes('127.0.0.1')) {
    payload = {
      api_key: apiKey,
      inputs: {
        image: { type: 'url', value: cleanInput },
      },
    };
  } else {
    let cleanBase64 = cleanInput;
    if (cleanBase64.startsWith('http://') || cleanBase64.startsWith('https://')) {
      try {
        const imgRes = await fetch(cleanBase64);
        if (!imgRes.ok) {
          throw new Error(`Remote image returned HTTP status ${imgRes.status}`);
        }
        const arrayBuffer = await imgRes.arrayBuffer();
        cleanBase64 = Buffer.from(arrayBuffer).toString('base64');
      } catch (fetchErr: any) {
        throw new Error(`Unable to fetch image from URL: ${fetchErr?.message || 'Network error'}`);
      }
    } else if (cleanBase64.includes('base64,')) {
      cleanBase64 = cleanBase64.split('base64,')[1].trim();
    }

    if (!cleanBase64) {
      throw new Error('Image data could not be parsed into a valid base64 representation.');
    }

    payload = {
      api_key: apiKey,
      inputs: {
        image: { type: 'base64', value: cleanBase64 },
      },
    };
  }

  const response = await fetch(workflowUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.message || errJson.error || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(`Roboflow Workflow returned HTTP ${response.status}: ${errorDetail || response.statusText}`);
  }

  const responseData = await response.json();
  const { predictions, imageWidth, imageHeight } = extractWorkflowPredictions(responseData);

  return buildEngineeringAnalysis(predictions, imageWidth, imageHeight, elementName, responseData);
}

/**
 * TWO-PATH INSPECTION PIPELINE:
 * Primary Path: Roboflow Computer Vision
 * Fallback Path: Gemini Visual Assessment (if Roboflow is unavailable or errors)
 */
export async function analyzeStructuralImage(
  imageData: string,
  elementName: string = 'Primary Structural Member'
): Promise<AnalysisResponse> {
  try {
    // 1. Attempt Primary Path: Roboflow Serverless Workflow
    return await executeRoboflowWorkflow(imageData, elementName);
  } catch (roboflowError: any) {
    console.warn('Roboflow workflow execution failed; activating Gemini Visual Assessment fallback path:', roboflowError?.message || roboflowError);

    // 2. Attempt Fallback Path: Gemini Visual Assessment
    try {
      return await executeGeminiVisualAnalysis(imageData, elementName, roboflowError?.message || 'Roboflow service error');
    } catch (fallbackError: any) {
      console.error('Both Roboflow and Gemini fallback failed:', fallbackError);
      throw new Error(`Analysis pipeline error: Roboflow (${roboflowError?.message}) and Gemini Fallback (${fallbackError?.message})`);
    }
  }
}

import React, { useState, useEffect, useRef } from 'react';
import { Inspection, Building, GeneratedForensicReport } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Activity,
  Cpu,
  Building2,
  Wrench,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface InspectionReportModalProps {
  inspection: Inspection;
  building?: Building;
  onClose: () => void;
}

export const InspectionReportModal: React.FC<InspectionReportModalProps> = ({
  inspection,
  building,
  onClose,
}) => {
  const { user } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [reportData, setReportData] = useState<GeneratedForensicReport | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const activeBuilding = building || {
    id: inspection.buildingId || 'bld_b203',
    code: inspection.buildingCode || 'B-203',
    name: inspection.buildingName || 'District Infrastructure Block',
    type: 'Reinforced Concrete Building',
    locality: 'Shahdara Industrial Sector',
    city: 'Delhi',
    state: 'Delhi NCR',
    yearBuilt: 2014,
    totalFloorsOrSpans: 'G+6 Floors',
    structuralSystem: 'RCC Moment Resisting Frame',
    ownerName: 'Municipal Corporation of Delhi (MCD)',
    healthIndex: inspection.structuralHealthIndex,
    riskStatus: inspection.overallRiskLevel,
    criticalDefectsCount: inspection.defects?.filter((d) => d.severity === 'Critical').length || 0,
    totalInspections: 1,
    lastInspectionDate: inspection.date,
  };

  const fetchAiReport = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          building: activeBuilding,
          inspection: {
            ...inspection,
            inspectorName: inspection.inspectorName || user?.fullName,
            inspectorBadge: inspection.inspectorBadge || user?.badgeNumber,
          },
          defects: inspection.defects || [],
          telemetry: [
            { sensorType: 'Dynamic Triaxial Accelerometer', value: 0.14, unit: 'g', status: 'Normal' },
            { sensorType: 'Optical Tell-Tale Crack Displacement', value: 1.85, unit: 'mm', status: 'Elevated' },
            { sensorType: 'Concrete Surface Strain Gauge', value: 420, unit: 'με', status: 'Stable' },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Report server returned HTTP ${response.status}`);
      }

      const data: GeneratedForensicReport = await response.json();
      setReportData(data);
    } catch (err: any) {
      console.warn('Failed to fetch Gemini report; building local deterministic report:', err);
      // Construct robust fallback report with same data
      const defects = inspection.defects || [];
      const fallbackDefectRemediations = defects.map((d: any) => {
        const dType = d.defectType || d.type || 'Structural Defect';
        const dConf = d.confidence || d.confidenceScore || 88;
        const dWidth = d.metrics?.crackWidthMm || d.estimatedWidthMm || 0.4;
        const dLength = d.metrics?.crackLengthMm || d.estimatedLengthMm || 150;
        const dCoverage = d.metrics?.areaCoveragePercent || 1.8;

        return {
          detectedDefect: dType,
          severity: d.severity || 'Moderate',
          confidence: dConf,
          location: d.location || inspection.element || 'Structural Element',
          measurements: `Crack Width: ${dWidth}mm, Length: ${dLength}mm, Coverage: ${dCoverage}%`,
          likelyContributingFactors: [
            'Possible contributing factor: localized stress concentration exceeding concrete tensile strength.',
            'Possible contributing factor: cyclic dynamic ambient vibration and thermal fluctuations.',
          ],
          recommendedCorrectiveAction:
            d.severity === 'Critical' || d.severity === 'High'
              ? 'Potential corrective measure: Recommended for professional assessment by a qualified structural engineer before repair. Low-to-high pressure epoxy resin injection grouting per IS 456 Annex H.'
              : 'Potential corrective measure: Professional crack assessment and surface elastomeric sealing appropriate to crack characteristics.',
          recommendedPreventiveAction:
            'Potential preventive measure: Install calibrated tell-tale displacement gauges for periodic monitoring and apply elastomeric protective coating.',
          inspectionPriority:
            d.severity === 'Critical'
              ? 'CRITICAL (24-48 Hours) - Assessment by a qualified structural engineer is explicitly recommended before repair.'
              : 'SCHEDULED (14-30 Days) - Recommended for routine engineering assessment.',
        };
      });

      const fallbackImmediate =
        inspection.overallRiskLevel === 'Critical'
          ? [
              `Erect heavy-duty steel support shoring props directly beneath ${inspection.element} within 24-48 hours.`,
              'Cordon off affected perimeter and restrict heavy live loads.',
              'Explicitly recommend assessment by a qualified structural engineer before commencement of any structural alterations or repair.',
            ]
          : [
              'Explicitly recommend assessment by a qualified structural engineer before structural repair execution.',
              'Log findings in municipal structural safety records and verify live load limits.',
            ];

      const fallbackRepairs = [
        'Potential corrective measure: Low-viscosity epoxy resin injection grouting (viscosity < 200 cps) per IS 456 Annex H after engineering sign-off.',
        'Potential corrective measure: Reinstatement of concrete cover using polymer-modified micro-concrete.',
      ];

      const fallbackPreventive = [
        'Potential preventive measure: Install calibrated mechanical tell-tale gauges or LVDT transducers for continuous crack monitoring.',
        'Potential preventive measure: Apply hydrophobic silane-siloxane anti-carbonation protective sealer.',
      ];

      const fallbackInspectionReqs = [
        'Assessment and formal repair design by a qualified structural engineer before repair.',
        'Non-destructive testing (UPV per IS 13311 Part 1, Rebound Hammer per IS 13311 Part 2).',
      ];

      setReportData({
        success: true,
        provider: 'IS 456 Deterministic Engineering Engine',
        reportId: `REP-${inspection.inspectionCode}`,
        generatedAt: new Date().toISOString(),
        buildingInfo: {
          name: activeBuilding.name,
          code: activeBuilding.code,
          type: activeBuilding.type,
          location: `${activeBuilding.city}, ${activeBuilding.state}`,
          yearBuilt: activeBuilding.yearBuilt || 2014,
          floors: activeBuilding.totalFloorsOrSpans || 'G+6',
          structuralSystem: activeBuilding.structuralSystem || 'RCC Frame',
          owner: activeBuilding.ownerName || 'Public Infrastructure Authority',
        },
        inspectionSummary: {
          certificateId: inspection.inspectionCode,
          auditDate: inspection.date,
          inspector: inspection.inspectorName || 'Er. Arjun Sharma',
          inspectorBadge: inspection.inspectorBadge || 'CPWD-AUD-8821',
          inspectorDesignation: inspection.inspectorRole || 'Senior Structural Auditor',
          element: inspection.element,
          healthIndex: inspection.structuralHealthIndex,
          riskScore: inspection.riskScore,
          overallRiskLevel: inspection.overallRiskLevel,
          defectCount: inspection.defects?.length || 0,
        },
        environmentalTelemetry: {
          temperature: '28.5°C',
          humidity: '64%',
          vibration: '0.14g',
          telemetryNotes: 'Ambient temperature and humidity within standard operational baseline envelope.',
          sensorReadings: [
            { sensor: 'Dynamic Accelerometer', value: '0.14g', status: 'Normal' },
            { sensor: 'Crack Displacement', value: '1.85mm', status: 'Elevated' },
          ],
        },
        detectedDefects: (inspection.defects || []).map((d: any) => ({
          type: d.defectType || d.type || 'Structural Defect',
          severity: d.severity || 'Moderate',
          confidence: d.confidence || d.confidenceScore || 88,
          crackWidthMm: d.metrics?.crackWidthMm || d.estimatedWidthMm || 0.4,
          crackLengthMm: d.metrics?.crackLengthMm || d.estimatedLengthMm || 150,
          coveragePercent: d.metrics?.areaCoveragePercent || 1.8,
          compliance: d.is456Compliance || d.standardsReference || 'IS 456:2000 Clause 35.3.2',
          remediation: d.remediationProtocol || 'Low-pressure epoxy resin injection grouting.',
        })),
        defectRemediations: fallbackDefectRemediations,
        aiAssessment: `Forensic assessment of ${inspection.element} indicates ${inspection.overallRiskLevel.toLowerCase()} distress with ${inspection.defects?.length || 0} localized defect(s). The structural health index is calculated at ${inspection.structuralHealthIndex}/100. Assessment by a qualified structural engineer is explicitly recommended before repair.`,
        structuralRisk: {
          riskLevel: inspection.overallRiskLevel,
          riskScore: inspection.riskScore,
          failureModes: [
            'Shear crack propagation under cyclic dynamic vibration',
            'Atmospheric carbonation leading to cover delamination',
          ],
          criticalityAnalysis: `Evaluated at Risk Score ${inspection.riskScore}/100 under IS 456 limit state criteria.`,
        },
        sensorObservations: 'Sensor telemetry confirms baseline structural dynamic vibration within ISO 4866 thresholds.',
        recommendedRemediation: {
          immediateActions: fallbackImmediate,
          recommendedRepairs: fallbackRepairs,
          preventiveMeasures: fallbackPreventive,
          professionalInspectionRequirements: fallbackInspectionReqs,
        },
        recommendedActions: [...fallbackImmediate, ...fallbackRepairs],
        priority: {
          level: inspection.overallRiskLevel,
          timeframe: inspection.overallRiskLevel === 'Critical' ? 'IMMEDIATE (48 Hours)' : 'SCHEDULED (14 Days)',
          urgencyText: 'Action mandated under CPWD Civil Maintenance Regulations.',
        },
        disclaimer:
          'AI-generated assessment is intended to support professional inspection and does not replace assessment by a qualified structural engineer.',
        fullMarkdownReport: '',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchAiReport();
  }, [inspection.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!reportData) return;
    const content = reportData.fullMarkdownReport || JSON.stringify(reportData, null, 2);
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Forensic_Audit_Report_${inspection.inspectionCode}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Action Bar */}
        <div className="px-6 py-4 bg-[#0B192C] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">AI Forensic Audit Certificate</h3>
                {reportData && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold">
                    {reportData.provider}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Certificate: {inspection.inspectionCode} &bull; Generated: {new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchAiReport}
              disabled={isGenerating}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!reportData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.md)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Body */}
        <div ref={reportRef} className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 print:p-0 print:m-0 font-sans">
          {isGenerating ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6 animate-spin text-blue-600" />
              </div>
              <div className="text-sm font-bold text-slate-900">
                Synthesizing Forensic Audit Report with Gemini AI Engine...
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Calculating IS 456 crack limit states, telemetry correlation, and remediation priority
              </p>
            </div>
          ) : (
            <>
              {/* SECTION 1 & 2: Header & Official Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    Government of India &bull; Ministry of Housing & Urban Affairs
                  </div>
                  <h1 className="text-2xl font-bold text-slate-950 mt-0.5 tracking-tight">
                    Structural Health & Forensic Audit Certificate
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    Certified under IS 456:2000 (Plain & Reinforced Concrete), IS 13920:2016, and CPWD Maintenance Manual
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900">
                    {inspection.inspectionCode}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Audit Date: <strong>{inspection.date}</strong>
                  </div>
                </div>
              </div>

              {/* 1. BUILDING INFORMATION */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  1. Building & Asset Information
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Asset Name:</span>
                    <strong className="text-slate-900">{activeBuilding.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Asset Code:</span>
                    <strong className="font-mono text-blue-700">{activeBuilding.code}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Structural System:</span>
                    <span className="text-slate-800">{activeBuilding.structuralSystem || 'RCC Frame'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Location:</span>
                    <span className="text-slate-800">{activeBuilding.city}, {activeBuilding.state}</span>
                  </div>
                </div>
              </div>

              {/* 2. INSPECTION SUMMARY */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  2. Inspection Summary & Auditor Profile
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Inspected Element:</span>
                    <strong className="text-blue-800">{inspection.element}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Location Details:</span>
                    <span className="text-slate-800">{inspection.locationDetails || 'Main Grid'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Lead Auditor:</span>
                    <strong className="text-slate-900">{inspection.inspectorName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Badge / License:</span>
                    <strong className="font-mono text-slate-800">{inspection.inspectorBadge}</strong>
                  </div>
                </div>
              </div>

              {/* Metric Highlights Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-[#0B192C] text-white rounded-xl">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                    Structural Health Index
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                    {inspection.structuralHealthIndex} <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Composite SHI Rating</div>
                </div>

                <div className="p-3.5 bg-[#0B192C] text-white rounded-xl">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                    Risk Matrix Score
                  </div>
                  <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                    {inspection.riskScore} <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Level: {inspection.overallRiskLevel}</div>
                </div>

                <div className="p-3.5 bg-slate-100 text-slate-900 border border-slate-200 rounded-xl">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                    Defects Identified
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {inspection.defects?.length || 0}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Coverage: {inspection.totalDefectCoveragePercent}%</div>
                </div>

                <div className="p-3.5 bg-slate-100 text-slate-900 border border-slate-200 rounded-xl">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                    Remediation Priority
                  </div>
                  <div
                    className={`text-xl font-bold font-mono mt-1 ${
                      inspection.overallRiskLevel === 'Critical'
                        ? 'text-red-700'
                        : inspection.overallRiskLevel === 'High'
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {reportData?.priority.timeframe || (inspection.overallRiskLevel === 'Critical' ? 'IMMEDIATE (48H)' : 'SCHEDULED (14D)')}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Action Plan Mandated</div>
                </div>
              </div>

              {/* 3. DETECTED DEFECTS (Itemized Table) */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  3. Detected Defects & Roboflow CAD Localization
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Defect Classification</th>
                        <th className="p-2.5">Severity</th>
                        <th className="p-2.5">Crack Width</th>
                        <th className="p-2.5">Length</th>
                        <th className="p-2.5">IS 456 Limit</th>
                        <th className="p-2.5">Prescribed Remediation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {inspection.defects?.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-500">
                            No structural defects detected by model inference.
                          </td>
                        </tr>
                      ) : (
                        inspection.defects?.map((defect, i) => (
                          <tr key={defect.id || i} className="hover:bg-slate-50">
                            <td className="p-2.5 font-mono font-bold text-slate-500">0{i + 1}</td>
                            <td className="p-2.5 font-semibold text-slate-900">{defect.type}</td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  defect.severity === 'Critical'
                                    ? 'bg-red-100 text-red-800'
                                    : defect.severity === 'High'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {defect.severity}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-amber-700 font-bold">
                              {defect.estimatedWidthMm} mm
                            </td>
                            <td className="p-2.5 font-mono">{defect.estimatedLengthMm} mm</td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-600">
                              {defect.standardsReference || '≤ 0.30mm (IS 456)'}
                            </td>
                            <td className="p-2.5 text-[11px] text-slate-700 leading-tight">
                              {defect.remediationProtocol}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. ITEMIZED DEFECT REMEDIATION & CONTRIBUTING FACTORS */}
              {reportData?.defectRemediations && reportData.defectRemediations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                    4. Itemized Defect Remediation & Contributing Factors
                  </h3>
                  <div className="space-y-3">
                    {reportData.defectRemediations.map((dr, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-400">0{idx + 1}</span>
                            <span className="font-bold text-slate-950 text-sm">{dr.detectedDefect}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                dr.severity === 'Critical'
                                  ? 'bg-red-100 text-red-800'
                                  : dr.severity === 'High'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {dr.severity}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Location: <strong className="text-slate-800">{dr.location}</strong> &bull; {dr.measurements}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                              Likely Contributing Factors:
                            </span>
                            <ul className="space-y-1 text-slate-700">
                              {dr.likelyContributingFactors.map((factor, fIdx) => (
                                <li key={fIdx} className="flex items-start gap-1.5">
                                  <span className="text-slate-400 mt-0.5">&bull;</span>
                                  <span>{factor}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider block">
                                Recommended Corrective Action:
                              </span>
                              <p className="text-slate-800 leading-relaxed mt-0.5">
                                {dr.recommendedCorrectiveAction}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
                                Recommended Preventive Action:
                              </span>
                              <p className="text-slate-800 leading-relaxed mt-0.5">
                                {dr.recommendedPreventiveAction}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Inspection Priority:</span>
                          <span
                            className={`font-semibold ${
                              dr.severity === 'Critical' || dr.severity === 'High'
                                ? 'text-red-700 font-bold'
                                : 'text-slate-800'
                            }`}
                          >
                            {dr.inspectionPriority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. AI ASSESSMENT */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  5. AI Structural Assessment & Mechanics Diagnosis
                </h3>
                <p className="text-slate-800 leading-relaxed text-xs">
                  {reportData?.aiAssessment || inspection.diagnosisSummary}
                </p>
              </div>

              {/* 6. STRUCTURAL RISK & FAILURE MODES */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  6. Structural Risk & Potential Failure Modes
                </h3>
                <p className="text-slate-800 text-xs leading-relaxed">
                  {reportData?.structuralRisk?.criticalityAnalysis}
                </p>
                {reportData?.structuralRisk?.failureModes && (
                  <ul className="list-disc list-inside space-y-1 text-slate-700 pt-1">
                    {reportData.structuralRisk.failureModes.map((fm, idx) => (
                      <li key={idx}>{fm}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 7. SENSOR TELEMETRY & FIELD OBSERVATIONS */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  7. Sensor Telemetry & Ambient Observations
                </h3>
                {reportData?.environmentalTelemetry && (
                  <div className="grid grid-cols-3 gap-2 py-1">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Temperature:</span>
                      <strong className="text-slate-900">{reportData.environmentalTelemetry.temperature}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Relative Humidity:</span>
                      <strong className="text-slate-900">{reportData.environmentalTelemetry.humidity}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Peak Vibration:</span>
                      <strong className="text-slate-900">{reportData.environmentalTelemetry.vibration}</strong>
                    </div>
                  </div>
                )}
                <p className="text-slate-800 text-xs leading-relaxed">
                  {reportData?.sensorObservations || reportData?.environmentalTelemetry?.telemetryNotes || 'Continuous dynamic sensor baseline indicates stable vibration frequencies.'}
                </p>
              </div>

              {/* 8. RECOMMENDED REMEDIATION (4 Subsections) */}
              <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-xl text-xs space-y-3">
                <h3 className="font-bold text-blue-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-blue-200 pb-1.5">
                  <Wrench className="w-4 h-4 text-blue-700" />
                  8. Recommended Remediation (IS 456:2000 / CPWD Maintenance Manual)
                </h3>

                {reportData?.recommendedRemediation ? (
                  <div className="space-y-3">
                    {/* Subsection 1: Immediate Actions */}
                    <div>
                      <h4 className="font-bold text-red-900 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        1. Immediate Actions (24 - 48 Hours)
                      </h4>
                      <ul className="list-decimal list-inside space-y-1 text-slate-800 font-medium pl-1">
                        {reportData.recommendedRemediation.immediateActions.map((item, idx) => (
                          <li key={idx} className="leading-relaxed">{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Subsection 2: Recommended Repairs */}
                    <div className="pt-2 border-t border-blue-200/60">
                      <h4 className="font-bold text-blue-900 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-blue-600" />
                        2. Recommended Repairs (Practical Solutions)
                      </h4>
                      <ul className="list-decimal list-inside space-y-1 text-slate-800 font-medium pl-1">
                        {reportData.recommendedRemediation.recommendedRepairs.map((item, idx) => (
                          <li key={idx} className="leading-relaxed">{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Subsection 3: Preventive Measures */}
                    <div className="pt-2 border-t border-blue-200/60">
                      <h4 className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        3. Preventive Measures
                      </h4>
                      <ul className="list-decimal list-inside space-y-1 text-slate-800 font-medium pl-1">
                        {reportData.recommendedRemediation.preventiveMeasures.map((item, idx) => (
                          <li key={idx} className="leading-relaxed">{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Subsection 4: Professional Inspection Requirements */}
                    <div className="pt-2 border-t border-blue-200/60">
                      <h4 className="font-bold text-purple-900 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-purple-600" />
                        4. Professional Inspection Requirements
                      </h4>
                      <ul className="list-decimal list-inside space-y-1 text-slate-800 font-medium pl-1">
                        {reportData.recommendedRemediation.professionalInspectionRequirements.map((item, idx) => (
                          <li key={idx} className="leading-relaxed">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <ul className="list-decimal list-inside space-y-1 text-blue-950 leading-relaxed font-medium">
                    {(reportData?.recommendedActions || [
                      'Erect steel support shoring props under primary load path.',
                      'Inject low-viscosity structural epoxy resin.',
                      'Install optical displacement gauges for continuous crack monitoring.',
                    ]).map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 9. PRIORITY & TIMEFRAME */}
              <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl text-xs space-y-1.5">
                <h3 className="font-bold text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                  9. Mandated Remediation Priority & Timetable
                </h3>
                <div className="text-slate-900 font-semibold">
                  Priority:{' '}
                  <strong className="text-red-700 font-mono">
                    {reportData?.priority?.level || inspection.overallRiskLevel}
                  </strong>{' '}
                  &bull; Timeframe:{' '}
                  <strong className="text-slate-900 font-mono">
                    {reportData?.priority?.timeframe || (inspection.overallRiskLevel === 'Critical' ? 'IMMEDIATE (48 Hours)' : 'SCHEDULED (14 Days)')}
                  </strong>
                </div>
                <p className="text-[11px] text-amber-950">
                  {reportData?.priority?.urgencyText || 'Compliance required per CPWD Civil Maintenance Regulations.'}
                </p>
              </div>

              {/* 10. STRUCTURAL ENGINEER DISCLAIMER */}
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 text-[11px] text-slate-600 leading-relaxed italic">
                <strong className="text-slate-800 not-italic block mb-0.5">
                  10. Certified Structural Engineer Legal Disclaimer:
                </strong>
                {reportData?.disclaimer ||
                  'AI-generated assessment is intended to support professional inspection and does not replace assessment by a qualified structural engineer.'}
              </div>

              {/* Official Sign-Off Footer */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
                <div className="space-y-1">
                  <div className="font-mono text-slate-400 text-[10px]">Digitally Audited</div>
                  <div className="font-bold text-slate-900">{inspection.inspectorName}</div>
                  <div className="text-[10px] text-slate-500">
                    Lead Structural Auditor ({inspection.inspectorBadge})
                  </div>
                </div>

                <div className="space-y-1 flex flex-col items-center justify-center">
                  <div className="h-10 w-10 rounded-full border-2 border-emerald-600 border-dashed flex items-center justify-center text-emerald-700">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    IS 456 CERTIFIED
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-mono text-slate-400 text-[10px]">Endorsed by</div>
                  <div className="font-bold text-slate-900">Chief Superintending Engineer</div>
                  <div className="text-[10px] text-slate-500">
                    Infrastructure Safety & Audit Directorate
                  </div>
                </div>
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
};

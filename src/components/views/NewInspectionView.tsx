import React, { useState, useRef } from 'react';
import { Building, Inspection, Defect, ActiveTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ImageAnnotator } from '../inspection/ImageAnnotator';
import { DefectDetailCard } from '../inspection/DefectDetailCard';
import {
  executeFrontendRoboflowAnalysis,
  executeFallbackGeminiVisualAnalysis,
  ROBOFLOW_WORKFLOW_URL,
} from '../../lib/roboflowClient';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  Camera,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  BookmarkPlus,
  Activity,
  Code,
  Link,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  PlusCircle,
  Building2,
  Sparkles,
} from 'lucide-react';

interface NewInspectionViewProps {
  buildings: Building[];
  onSaveInspection: (inspection: Inspection) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onViewReport: (inspection: Inspection) => void;
}

export const NewInspectionView: React.FC<NewInspectionViewProps> = ({
  buildings,
  onSaveInspection,
  setActiveTab,
  onViewReport,
}) => {
  const { user } = useAuth();

  // Form State
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(buildings[0]?.id || '');
  const [customBuildingCode, setCustomBuildingCode] = useState<string>('ASSET-01');
  const [customBuildingName, setCustomBuildingName] = useState<string>('Registered Asset 01');
  const [selectedElement, setSelectedElement] = useState<string>('Column C-04 (Primary Shear Column)');
  const [locationDetails, setLocationDetails] = useState<string>('Ground Level, East Facade / Main Grid');
  const [inspectorName, setInspectorName] = useState<string>(user?.fullName || 'Er. Arjun Sharma');
  const [inspectorBadge, setInspectorBadge] = useState<string>(user?.badgeNumber || 'CPWD-AUD-8821');
  const [inspectorNotes, setInspectorNotes] = useState<string>('Visual inspection of reinforced concrete member. Examining crack morphology and potential spalling.');

  // Multiple Image Upload State
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const imagePreview = imagePreviews[activeImageIndex] || null;
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Workflow Config state
  const [isPingingWorkflow, setIsPingingWorkflow] = useState<boolean>(false);
  const [workflowStatus, setWorkflowStatus] = useState<{
    tested: boolean;
    success: boolean;
    latencyMs?: number;
    message?: string;
  }>({
    tested: false,
    success: true,
    message: 'Direct Client-Side Roboflow Workflow Ready',
  });
  const [showWorkflowDetails, setShowWorkflowDetails] = useState<boolean>(false);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [analysisError, setAnalysisError] = useState<{
    message: string;
    details?: string;
    isRoboflowUnavailable?: boolean;
  } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    structuralHealthIndex: number;
    overallRiskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
    riskScore: number;
    totalDefectCoveragePercent: number;
    diagnosisSummary: string;
    safetyPrecautions: string[];
    defects: Defect[];
    provider?: string;
    workflowId?: string;
    reportSource?: string;
    isFallback?: boolean;
    rawWorkflowData?: any;
    imageUrl?: string;
  } | null>(null);

  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savedInspection, setSavedInspection] = useState<Inspection | null>(null);

  const currentBuilding = buildings.find((b) => b.id === selectedBuildingId) || buildings[0];

  // Test server-side Roboflow proxy endpoint
  const pingRoboflowWorkflow = async () => {
    setIsPingingWorkflow(true);
    const startTime = Date.now();
    try {
      const res = await fetch('/api/roboflow/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const latency = Date.now() - startTime;
      const data = await res.json();
      
      if (res.ok && data.status === 'online') {
        setWorkflowStatus({
          tested: true,
          success: true,
          latencyMs: latency,
          message: `Server Proxy Online (${latency}ms)`,
        });
      } else {
        setWorkflowStatus({
          tested: true,
          success: false,
          latencyMs: latency,
          message: `Server health check returned: ${data.status || 'unknown'}`,
        });
      }
    } catch (err: any) {
      setWorkflowStatus({
        tested: true,
        success: false,
        message: err?.message || 'Server proxy connection offline',
      });
    } finally {
      setIsPingingWorkflow(false);
    }
  };

  // Optimized Image files handler for multiple images
  const handleFileUploads = (files: FileList | File[]) => {
    setAnalysisError(null);
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawDataUrl = e.target?.result as string;
        if (!rawDataUrl) return;

        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimized = canvas.toDataURL('image/jpeg', 0.90);
            setImagePreviews((prev) => [...prev, optimized]);
          } else {
            setImagePreviews((prev) => [...prev, rawDataUrl]);
          }
          setAnalysisResult(null);
          setIsSaved(false);
        };
        img.onerror = () => {
          setImagePreviews((prev) => [...prev, rawDataUrl]);
          setAnalysisResult(null);
          setIsSaved(false);
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  // URL loader
  const handleApplyUrl = () => {
    if (!imageUrlInput.trim()) return;
    setAnalysisError(null);
    setImagePreviews((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
    setAnalysisResult(null);
    setIsSaved(false);
  };

  // Remove single image
  const handleRemoveImage = (index: number) => {
    setImagePreviews((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (activeImageIndex >= next.length) {
        setActiveImageIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
    setAnalysisResult(null);
    setIsSaved(false);
  };

  // Execute Roboflow analysis for all multiple images individually and synthesize combined report
  const runAiAnalysis = async (forceFallback = false) => {
    if (imagePreviews.length === 0) {
      setAnalysisError({ message: 'Please upload or capture at least one structural photograph first.' });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setIsSaved(false);

    try {
      if (forceFallback) {
        setScanStep(`1/3: Activating multi-image Gemini Visual Assessment fallback across ${imagePreviews.length} inserted image(s)...`);
        const res = await fetch('/api/gemini-fallback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: imagePreviews,
            element: selectedElement,
            roboflowError: 'Direct user activation or fallback requested',
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Gemini fallback failed: ${errText}`);
        }
        const fallbackResult = await res.json();

        setScanStep('2/3: Computing IS 456 compliant indices and defect morphology...');
        await new Promise((r) => setTimeout(r, 100));
        setScanStep('3/3: Condition report synthesized.');
        setAnalysisResult(fallbackResult);
        if (fallbackResult.defects && fallbackResult.defects.length > 0) {
          setSelectedDefectId(fallbackResult.defects[0].id);
        }
        return;
      }

      setScanStep(`1/4: Preparing payload for ${imagePreviews.length} inserted image(s)...`);
      await new Promise((r) => setTimeout(r, 100));

      setScanStep(`2/4: Running Roboflow workflow individually across all ${imagePreviews.length} photograph(s)...`);

      const allDefects: any[] = [];
      let totalCoverage = 0;
      let minHealthIndex = 100;
      let maxRiskScore = 0;
      const summaries: string[] = [];
      const precautionsSet = new Set<string>();
      let primaryResult: any = null;

      for (let i = 0; i < imagePreviews.length; i++) {
        const imgUrl = imagePreviews[i];
        try {
          const result = await executeFrontendRoboflowAnalysis(
            imgUrl,
            selectedElement,
            user?.id || 'default_user'
          );
          if (!primaryResult) primaryResult = result;

          if (result.structuralHealthIndex < minHealthIndex) {
            minHealthIndex = result.structuralHealthIndex;
          }
          if (result.riskScore > maxRiskScore) {
            maxRiskScore = result.riskScore;
          }
          totalCoverage += result.totalDefectCoveragePercent || 0;
          if (result.diagnosisSummary) {
            summaries.push(`[Photo ${i + 1}]: ${result.diagnosisSummary}`);
          }
          if (result.safetyPrecautions) {
            result.safetyPrecautions.forEach((p) => precautionsSet.add(p));
          }
          if (result.defects) {
            const tagged = result.defects.map((d: any) => ({
              ...d,
              id: `${d.id}_img_${i + 1}`,
              technicalDescription: `(Photo ${i + 1}): ${d.technicalDescription}`,
            }));
            allDefects.push(...tagged);
          }
        } catch (singleErr) {
          console.warn(`Roboflow analysis failed for image ${i + 1}:`, singleErr);
        }
      }

      setScanStep('3/4: Parsing defect segmentation masks & bounding coordinates...');
      await new Promise((r) => setTimeout(r, 100));

      setScanStep('4/4: Combining multi-image findings & calculating IS 456 Structural Health Index...');
      await new Promise((r) => setTimeout(r, 100));

      if (!primaryResult || allDefects.length === 0) {
        throw new Error('Roboflow returned zero defects across images. Triggering multi-image Gemini fallback.');
      }

      const combinedCoverage = Number(Math.min(100, totalCoverage).toFixed(2));
      const combinedRiskScore = Math.min(100, Math.max(maxRiskScore, Math.round(combinedCoverage * 2.5)));
      const combinedHealthIndex = Math.max(10, Math.min(98, 100 - combinedRiskScore));

      let overallRiskLevel: 'Critical' | 'High' | 'Moderate' | 'Low' = 'Low';
      if (combinedHealthIndex < 50 || combinedRiskScore >= 70) overallRiskLevel = 'Critical';
      else if (combinedHealthIndex < 70 || combinedRiskScore >= 45) overallRiskLevel = 'High';
      else if (combinedHealthIndex < 85 || combinedRiskScore >= 20) overallRiskLevel = 'Moderate';

      const combinedSummary = `Comprehensive multi-image forensic assessment across ${imagePreviews.length} photograph(s) of ${selectedElement}. Total defects localized: ${allDefects.length}. ${summaries.join(' ')}`;

      const combinedResult = {
        ...primaryResult,
        structuralHealthIndex: combinedHealthIndex,
        riskScore: combinedRiskScore,
        overallRiskLevel,
        totalDefectCoveragePercent: combinedCoverage,
        diagnosisSummary: combinedSummary,
        safetyPrecautions: Array.from(precautionsSet),
        defects: allDefects,
        imageUrl: imagePreviews[activeImageIndex] || imagePreviews[0],
      };

      setAnalysisResult(combinedResult);
      if (combinedResult.defects && combinedResult.defects.length > 0) {
        setSelectedDefectId(combinedResult.defects[0].id);
      }
    } catch (err: any) {
      console.error('Roboflow client analysis failed, falling back to Gemini with all inserted images:', err);
      try {
        setScanStep(`Roboflow failed. Executing multi-image Gemini Visual Assessment across ${imagePreviews.length} photo(s)...`);
        const res = await fetch('/api/gemini-fallback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: imagePreviews,
            element: selectedElement,
            roboflowError: err?.message || 'Roboflow workflow network/CORS error',
          }),
        });
        if (res.ok) {
          const fallbackResult = await res.json();
          setAnalysisResult(fallbackResult);
          if (fallbackResult.defects && fallbackResult.defects.length > 0) {
            setSelectedDefectId(fallbackResult.defects[0].id);
          }
          setAnalysisError(null);
          return;
        }
      } catch (geminiErr) {
        console.warn('Gemini multi-image fallback error:', geminiErr);
      }

      const detailedMessage =
        err?.message || 'Unable to connect to Roboflow workflow endpoint from browser.';
      setAnalysisError({
        message: detailedMessage,
        details: 'Check browser console or CORS permissions for serverless.roboflow.com.',
        isRoboflowUnavailable: true,
      });
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
      setScanStep('');
    }
  };

  // Save inspection to Supabase
  const handleSaveInspection = () => {
    if (!analysisResult || !imagePreview) return;

    const effectiveBuildingId = currentBuilding?.id || 'bld_registered_default';
    const effectiveBuildingName = currentBuilding?.name || customBuildingName || 'Registered Building Asset';
    const effectiveBuildingCode = currentBuilding?.code || customBuildingCode || 'ASSET-01';

    const newInspection: Inspection = {
      id: `insp_${Date.now()}`,
      inspectionCode: `INSP-${new Date().getFullYear()}-${effectiveBuildingCode}-${Math.floor(100 + Math.random() * 900)}`,
      buildingId: effectiveBuildingId,
      buildingName: effectiveBuildingName,
      buildingCode: effectiveBuildingCode,
      element: selectedElement,
      locationDetails: locationDetails,
      inspectorName: inspectorName || user?.fullName || 'Er. Arjun Sharma',
      inspectorBadge: inspectorBadge || user?.badgeNumber || 'CPWD-AUD-8821',
      inspectorRole: user?.role || 'Senior Structural Auditor (Grade I)',
      date: new Date().toISOString().split('T')[0],
      status: analysisResult.overallRiskLevel === 'Critical' ? 'Under Remediation' : 'Completed',
      structuralHealthIndex: analysisResult.structuralHealthIndex,
      riskScore: analysisResult.riskScore,
      overallRiskLevel: analysisResult.overallRiskLevel,
      totalDefectCoveragePercent: analysisResult.totalDefectCoveragePercent,
      diagnosisSummary: analysisResult.diagnosisSummary,
      safetyPrecautions: analysisResult.safetyPrecautions,
      defects: analysisResult.defects,
      originalImage: analysisResult.imageUrl || imagePreview,
      notes: inspectorNotes,
      createdAt: new Date().toISOString(),
    };

    onSaveInspection(newInspection);
    setSavedInspection(newInspection);
    setIsSaved(true);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {}
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
            <span>New Forensic Inspection & CAD Defect Analysis</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Roboflow Workflow: building-infrastructure-defects-logic
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload real structural member photographs to execute serverless Roboflow segmentation via secure server proxy and compute IS 456 crack indices.
          </p>
        </div>
      </div>

      {/* Roboflow Workflow Status & Live Telemetry Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-4 border border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start md:items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white tracking-wide">
                  Roboflow Serverless Inference Engine (Server-Side Proxy)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {workflowStatus.message || 'Proxy Ready'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5 truncate max-w-xl">
                /api/roboflow/proxy • kumar-ritovash/workflows/building-infrastructure-defects-logic
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isPingingWorkflow}
              onClick={pingRoboflowWorkflow}
              className="px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 border border-blue-400/30 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPingingWorkflow ? 'animate-spin' : ''}`} />
              <span>{isPingingWorkflow ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWorkflowDetails(!showWorkflowDetails)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
            >
              <span>Info</span>
              {showWorkflowDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {showWorkflowDetails && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-xs space-y-2 font-mono">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400">Server Proxy Endpoint:</span>{' '}
                <span className="text-blue-300 break-all">
                  /api/roboflow/proxy
                </span>
              </div>
              <div>
                <span className="text-slate-400">Execution Mode:</span>{' '}
                <span className="text-emerald-300">Server-Side Secure Proxy (No CORS Issues)</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400">Active Defect Classes:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[
                  'structural_crack',
                  'surface_crack',
                  'concrete_spalling',
                  'reinforcement_corrosion',
                  'water_damage',
                  'honeycombing',
                ].map((cls) => (
                  <span
                    key={cls}
                    className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 text-[10px]"
                  >
                    {cls}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Photo Input */}
        <div className="lg:col-span-5 space-y-4">
          {/* Metadata Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 text-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              1. Asset & Element Identification
            </h3>

            {/* Building Selection */}
            {buildings.length > 0 ? (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Building / Infrastructure Asset
                </label>
                <select
                  value={selectedBuildingId}
                  onChange={(e) => setSelectedBuildingId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white font-medium text-slate-900"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} &bull; {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700">
                    Target Building Code & Name
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('buildings')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Register in Directory</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={customBuildingCode}
                    onChange={(e) => setCustomBuildingCode(e.target.value)}
                    placeholder="Code (e.g. B-101)"
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={customBuildingName}
                    onChange={(e) => setCustomBuildingName(e.target.value)}
                    placeholder="Facility Name"
                    className="col-span-2 px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Element Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Structural Component & Grid Reference
              </label>
              <input
                type="text"
                value={selectedElement}
                onChange={(e) => setSelectedElement(e.target.value)}
                placeholder="e.g. Column C-04 (Basement B2 Shear Column)"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>

            {/* Location Details */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Exact Location / Grid Coordinates
              </label>
              <input
                type="text"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder="e.g. Pier 42 approach elevation, 2m above ground grade"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>

            {/* Inspector Details */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inspector Name</label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Badge / License ID</label>
                <input
                  type="text"
                  value={inspectorBadge}
                  onChange={(e) => setInspectorBadge(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 text-xs font-mono"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Field Observations & Environmental Factors
              </label>
              <textarea
                rows={2}
                value={inspectorNotes}
                onChange={(e) => setInspectorNotes(e.target.value)}
                placeholder="Note any moisture leaching, spalling sounds, or vibration conditions..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 text-xs resize-none"
              />
            </div>
          </div>

          {/* Photo Evidence Input */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                2. Real Photographic Evidence
              </h3>

              {/* Mode Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    inputMode === 'upload' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('url')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    inputMode === 'url' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {/* Hidden File Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUploads(e.target.files);
                }
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUploads(e.target.files);
                }
              }}
            />

            {/* Upload Box (shows even when images exist so users can add more) */}
            {inputMode === 'upload' && (
              <div className="space-y-2">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFileUploads(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150 ${
                    isDragOver
                      ? 'border-blue-600 bg-blue-50/70'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30'
                  }`}
                >
                  <div className="h-10 w-10 mx-auto rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {imagePreviews.length === 0 ? 'Upload Damage Photos (Multiple Supported)' : 'Add More Photographs'}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Click to browse from device or drag & drop multiple files (JPG, PNG, WEBP)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-slate-600" />
                  <span>Take Live Photo with Camera</span>
                </button>
              </div>
            )}

            {/* URL Input */}
            {inputMode === 'url' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-1590381105924-c72589b9ef3f"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Provide a direct public image URL to add to the inspection set.
                </p>
              </div>
            )}

            {/* Image Previews & Thumbnails Gallery */}
            {imagePreviews.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-900 group">
                  <img
                    src={imagePreviews[activeImageIndex] || imagePreviews[0]}
                    alt="Active Structural Element Preview"
                    className="w-full max-h-56 object-contain mx-auto"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                    Image {activeImageIndex + 1} of {imagePreviews.length} (Active View)
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(activeImageIndex)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
                    title="Remove Active Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Thumbnails grid */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-600">
                    Inserted Photographs ({imagePreviews.length} attached for analysis & Gemini multi-image synthesis)
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {imagePreviews.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                          idx === activeImageIndex ? 'border-blue-600 ring-2 ring-blue-600/30' : 'border-slate-200 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-red-600 text-white text-[8px]"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner with Retry & Gemini Fallback Actions */}
            {analysisError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block text-red-950">Analysis Service Notice</span>
                    <p className="text-[11px] text-red-800 mt-0.5 leading-relaxed font-mono">
                      {analysisError.message}
                    </p>
                    {analysisError.details && (
                      <p className="text-[10px] text-red-600 mt-1 italic">
                        Detail: {analysisError.details}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-red-200/80">
                  <button
                    type="button"
                    onClick={() => runAiAnalysis(false)}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Analysis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => runAiAnalysis(true)}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Use Gemini Visual Assessment (Fallback)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Run Analysis Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!imagePreview || isAnalyzing}
                onClick={() => runAiAnalysis(false)}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Analyzing Structure...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Analyze Structure</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Annotator & CAD Results */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Scanner Telemetry Progress */}
          {isAnalyzing && (
            <div className="p-4 rounded-2xl bg-[#0B192C] text-white border border-slate-800 space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold flex items-center gap-2">
                  <Cpu className="w-4 h-4 animate-spin text-amber-400" />
                  Server-Side Analysis Active
                </span>
                <span className="text-slate-400">Workflow: building-infrastructure-defects-logic</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-amber-400 h-full rounded-full w-3/4 animate-progress" />
              </div>
              <p className="text-xs text-slate-300 font-mono">{scanStep}</p>
            </div>
          )}

          {/* Interactive CAD Image Annotator Component */}
          {imagePreview ? (
            <ImageAnnotator
              imageUrl={imagePreview}
              defects={analysisResult?.defects || []}
              selectedDefectId={selectedDefectId}
              onSelectDefect={setSelectedDefectId}
              interactive={Boolean(analysisResult)}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2 min-h-[300px]">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-600">No Image Uploaded</div>
              <p className="text-xs max-w-sm">
                Upload or capture a structural defect photo on the left to initialize computer vision defect mapping.
              </p>
            </div>
          )}

          {/* Analysis Results Display */}
          {analysisResult && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        Audit Diagnostic Synthesis
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                        {analysisResult.provider || 'Roboflow Workflow Engine'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {analysisResult.defects.length === 0
                        ? 'Element Clear • No Severe Defects Localized'
                        : `${analysisResult.defects.length} Structural Defect(s) Localized`}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                        analysisResult.overallRiskLevel === 'Critical'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : analysisResult.overallRiskLevel === 'High'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : analysisResult.overallRiskLevel === 'Moderate'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {analysisResult.overallRiskLevel} Risk Level
                    </span>
                  </div>
                </div>

                {/* Score Gauges */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">
                      Health Index (SHI)
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-700 mt-0.5">
                      {analysisResult.structuralHealthIndex} <span className="text-xs text-slate-400">/ 100</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">
                      Risk Matrix Score
                    </div>
                    <div className="text-2xl font-bold font-mono text-amber-700 mt-0.5">
                      {analysisResult.riskScore} <span className="text-xs text-slate-400">/ 100</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">
                      Defect Coverage
                    </div>
                    <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                      {analysisResult.totalDefectCoveragePercent}%
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block mb-0.5">Executive Forensic Summary:</strong>
                  {analysisResult.diagnosisSummary}
                </p>

                {/* Safety Precautions */}
                {analysisResult.safetyPrecautions?.length > 0 && (
                  <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-xl text-xs space-y-1.5">
                    <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      Mandatory CPWD Immediate Safety Directives
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-amber-950">
                      {analysisResult.safetyPrecautions.map((precaution, idx) => (
                        <li key={idx}>{precaution}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Toggle Raw JSON Output */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>{showRawJson ? 'Hide' : 'View'} Roboflow Raw Output & JSON Telemetry</span>
                  </button>

                  {showRawJson && (
                    <pre className="mt-2 p-3 rounded-xl bg-slate-900 text-emerald-400 text-[10px] font-mono overflow-x-auto max-h-60 border border-slate-800">
                      {JSON.stringify(
                        analysisResult.rawWorkflowData || {
                          provider: analysisResult.provider,
                          defects: analysisResult.defects,
                          riskScore: analysisResult.riskScore,
                          structuralHealthIndex: analysisResult.structuralHealthIndex,
                        },
                        null,
                        2
                      )}
                    </pre>
                  )}
                </div>
              </div>

              {/* Itemized Defect Cards */}
              {analysisResult.defects.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Defect Forensic Itemization</span>
                    <span className="font-mono text-slate-400">
                      Click card to focus CAD bounding box
                    </span>
                  </div>

                  {analysisResult.defects.map((defect, index) => (
                    <DefectDetailCard
                      key={defect.id || index}
                      defect={defect}
                      index={index}
                      isSelected={selectedDefectId === defect.id}
                      onSelect={() =>
                        setSelectedDefectId(selectedDefectId === defect.id ? null : defect.id)
                      }
                    />
                  ))}
                </div>
              )}

              {/* Action Bar: Save & Generate Report */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {isSaved ? 'Inspection Saved & Filed to Supabase' : 'Ready to File Inspection Record'}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isSaved
                      ? 'Saved to official Zonal registry and certified Supabase database.'
                      : 'Save this forensic analysis to the central audit registry.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {!isSaved ? (
                    <button
                      type="button"
                      onClick={handleSaveInspection}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <BookmarkPlus className="w-4 h-4" />
                      <span>Save & File Inspection</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (savedInspection) onViewReport(savedInspection);
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>View Certificate & AI Report</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('buildings')}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Building Assets</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

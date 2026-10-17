import React, { useState, useRef, useEffect } from 'react';
import { Defect, SeverityLevel } from '../../types';
import { ZoomIn, ZoomOut, RotateCcw, Layers, Eye, EyeOff, Ruler, Maximize2, ShieldAlert } from 'lucide-react';

interface ImageAnnotatorProps {
  imageUrl: string;
  defects: Defect[];
  selectedDefectId: string | null;
  onSelectDefect: (id: string | null) => void;
  interactive?: boolean;
}

export const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({
  imageUrl,
  defects,
  selectedDefectId,
  onSelectDefect,
  interactive = true,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [showMeasurements, setShowMeasurements] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [hoveredDefectId, setHoveredDefectId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getSeverityColors = (severity: SeverityLevel, isSelected: boolean, isHovered: boolean) => {
    const active = isSelected || isHovered;
    switch (severity) {
      case 'Critical':
        return {
          border: active ? 'border-red-600 ring-2 ring-red-500' : 'border-red-500',
          bg: active ? 'bg-red-500/25' : 'bg-red-500/15',
          badgeBg: 'bg-red-700 text-white',
          textColor: 'text-red-700',
          dot: 'bg-red-600',
        };
      case 'High':
        return {
          border: active ? 'border-amber-600 ring-2 ring-amber-500' : 'border-amber-500',
          bg: active ? 'bg-amber-500/25' : 'bg-amber-500/15',
          badgeBg: 'bg-amber-700 text-white',
          textColor: 'text-amber-700',
          dot: 'bg-amber-500',
        };
      case 'Moderate':
        return {
          border: active ? 'border-blue-600 ring-2 ring-blue-500' : 'border-blue-500',
          bg: active ? 'bg-blue-500/25' : 'bg-blue-500/15',
          badgeBg: 'bg-blue-700 text-white',
          textColor: 'text-blue-700',
          dot: 'bg-blue-500',
        };
      case 'Low':
      default:
        return {
          border: active ? 'border-emerald-600 ring-2 ring-emerald-500' : 'border-emerald-500',
          bg: active ? 'bg-emerald-500/25' : 'bg-emerald-500/15',
          badgeBg: 'bg-emerald-700 text-white',
          textColor: 'text-emerald-700',
          dot: 'bg-emerald-500',
        };
    }
  };

  const resetView = () => {
    setZoom(1);
    onSelectDefect(null);
  };

  return (
    <div className="relative flex flex-col rounded-xl overflow-hidden border border-slate-300 bg-slate-900 shadow-sm">
      {/* Top Engineering Controls Bar */}
      {interactive && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-950/90 border-b border-slate-800 text-xs text-slate-300 z-10 select-none">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              CAD Overlays ({defects.length} Detected)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle Boxes */}
            <button
              type="button"
              onClick={() => setShowBoxes(!showBoxes)}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                showBoxes ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Defect Bounding Boxes"
            >
              {showBoxes ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Boxes</span>
            </button>

            {/* Toggle Measurements */}
            <button
              type="button"
              onClick={() => setShowMeasurements(!showMeasurements)}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                showMeasurements ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Crack Length/Width Metrics"
            >
              <Ruler className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Metrics</span>
            </button>

            {/* Toggle Grid */}
            <button
              type="button"
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                showGrid ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Inspection Grid"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Grid</span>
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1" />

            {/* Zoom Controls */}
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
              className="p-1 rounded text-slate-300 hover:bg-slate-800 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono text-[11px] text-slate-400 w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
              className="p-1 rounded text-slate-300 hover:bg-slate-800 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={resetView}
              className="p-1 rounded text-slate-300 hover:bg-slate-800 hover:text-white"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Image Viewport */}
      <div
        ref={containerRef}
        className="relative overflow-hidden w-full flex items-center justify-center bg-slate-950 min-h-[340px] max-h-[540px]"
      >
        <div
          className="relative inline-block transition-transform duration-150 ease-out"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          {/* Base Structural Photograph */}
          <img
            src={imageUrl}
            alt="Structural Inspection Element"
            referrerPolicy="no-referrer"
            className="block max-h-[500px] w-auto max-w-full object-contain select-none"
          />

          {/* Grid Overlay */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            >
              <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/70 text-[9px] font-mono text-emerald-400 rounded">
                Scale: 1 grid = 40mm approx.
              </div>
            </div>
          )}

          {/* Bounding Box Annotations */}
          {showBoxes &&
            defects.map((defect, idx) => {
              const [ymin, xmin, ymax, xmax] = defect.box2d || [200, 200, 700, 700];
              const top = `${(ymin / 1000) * 100}%`;
              const left = `${(xmin / 1000) * 100}%`;
              const width = `${((xmax - xmin) / 1000) * 100}%`;
              const height = `${((ymax - ymin) / 1000) * 100}%`;

              const isSelected = selectedDefectId === defect.id;
              const isHovered = hoveredDefectId === defect.id;
              const colors = getSeverityColors(defect.severity, isSelected, isHovered);

              return (
                <div
                  key={defect.id || idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDefect(isSelected ? null : defect.id);
                  }}
                  onMouseEnter={() => setHoveredDefectId(defect.id)}
                  onMouseLeave={() => setHoveredDefectId(null)}
                  style={{ top, left, width, height }}
                  className={`absolute border-2 ${colors.border} ${colors.bg} cursor-pointer transition-all duration-150 z-20 group`}
                >
                  {/* Defect Tag Header */}
                  <div
                    className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap shadow flex items-center gap-1 ${colors.badgeBg}`}
                  >
                    <span className="font-mono">#{idx + 1}</span>
                    <span>{defect.type}</span>
                    <span className="opacity-90 font-mono">({defect.confidence}%)</span>
                  </div>

                  {/* Corner Crosshairs for CAD precision */}
                  <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white" />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white" />

                  {/* Measurement Badge */}
                  {showMeasurements && (
                    <div className="absolute -bottom-6 right-0 bg-slate-900/90 text-slate-200 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap shadow pointer-events-none">
                      W: <strong className="text-amber-400">{defect.estimatedWidthMm}mm</strong> | L: {defect.estimatedLengthMm}mm
                    </div>
                  )}

                  {/* Hover detail tooltip */}
                  {(isHovered || isSelected) && (
                    <div className="absolute top-full mt-2 left-0 z-30 bg-slate-950/95 text-slate-100 p-2.5 rounded-lg border border-slate-700 shadow-xl w-64 text-left pointer-events-none">
                      <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800">
                        <span className="font-semibold text-xs text-white">{defect.type}</span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${colors.badgeBg}`}>
                          {defect.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {defect.technicalDescription}
                      </p>
                      <div className="mt-2 pt-1 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>IS Ref: {defect.standardsReference?.split(' ')[0] || 'IS 456'}</span>
                        <span className="text-amber-400 font-bold">Coverage: {defect.coveragePercent}%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Bottom Status Legend */}
      <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-slate-300">Severity Codes:</span>
          <span className="inline-flex items-center gap-1 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <strong className="text-red-400">Critical</strong> (&gt;2.0mm)
          </span>
          <span className="inline-flex items-center gap-1 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <strong className="text-amber-400">High</strong> (0.5 - 2.0mm)
          </span>
          <span className="inline-flex items-center gap-1 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <strong className="text-blue-400">Moderate</strong> (&lt;0.5mm)
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Click any bounding box or list card to focus
        </div>
      </div>
    </div>
  );
};

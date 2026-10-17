import React from 'react';
import { Defect, SeverityLevel } from '../../types';
import { AlertTriangle, CheckCircle2, ShieldAlert, Wrench, BookOpen, Ruler, Activity } from 'lucide-react';

interface DefectDetailCardProps {
  defect: Defect;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

export const DefectDetailCard: React.FC<DefectDetailCardProps> = ({
  defect,
  index,
  isSelected,
  onSelect,
}) => {
  const getSeverityBadge = (sev: SeverityLevel) => {
    switch (sev) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
            Critical Severity
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            High Severity
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Moderate Severity
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Low Severity
          </span>
        );
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl p-4 transition-all duration-150 cursor-pointer border ${
        isSelected
          ? 'bg-slate-900 text-white border-blue-500 shadow-md ring-1 ring-blue-500'
          : 'bg-white text-slate-900 border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-6 w-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center ${
              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            #{index + 1}
          </span>
          <h4 className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
            {defect.type}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded ${
              isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {defect.confidence}% Conf.
          </span>
          {getSeverityBadge(defect.severity)}
        </div>
      </div>

      <p className={`mt-2 text-xs leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
        {defect.technicalDescription}
      </p>

      {/* Metrics Row */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div
          className={`p-2 rounded-lg ${
            isSelected ? 'bg-slate-800/80 border border-slate-700' : 'bg-slate-50 border border-slate-100'
          }`}
        >
          <div className={`text-[10px] font-medium ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
            Max Crack Width
          </div>
          <div className="text-xs font-mono font-bold text-amber-500 mt-0.5">
            {defect.estimatedWidthMm} mm
          </div>
        </div>

        <div
          className={`p-2 rounded-lg ${
            isSelected ? 'bg-slate-800/80 border border-slate-700' : 'bg-slate-50 border border-slate-100'
          }`}
        >
          <div className={`text-[10px] font-medium ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
            Crack Length
          </div>
          <div className={`text-xs font-mono font-bold mt-0.5 ${isSelected ? 'text-slate-200' : 'text-slate-800'}`}>
            {defect.estimatedLengthMm} mm
          </div>
        </div>

        <div
          className={`p-2 rounded-lg ${
            isSelected ? 'bg-slate-800/80 border border-slate-700' : 'bg-slate-50 border border-slate-100'
          }`}
        >
          <div className={`text-[10px] font-medium ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
            Area Coverage
          </div>
          <div className={`text-xs font-mono font-bold mt-0.5 ${isSelected ? 'text-slate-200' : 'text-slate-800'}`}>
            {defect.coveragePercent}%
          </div>
        </div>
      </div>

      {/* Engineering Standards & Remediation */}
      <div className="mt-3 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-[11px]">
          <BookOpen className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>Code Reference:</span>
          <span className={`font-medium ${isSelected ? 'text-blue-300' : 'text-slate-800'}`}>
            {defect.standardsReference}
          </span>
        </div>

        <div
          className={`p-2.5 rounded-lg text-xs leading-relaxed flex items-start gap-2 ${
            isSelected
              ? 'bg-blue-950/50 border border-blue-800 text-blue-200'
              : 'bg-amber-50/70 border border-amber-200/80 text-amber-900'
          }`}
        >
          <Wrench className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <strong className="font-semibold block mb-0.5">IS 456 Recommended Remediation Protocol:</strong>
            {defect.remediationProtocol}
          </div>
        </div>
      </div>
    </div>
  );
};

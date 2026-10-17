import React, { useState } from 'react';
import { Building, Inspection, ActiveTab, TelemetryRecord } from '../../types';
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  ArrowRight,
  Radio,
  Building2,
  CheckCircle2,
  PlusCircle,
  Layers,
} from 'lucide-react';

interface RiskMonitorViewProps {
  buildings: Building[];
  inspections: Inspection[];
  telemetry?: TelemetryRecord[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectInspection: (inspection: Inspection) => void;
  onSelectBuilding?: (building: Building) => void;
}

export const RiskMonitorView: React.FC<RiskMonitorViewProps> = ({
  buildings,
  inspections,
  telemetry = [],
  setActiveTab,
  onSelectInspection,
  onSelectBuilding,
}) => {
  // Sort user's buildings by priority (Critical > High > Moderate > Low)
  const priorityOrder: Record<string, number> = { Critical: 4, High: 3, Moderate: 2, Low: 1, Unassessed: 0 };
  const userPriorityBuildings = [...buildings].sort(
    (a, b) => (priorityOrder[b.riskStatus] || 0) < (priorityOrder[a.riskStatus] || 0) ? 1 : -1
  );

  // Compute dynamic 5x5 ISO Risk Matrix from actual inspections
  const matrixCells = [
    { row: 5, col: 1, count: 0, level: 'Moderate', elements: [] as string[] },
    { row: 5, col: 2, count: 0, level: 'High', elements: [] as string[] },
    { row: 5, col: 3, count: 0, level: 'Critical', elements: [] as string[] },
    { row: 5, col: 4, count: 0, level: 'Critical', highlight: false, elements: [] as string[] },
    { row: 5, col: 5, count: 0, level: 'Critical', elements: [] as string[] },

    { row: 4, col: 1, count: 0, level: 'Moderate', elements: [] as string[] },
    { row: 4, col: 2, count: 0, level: 'High', elements: [] as string[] },
    { row: 4, col: 3, count: 0, level: 'High', elements: [] as string[] },
    { row: 4, col: 4, count: 0, level: 'Critical', elements: [] as string[] },
    { row: 4, col: 5, count: 0, level: 'Critical', elements: [] as string[] },

    { row: 3, col: 1, count: 0, level: 'Low', elements: [] as string[] },
    { row: 3, col: 2, count: 0, level: 'Moderate', elements: [] as string[] },
    { row: 3, col: 3, count: 0, level: 'Moderate', elements: [] as string[] },
    { row: 3, col: 4, count: 0, level: 'High', elements: [] as string[] },
    { row: 3, col: 5, count: 0, level: 'High', elements: [] as string[] },

    { row: 2, col: 1, count: 0, level: 'Low', elements: [] as string[] },
    { row: 2, col: 2, count: 0, level: 'Low', elements: [] as string[] },
    { row: 2, col: 3, count: 0, level: 'Moderate', elements: [] as string[] },
    { row: 2, col: 4, count: 0, level: 'Moderate', elements: [] as string[] },
    { row: 2, col: 5, count: 0, level: 'High', elements: [] as string[] },

    { row: 1, col: 1, count: 0, level: 'Low', elements: [] as string[] },
    { row: 1, col: 2, count: 0, level: 'Low', elements: [] as string[] },
    { row: 1, col: 3, count: 0, level: 'Low', elements: [] as string[] },
    { row: 1, col: 4, count: 0, level: 'Low', elements: [] as string[] },
    { row: 1, col: 5, count: 0, level: 'Moderate', elements: [] as string[] },
  ];

  // Populate matrix cells from real user inspections
  inspections.forEach((insp) => {
    const label = `${insp.buildingCode || 'Bld'} (${insp.element})`;
    let targetRow = 1;
    let targetCol = 1;

    if (insp.overallRiskLevel === 'Critical' || insp.structuralHealthIndex < 60) {
      targetRow = 5;
      targetCol = insp.defects && insp.defects.length > 1 ? 4 : 3;
    } else if (insp.overallRiskLevel === 'High' || insp.structuralHealthIndex < 70) {
      targetRow = 4;
      targetCol = 2;
    } else if (insp.overallRiskLevel === 'Moderate' || insp.structuralHealthIndex < 80) {
      targetRow = 3;
      targetCol = 2;
    } else {
      targetRow = 2;
      targetCol = 1;
    }

    const cell = matrixCells.find((c) => c.row === targetRow && c.col === targetCol);
    if (cell) {
      cell.count += 1;
      cell.elements.push(label);
      if (cell.level === 'Critical' && cell.count > 0) {
        cell.highlight = true;
      }
    }
  });

  const getCellColor = (level: string, highlight?: boolean) => {
    if (highlight) return 'bg-red-600 text-white font-bold ring-2 ring-red-400 animate-pulse shadow-xs';
    switch (level) {
      case 'Critical':
        return 'bg-red-100 text-red-900 border-red-200 hover:bg-red-200';
      case 'High':
        return 'bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200';
      case 'Moderate':
        return 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100';
      case 'Low':
      default:
        return 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100';
    }
  };

  // Build dynamic hotlist from user inspections
  const dynamicHotlist = inspections
    .filter((i) => i.overallRiskLevel === 'Critical' || i.overallRiskLevel === 'High' || i.structuralHealthIndex < 70)
    .map((insp) => ({
      id: insp.id,
      code: insp.buildingCode,
      element: insp.element,
      title: insp.diagnosisSummary || 'Structural Defect Detected',
      crackRate: insp.overallRiskLevel === 'Critical' ? '+0.25 mm/month' : '+0.10 mm/month',
      status: insp.status || (insp.overallRiskLevel === 'Critical' ? 'Immediate Remediation Mandated' : 'Monitoring Active'),
      priority: insp.overallRiskLevel,
      shi: insp.structuralHealthIndex,
      inspection: insp,
    }));

  if (buildings.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Zonal Infrastructure Risk Monitor & Telemetry</span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                5x5 ISO Risk Matrix
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time structural vulnerability and stress monitoring calibrated to IS 456 standards.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs flex flex-col items-center justify-center max-w-2xl mx-auto space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Registered Buildings Found</h3>
            <p className="text-xs text-slate-500 max-w-md">
              You haven't registered any buildings yet. Register your building infrastructure to begin tracking computer vision inspections, health scores, and 5x5 ISO risk matrix distributions.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('buildings')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Your First Building</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('new-inspection')}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Start AI Inspection</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Zonal Infrastructure Risk Monitor & Telemetry</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-bold border border-red-200">
              5x5 ISO Risk Matrix
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time vulnerability mapping for registered infrastructure buildings calibrated to IS 456 & CPWD safety thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-800 shadow-xs">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Vision & IoT Telemetry: Active</span>
        </div>
      </div>

      {/* Target Building Watch Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 font-mono flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Monitored Buildings Vulnerability Index</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">{userPriorityBuildings.length} Facilities</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {userPriorityBuildings.map((b) => {
            const isCritical = b.riskStatus === 'Critical';
            return (
              <div
                key={b.id}
                onClick={() => {
                  if (onSelectBuilding) {
                    onSelectBuilding(b);
                    setActiveTab('buildings');
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-xs ${
                  isCritical
                    ? 'bg-red-50/50 border-red-300 ring-2 ring-red-400/50'
                    : b.riskStatus === 'High'
                    ? 'bg-amber-50/50 border-amber-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-slate-900 text-white shadow-2xs">
                      {b.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.riskStatus === 'Critical'
                          ? 'bg-red-600 text-white'
                          : b.riskStatus === 'High'
                          ? 'bg-amber-600 text-white'
                          : b.riskStatus === 'Moderate'
                          ? 'bg-blue-600 text-white'
                          : b.riskStatus === 'Unassessed'
                          ? 'bg-slate-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {b.riskStatus}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1 mt-1">{b.name}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{b.type} &bull; {b.city}</p>
                </div>

                <div className="pt-2.5 border-t border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Health Index:</span>
                    <span className={`font-bold ${b.healthIndex < 60 ? 'text-red-700' : 'text-slate-900'}`}>
                      {b.totalInspections === 0 ? 'Pending Audit' : `${b.healthIndex} / 100`}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                      isCritical
                        ? 'bg-red-700 hover:bg-red-800 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: 5x5 ISO Matrix + Hotlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 5x5 Risk Matrix Canvas (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Probability vs. Consequence Risk Distribution (ISO 31000)
              </h3>
              <p className="text-xs text-slate-500">
                Structural failure likelihood versus consequence severity across your registered assets
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <strong>Critical</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <strong>High</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <strong>Low</strong>
              </span>
            </div>
          </div>

          {/* 5x5 Matrix Layout */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Failure Consequence Severity &rarr; (Catastrophic)</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 font-mono text-center">
              {matrixCells.map((cell, idx) => (
                <div
                  key={idx}
                  title={cell.elements.join(', ') || 'No active alerts'}
                  className={`h-16 rounded-xl border flex flex-col items-center justify-center p-1 transition-all cursor-pointer ${getCellColor(
                    cell.level,
                    cell.highlight
                  )}`}
                >
                  <span className="text-sm font-extrabold">{cell.count}</span>
                  <span className="text-[9px] font-sans opacity-90 truncate max-w-full">
                    {cell.highlight ? 'High Hazard' : `${cell.level}`}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-1">
              <span>Likelihood of Failure &uarr; (Frequent to Remote)</span>
              <span>IS 456 Structural Vulnerability Class</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <strong className="text-slate-900 block font-semibold">Risk Matrix Action Trigger:</strong>
            <p className="text-slate-600 leading-relaxed">
              Elements in top-right critical cells (Risk Score &gt; 75) trigger mandatory CPWD Level-3 shoring, structural load shed, and polymer modified micro-concreting directives.
            </p>
          </div>
        </div>

        {/* Right: Critical Hotspots & Distress Hotlist (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Critical Distress & Vulnerability Hotlist
                </h3>
                <p className="text-xs text-slate-500">Priority action items from your inspections</p>
              </div>
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {dynamicHotlist.length > 0 ? (
                dynamicHotlist.map((item, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border space-y-1.5 text-xs transition-all ${
                      item.priority === 'Critical'
                        ? 'bg-red-50/70 border-red-200 ring-1 ring-red-300'
                        : item.priority === 'High'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-extrabold text-slate-900">
                            {item.code}
                          </span>
                          <span className="text-[11px] text-slate-600 font-semibold">&bull; {item.element}</span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 mt-0.5 line-clamp-2">{item.title}</h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          item.priority === 'Critical'
                            ? 'bg-red-600 text-white'
                            : item.priority === 'High'
                            ? 'bg-amber-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">
                        Status: <strong className="text-slate-800">{item.status}</strong>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          if (item.inspection) {
                            onSelectInspection(item.inspection);
                          }
                        }}
                        className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Certificate</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-medium text-slate-600">
                    No critical structural distress detected in your registered assets.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    All completed inspection audits are within safe operational limits.
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('new-inspection')}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Launch New AI Inspection</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

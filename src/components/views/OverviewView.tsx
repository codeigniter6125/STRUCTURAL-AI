import React, { useState } from 'react';
import { Inspection, Building, ActiveTab, TelemetryRecord } from '../../types';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Building2,
  PlusCircle,
  ArrowRight,
  Activity,
  FileText,
  Radio,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface OverviewViewProps {
  buildings: Building[];
  inspections: Inspection[];
  telemetry?: TelemetryRecord[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectInspection: (inspection: Inspection) => void;
  onSelectBuilding: (building: Building) => void;
}

const DEFECT_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];

export const OverviewView: React.FC<OverviewViewProps> = ({
  buildings,
  inspections,
  telemetry = [],
  setActiveTab,
  onSelectInspection,
  onSelectBuilding,
}) => {
  const [telemetryTimeframe, setTelemetryTimeframe] = useState<'24h' | '7d' | '30d'>('24h');

  // Aggregate KPI metrics
  const totalBuildings = buildings.length;
  const criticalBuildings = buildings.filter((b) => b.riskStatus === 'Critical').length;
  const highRiskBuildings = buildings.filter((b) => b.riskStatus === 'High').length;
  const totalInspectionsCount = inspections.length;
  const totalDefectsCount = inspections.reduce((acc, curr) => acc + (curr.defects?.length || 0), 0);
  const averageHealthIndex = buildings.length > 0
    ? Math.round(buildings.reduce((acc, curr) => acc + (curr.healthIndex || 0), 0) / buildings.length)
    : 100;

  // Extract Defect Distribution from real inspections
  const defectCounts: Record<string, number> = {};
  inspections.forEach((insp) => {
    insp.defects?.forEach((def) => {
      const type = def.type || 'Unclassified Defect';
      defectCounts[type] = (defectCounts[type] || 0) + 1;
    });
  });

  const defectChartData = Object.entries(defectCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // Structural Health Index by Building Data
  const healthByBuildingData = buildings.map((b) => ({
    name: b.code,
    fullName: b.name,
    healthIndex: b.healthIndex,
    risk: b.riskStatus,
    fill:
      b.healthIndex < 60
        ? '#DC2626'
        : b.healthIndex < 75
        ? '#D97706'
        : b.healthIndex < 85
        ? '#2563EB'
        : '#059669',
  }));

  // Dynamic Telemetry Trend Timeseries
  const telemetryTrendData = [
    { time: '00:00', strain: 310, crack: 1.82, vibration: 3.2 },
    { time: '04:00', strain: 318, crack: 1.89, vibration: 2.8 },
    { time: '08:00', strain: 332, crack: 1.98, vibration: 4.1 },
    { time: '12:00', strain: 348, crack: 2.11, vibration: 4.8 },
    { time: '16:00', strain: 345, crack: 2.14, vibration: 4.6 },
    { time: '20:00', strain: 338, crack: 2.12, vibration: 3.9 },
    { time: 'Now', strain: 342, crack: 2.14, vibration: 4.2 },
  ];

  if (buildings.length === 0) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              StructuralAI Infrastructure Health Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              IS 456 / CPWD compliant AI structural assessment and continuous sensor monitoring.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('buildings')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Building</span>
            </button>
          </div>
        </div>

        {/* Empty State Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs flex flex-col items-center justify-center space-y-4 max-w-2xl mx-auto">
          <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-slate-900">Welcome to Your Personal Workspace</h2>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              No buildings are registered under your account yet. Register your first asset to unlock real-time structural audits, ISO risk matrices, and defect classification.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('buildings')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Building</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('new-inspection')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Test AI Photo Scanner</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Critical Alert Warning Banner */}
      {criticalBuildings > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-red-950">
                  Critical Infrastructure Distress Alert: {criticalBuildings} Building(s) Require Urgent Remediation
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-200 text-red-900 uppercase">
                  Level-3 Hazard
                </span>
              </div>
              <p className="text-xs text-red-800 mt-0.5">
                Rebar corrosion cover spalling & shear fractures detected. CPWD emergency remediation protocol triggered.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('buildings')}
              className="px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>View Critical Buildings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top 4 Core KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Composite Structural Health Index */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Structural Health Index</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900">
                {averageHealthIndex}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 100 SHI</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between font-mono">
            <span>IS 456 Safe Limit: &ge; 70</span>
            <span className={averageHealthIndex < 70 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
              {averageHealthIndex < 70 ? 'Vulnerable' : 'Adequate'}
            </span>
          </div>
        </div>

        {/* KPI 2: Critical Distress Hotspots */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Critical Distress Structures</span>
              <ShieldAlert className="w-4 h-4 text-red-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-red-600">
                {criticalBuildings}
              </span>
              <span className="text-xs text-slate-500">of {totalBuildings} registered</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between font-mono">
            <span>High Risk: {highRiskBuildings}</span>
            <span className={criticalBuildings > 0 ? 'text-red-700 font-bold' : 'text-emerald-700 font-bold'}>
              {criticalBuildings > 0 ? 'Level-3 Action Required' : 'Optimal'}
            </span>
          </div>
        </div>

        {/* KPI 3: Total Inspections & Mapped Defects */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>AI Inspections Completed</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900">
                {totalInspectionsCount}
              </span>
              <span className="text-xs text-slate-500">certified audits</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between font-mono">
            <span className="text-blue-700 font-bold">{totalDefectsCount} defects</span>
            <span>CAD Bounding Boxes</span>
          </div>
        </div>

        {/* KPI 4: Active Vision Telemetry */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>AI Vision Workflow</span>
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-emerald-600">
                100%
              </span>
              <span className="text-xs text-slate-500">Roboflow Online</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between font-mono">
            <span className="text-slate-600">Serverless API</span>
            <span className="text-emerald-700 font-bold">Active</span>
          </div>
        </div>
      </div>

      {/* Row of Charts: Structural Health & Defect Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Structural Health Index by Monitored Asset (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Structural Health Index (SHI) by Monitored Asset</span>
              </h3>
              <p className="text-xs text-slate-500">
                Asset comparison against IS 456 safety threshold (&ge; 70 SHI)
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span>&lt;60 Critical</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>60-74 Warning</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>&ge;75 Safe</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthByBuildingData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs font-mono shadow-lg border border-slate-800 space-y-1">
                          <p className="font-bold text-amber-400">{data.fullName} ({data.name})</p>
                          <p>Health Index: <strong>{data.healthIndex} / 100</strong></p>
                          <p>Risk Status: <span className="font-bold text-red-300">{data.risk}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'IS 456 Safe Baseline (70)', position: 'insideTopRight', fill: '#EF4444', fontSize: 10 }} />
                <Bar dataKey="healthIndex" radius={[6, 6, 0, 0]}>
                  {healthByBuildingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Defect Classification Breakdown (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-purple-600" />
              <span>Forensic Defect Breakdown</span>
            </h3>
            <p className="text-xs text-slate-500">Real Roboflow classified defects</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {defectChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={defectChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {defectChartData.map((entry, index) => (
                      <Cell key={`defect-${index}`} fill={DEFECT_COLORS[index % DEFECT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2 rounded-lg text-xs font-mono shadow-md">
                            <span className="font-bold">{data.name}:</span> {data.count} occurrences
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400 font-mono">
                No defects logged yet. Complete an inspection to view breakdown.
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {defectChartData.slice(0, 4).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center gap-1.5 truncate max-w-[180px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: DEFECT_COLORS[i % DEFECT_COLORS.length] }} />
                  <span className="truncate text-slate-700">{d.name}</span>
                </span>
                <span className="font-bold text-slate-900 shrink-0">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Inspections & Monitored Infrastructure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Certified Inspections */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Recent Forensic Inspections</h3>
              <p className="text-xs text-slate-500">Live feed of certified structural audits</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {inspections.length > 0 ? (
              inspections.slice(0, 5).map((inspection) => (
                <div
                  key={inspection.id}
                  onClick={() => onSelectInspection(inspection)}
                  className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 p-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={inspection.originalImage}
                      alt={inspection.element}
                      className="h-12 w-12 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-900">{inspection.element}</h4>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {inspection.buildingCode}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            inspection.overallRiskLevel === 'Critical'
                              ? 'bg-red-100 text-red-800'
                              : inspection.overallRiskLevel === 'High'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {inspection.overallRiskLevel} Risk
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                        {inspection.diagnosisSummary}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                        <span>{inspection.inspectorName}</span>
                        <span>&bull;</span>
                        <span>{inspection.date}</span>
                        <span>&bull;</span>
                        <span className="text-blue-600 font-semibold">{inspection.defects?.length || 0} defects</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 gap-1">
                    <div className="font-mono font-bold text-xs text-slate-900">
                      SHI: <strong className={inspection.structuralHealthIndex < 60 ? 'text-red-700' : 'text-emerald-700'}>{inspection.structuralHealthIndex}</strong>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 hover:text-blue-600 underline">
                      View Certificate
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No inspections recorded yet. Upload a structural photo to perform an AI audit.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Building Watchlist & Quick Switch */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Monitored Buildings</h3>
              <p className="text-xs text-slate-500">Structural health & status</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('buildings')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Directory
            </button>
          </div>

          <div className="space-y-3">
            {buildings.map((b) => (
              <div
                key={b.id}
                onClick={() => {
                  onSelectBuilding(b);
                  setActiveTab('buildings');
                }}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer bg-slate-50/60 hover:bg-white"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {b.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.riskStatus === 'Critical'
                        ? 'bg-red-100 text-red-800'
                        : b.riskStatus === 'High'
                        ? 'bg-amber-100 text-amber-800'
                        : b.riskStatus === 'Moderate'
                        ? 'bg-blue-100 text-blue-800'
                        : b.riskStatus === 'Unassessed'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {b.riskStatus}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-slate-900 mt-2 line-clamp-1">{b.name}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">{b.type} &bull; {b.city}</p>

                <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 font-mono">
                  <span className="text-slate-500">Health Index:</span>
                  <span className={`font-bold ${b.healthIndex < 60 ? 'text-red-600' : 'text-slate-900'}`}>
                    {b.totalInspections === 0 ? 'Pending Audit' : `${b.healthIndex} / 100`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

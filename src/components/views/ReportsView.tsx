import React, { useState } from 'react';
import { Inspection, ActiveTab } from '../../types';
import {
  FileText,
  Search,
  Printer,
  Download,
  Filter,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  PlusCircle,
  Eye,
} from 'lucide-react';

interface ReportsViewProps {
  inspections: Inspection[];
  onSelectInspection: (inspection: Inspection) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  inspections,
  onSelectInspection,
  setActiveTab,
}) => {
  const [search, setSearch] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('All');

  const filteredInspections = inspections.filter((insp) => {
    const matchesRisk = riskFilter === 'All' || insp.overallRiskLevel === riskFilter;
    const matchesSearch =
      !search ||
      insp.inspectionCode.toLowerCase().includes(search.toLowerCase()) ||
      insp.buildingName.toLowerCase().includes(search.toLowerCase()) ||
      insp.buildingCode.toLowerCase().includes(search.toLowerCase()) ||
      insp.element.toLowerCase().includes(search.toLowerCase()) ||
      insp.inspectorName.toLowerCase().includes(search.toLowerCase());

    return matchesRisk && matchesSearch;
  });

  const exportCSV = () => {
    const headers = [
      'Certificate ID',
      'Asset Code',
      'Asset Name',
      'Element',
      'Inspector',
      'Date',
      'SHI Score',
      'Risk Level',
      'Defect Count',
      'Coverage %',
    ];

    const rows = inspections.map((i) => [
      i.inspectionCode,
      i.buildingCode,
      `"${i.buildingName}"`,
      `"${i.element}"`,
      `"${i.inspectorName}"`,
      i.date,
      i.structuralHealthIndex,
      i.overallRiskLevel,
      i.defects?.length || 0,
      i.totalDefectCoveragePercent,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StructuralAI_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Official Structural Audit & Compliance Certificates</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              IS 456 / CPWD Archive
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Legally archived structural condition assessment records and forensic non-destructive engineering certifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('new-inspection')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Audit</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search certificate ID, asset code, inspector, or crack..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">Filter by Risk:</span>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium text-xs"
          >
            <option value="All">All Risk Levels</option>
            <option value="Critical">Critical Only</option>
            <option value="High">High</option>
            <option value="Moderate">Moderate</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Audit Certificates Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
              <tr>
                <th className="p-3.5 pl-5">Certificate Code</th>
                <th className="p-3.5">Asset & Inspected Member</th>
                <th className="p-3.5">Audit Date</th>
                <th className="p-3.5">Structural Auditor</th>
                <th className="p-3.5 text-center">SHI Score</th>
                <th className="p-3.5">Risk Tier</th>
                <th className="p-3.5">Defects Mapped</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredInspections.map((insp) => (
                <tr key={insp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 pl-5 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {insp.inspectionCode}
                  </td>
                  <td className="p-3.5 max-w-xs">
                    <div className="font-bold text-slate-900 truncate">{insp.element}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      <strong className="font-mono text-blue-700 mr-1">{insp.buildingCode}</strong>
                      {insp.buildingName}
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-slate-600 whitespace-nowrap">
                    {insp.date}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{insp.inspectorName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{insp.inspectorBadge}</div>
                  </td>
                  <td className="p-3.5 text-center font-mono font-bold">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {insp.structuralHealthIndex}
                    </span>
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        insp.overallRiskLevel === 'Critical'
                          ? 'bg-red-100 text-red-800'
                          : insp.overallRiskLevel === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {insp.overallRiskLevel}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-700 whitespace-nowrap">
                    {insp.defects?.length || 0} defects ({insp.totalDefectCoveragePercent}%)
                  </td>
                  <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectInspection(insp)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View / Print Certificate</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

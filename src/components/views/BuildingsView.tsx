import React, { useState } from 'react';
import { Building, ActiveTab } from '../../types';
import { AddBuildingModal } from '../buildings/AddBuildingModal';
import {
  Building2,
  Search,
  Filter,
  ShieldAlert,
  ArrowRight,
  MapPin,
  Calendar,
  Layers,
  Phone,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Clock,
  Sparkles,
  Home,
  Briefcase,
  Factory,
  Building as HospitalIcon,
  GraduationCap,
  Landmark,
  FileCheck,
  Trash2,
} from 'lucide-react';

interface BuildingsViewProps {
  buildings: Building[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectBuilding: (building: Building) => void;
  onAddBuilding?: (building: Building) => void;
  onDeleteBuilding?: (buildingId: string) => void;
}

export const BuildingsView: React.FC<BuildingsViewProps> = ({
  buildings,
  setActiveTab,
  onSelectBuilding,
  onAddBuilding,
  onDeleteBuilding,
}) => {
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [riskFilter, setRiskFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const cities = ['All', ...Array.from(new Set(buildings.map((b) => b.city).filter(Boolean)))];
  const riskLevels = ['All', 'Critical', 'High', 'Moderate', 'Low', 'Unassessed'];
  const buildingTypes = [
    'All',
    'Residential',
    'Commercial',
    'Industrial',
    'Hospital',
    'School',
    'Government',
    'Other',
  ];

  const filteredBuildings = buildings.filter((b) => {
    const matchesCity = cityFilter === 'All' || b.city === cityFilter;
    const matchesRisk =
      riskFilter === 'All' ||
      b.riskStatus === riskFilter ||
      (riskFilter === 'Unassessed' && (b.riskStatus === 'Unassessed' || b.totalInspections === 0));
    const matchesType =
      typeFilter === 'All' ||
      b.type.toLowerCase().includes(typeFilter.toLowerCase()) ||
      (typeFilter === 'Other' && !['residential', 'commercial', 'industrial', 'hospital', 'school', 'government'].includes(b.type.toLowerCase()));
    
    const matchesSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      (b.locality && b.locality.toLowerCase().includes(search.toLowerCase())) ||
      (b.address && b.address.toLowerCase().includes(search.toLowerCase())) ||
      b.city.toLowerCase().includes(search.toLowerCase()) ||
      b.type.toLowerCase().includes(search.toLowerCase()) ||
      (b.buildingUse && b.buildingUse.toLowerCase().includes(search.toLowerCase())) ||
      (b.ownerName && b.ownerName.toLowerCase().includes(search.toLowerCase()));

    return matchesCity && matchesRisk && matchesType && matchesSearch;
  });

  const getTypeIcon = (typeStr: string) => {
    const t = typeStr.toLowerCase();
    if (t.includes('resident')) return <Home className="w-3.5 h-3.5 text-blue-400" />;
    if (t.includes('commercial')) return <Briefcase className="w-3.5 h-3.5 text-emerald-400" />;
    if (t.includes('industr')) return <Factory className="w-3.5 h-3.5 text-amber-400" />;
    if (t.includes('hospit')) return <HospitalIcon className="w-3.5 h-3.5 text-rose-400" />;
    if (t.includes('school')) return <GraduationCap className="w-3.5 h-3.5 text-purple-400" />;
    if (t.includes('gov')) return <Landmark className="w-3.5 h-3.5 text-sky-400" />;
    return <Building2 className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Monitored Infrastructure Buildings Registry
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
              IS 456 / CPWD Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Zonal registry of residential societies, industrial factories, public hospitals, schools, commercial plazas, and RCC frame buildings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all hover:shadow-sm active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Building</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('new-inspection')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <FileCheck className="w-4 h-4 text-blue-400" />
            <span>Audit Scanner</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by building code, name, locality, use, owner..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-900"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
            >
              {buildingTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">City / Zone:</span>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Audit Status:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-xs"
            >
              {riskLevels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Buildings Cards Grid */}
      {filteredBuildings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No matching buildings found</h3>
            <p className="text-xs text-slate-500 mt-1">
              No buildings match your current filters or search terms.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register New Building</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBuildings.map((building) => {
            const isUnassessed = building.totalInspections === 0 || building.riskStatus === 'Unassessed';

            return (
              <div
                key={building.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Asset Header Image & Tag */}
                  <div className="relative h-48 bg-slate-950">
                    <img
                      src={building.thumbnail}
                      alt={building.name}
                      className="w-full h-full object-cover opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 text-white font-mono text-xs font-bold border border-slate-700 shadow-sm">
                        {building.code}
                      </span>
                      
                      {/* Badge: NOT ASSESSED / UNASSESSED vs Critical / High / Moderate / Low */}
                      {isUnassessed ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-700/90 text-amber-300 border border-amber-400/40 flex items-center gap-1 shadow-xs">
                          <Clock className="w-3 h-3" />
                          <span>NOT ASSESSED</span>
                        </span>
                      ) : (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            building.riskStatus === 'Critical'
                              ? 'bg-red-600 text-white shadow-xs'
                              : building.riskStatus === 'High'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : building.riskStatus === 'Moderate'
                              ? 'bg-yellow-600 text-white shadow-xs'
                              : 'bg-emerald-600 text-white shadow-xs'
                          }`}
                        >
                          {building.riskStatus} Risk
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center gap-1.5 border border-white/10">
                        {getTypeIcon(building.type)}
                        <span>{building.type}</span>
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-bold text-base leading-snug drop-shadow-xs">{building.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span className="truncate">{building.locality || building.address || building.city}, {building.state}</span>
                        </span>
                        <span>&bull;</span>
                        <span>Built {building.yearBuilt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 space-y-4 text-xs">
                    {/* Structural & Usage Specs */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                          Floors / Spans
                        </span>
                        <span className="font-medium text-slate-800">{building.totalFloorsOrSpans}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                          Occupancy / Use
                        </span>
                        <span className="font-medium text-slate-800 truncate block">
                          {building.buildingUse || `${building.type} Complex`}
                        </span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-200/60">
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                          Owner / Managing Body
                        </span>
                        <span className="font-medium text-slate-800 truncate block">
                          {building.ownerName || 'East Delhi Municipal Authority / Society'}
                        </span>
                      </div>
                    </div>

                    {/* Health Metrics & Gauges */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-xl border border-slate-100 bg-white">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Health Index</div>
                        <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                          {isUnassessed ? '--' : `${building.healthIndex}`} <span className="text-xs text-slate-400">{isUnassessed ? '(Pending)' : '/ 100'}</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl border border-slate-100 bg-white">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Audits Filed</div>
                        <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
                          {building.totalInspections}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl border border-slate-100 bg-white">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Critical Defects</div>
                        <div
                          className={`text-lg font-bold font-mono mt-0.5 ${
                            building.criticalDefectsCount > 0 ? 'text-red-600' : 'text-slate-700'
                          }`}
                        >
                          {building.criticalDefectsCount}
                        </div>
                      </div>
                    </div>

                    {/* Key Structural Elements List */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Monitored Structural Elements:
                      </div>
                      <div className="space-y-1">
                        {building.keyElements && building.keyElements.length > 0 ? (
                          building.keyElements.slice(0, 3).map((elem) => (
                            <div
                              key={elem.code}
                              className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 text-[11px]"
                            >
                              <span className="font-medium text-slate-800 truncate mr-2">
                                <strong className="font-mono text-blue-700 mr-1.5">{elem.code}</strong>
                                {elem.name}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                                  elem.condition === 'Critical'
                                    ? 'bg-red-100 text-red-800'
                                    : elem.condition === 'High'
                                    ? 'bg-amber-100 text-amber-800'
                                    : elem.condition === 'Moderate'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : elem.condition === 'Unassessed'
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {elem.condition}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">No structural members indexed yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate max-w-[200px]">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700 truncate">{building.contactOfficer?.agency || 'EDMC Civil Division'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onDeleteBuilding && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to remove "${building.name}" (${building.code}) from your registered infrastructure database?`)) {
                            onDeleteBuilding(building.id);
                          }
                        }}
                        title="Delete asset"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {isUnassessed ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectBuilding(building);
                          setActiveTab('new-inspection');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <span>Audit Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectBuilding(building);
                          setActiveTab('new-inspection');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <span>New Inspection</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Building Modal */}
      <AddBuildingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddBuilding={(newBld) => {
          if (onAddBuilding) {
            onAddBuilding(newBld);
          }
        }}
      />
    </div>
  );
};

import React from 'react';
import { ActiveTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  PlusCircle,
  ShieldAlert,
  Bell,
  HardHat,
  UserCheck,
  Building,
  Key,
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openAuthModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  criticalAlertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openAuthModal,
  searchQuery,
  setSearchQuery,
  criticalAlertCount,
}) => {
  const { user } = useAuth();

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Infrastructure Health & Audit Overview';
      case 'new-inspection':
        return 'New Forensic AI Inspection & Defect Analysis';
      case 'buildings':
        return 'Buildings & Structural Directory';
      case 'risk-monitor':
        return 'Live Risk Matrix & Hotspot Telemetry';
      case 'reports':
        return 'Official IS 456 Structural Audit Certificates';
      default:
        return 'StructuralAI';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
      {/* Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
            CPWD &bull; DMRC &bull; NHAI Infrastructure Audit System
          </div>
          <h2 className="text-sm font-bold text-slate-900 leading-tight">
            {getBreadcrumbTitle()}
          </h2>
        </div>
      </div>

      {/* Center Search / Filter */}
      <div className="hidden md:flex items-center max-w-md w-72 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search B-203, DMRC, crack, column..."
          className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Roboflow Status Badge */}
        <button
          type="button"
          onClick={() => setActiveTab('new-inspection')}
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-blue-50 text-blue-800 border border-blue-200/80 hover:bg-blue-100 transition-colors"
          title="Roboflow Workflow general-segmentation-api-2 is Active"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Roboflow CV Active</span>
        </button>

        {/* Critical Alert Pill */}
        {criticalAlertCount > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('risk-monitor')}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/80 hover:bg-red-100 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span>{criticalAlertCount} Critical Hazards</span>
          </button>
        )}

        {/* Primary CTA: New Inspection */}
        {activeTab !== 'new-inspection' && (
          <button
            type="button"
            onClick={() => setActiveTab('new-inspection')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Inspection</span>
          </button>
        )}

        {/* Auth / Inspector Profile Pill */}
        <button
          type="button"
          onClick={openAuthModal}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-colors"
          title="Manage Inspector Account & Supabase Auth"
        >
          <div className="h-6 w-6 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-[10px]">
            {user?.fullName?.charAt(0) || 'E'}
          </div>
          <span className="hidden sm:inline max-w-[120px] truncate">{user?.fullName || 'Inspector'}</span>
        </button>
      </div>
    </header>
  );
};

import React from 'react';
import { ActiveTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  Building2,
  Building,
  ShieldAlert,
  FileCheck,
  HardHat,
  Cpu,
  LogOut,
  UserCheck,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openAuthModal: () => void;
  criticalCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openAuthModal,
  criticalCount,
}) => {
  const { user, isSupabaseLive } = useAuth();

  const navItems: { id: ActiveTab; label: string; icon: any; badge?: string | number; badgeColor?: string; description: string }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Zonal Structural Health Index',
    },
    {
      id: 'buildings',
      label: 'Buildings',
      icon: Building2,
      description: 'Directory & Structural Registry',
    },
    {
      id: 'new-inspection',
      label: 'New Inspection',
      icon: PlusCircle,
      badge: 'AI Scan',
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
      description: 'Upload, Detect & IS 456 Audit',
    },
    {
      id: 'risk-monitor',
      label: 'Risk Monitor',
      icon: ShieldAlert,
      badge: criticalCount > 0 ? criticalCount : undefined,
      badgeColor: 'bg-red-500 text-white',
      description: '5x5 Matrix & Early Warnings',
    },
    {
      id: 'reports',
      label: 'Audit Reports',
      icon: FileCheck,
      description: 'Official IS 456 Certificates',
    },
  ];

  return (
    <aside className="w-72 bg-[#0B192C] text-slate-200 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white shadow-md shadow-blue-950">
              <HardHat className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">StructuralAI</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  v2.6
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                Indian Infrastructure Health Portal
              </p>
            </div>
          </div>

          {/* Infrastructure Standards Tag */}
          <div className="mt-3.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800/90 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono text-slate-300 font-medium">Standards Engine:</span>
            <span className="text-amber-400 font-semibold font-mono text-[10px]">IS 456 &bull; IRC 112</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Inspection Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-950 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-xs truncate">{item.label}</div>
                    <div
                      className={`text-[10px] truncate leading-tight ${
                        isActive ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-400'
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-mono ${
                      item.badgeColor || 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User / Inspector Profile Footer */}
      <div className="p-3 border-t border-slate-800 bg-[#081220]">
        <div
          onClick={openAuthModal}
          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <span className={`w-2 h-2 rounded-full ${isSupabaseLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{isSupabaseLive ? 'Supabase Auth' : 'Supabase Auth'}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </div>

          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {user?.fullName?.charAt(0) || 'E'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {user?.fullName || 'Guest Inspector'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.badgeNumber || 'CPWD-AUD-8821'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

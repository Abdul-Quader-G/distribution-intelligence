import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  PackagePlus,
  ShoppingCart,
  Boxes,
  Sparkles,
  TrendingUp,
  LogOut,
  RefreshCw,
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigationItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Locations', path: '/locations', icon: MapPin },
  { name: 'Supply Batches', path: '/supplies', icon: PackagePlus },
  { name: 'Sales Log', path: '/sales', icon: ShoppingCart },
  { name: 'Inventory & Expiry', path: '/inventory', icon: Boxes },
  { name: 'AI Procurement', path: '/procurement', icon: Sparkles, highlight: true },
  { name: 'Savings Analytics', path: '/savings', icon: TrendingUp },
];

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, logout, resetDemoData } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetDemo = async () => {
    if (confirm('Reset and reload realistic presentation seed data?')) {
      try {
        setResetting(true);
        await resetDemoData();
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 3000);
        window.location.reload();
      } catch (err) {
        alert('Failed to reset demo data: ' + err.message);
      } finally {
        setResetting(false);
      }
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-tight tracking-tight">
              Distribution<span className="text-emerald-600 font-extrabold">Intel</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">AI Demand Engine</p>
          </div>
        </div>
      </div>

      {/* Active Product Banner */}
      <div className="mx-4 mt-4 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
        <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Primary Product
          </span>
          <span className="text-[11px] bg-white px-2 py-0.5 rounded-full border border-emerald-200 text-emerald-700 font-bold">
            ${user?.defaultSellingPrice || 7.99}
          </span>
        </div>
        <p className="text-xs font-medium text-slate-800 truncate" title={user?.productName}>
          {user?.productName || 'Apex Organic Greek Yogurt (500g)'}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Cost: ${user?.defaultUnitCost || 4.5} · Margin: {(((user?.defaultSellingPrice || 7.99) - (user?.defaultUnitCost || 4.5)) / (user?.defaultSellingPrice || 7.99) * 100).toFixed(0)}%
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-400 px-3 uppercase tracking-wider mb-2">
          Operations & Intelligence
        </div>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-emerald-600'
                          : item.highlight
                          ? 'text-emerald-500 group-hover:text-emerald-600'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.highlight && !isActive && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                      AI
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-emerald-600" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Demo Reset Tool & Presentation Utility */}
      <div className="p-3 mx-3 mb-2 bg-slate-50 border border-slate-200/80 rounded-xl">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Demo Sandbox
          </span>
          {resetSuccess && (
            <span className="text-[11px] text-emerald-600 font-bold">Data Synced!</span>
          )}
        </div>
        <button
          onClick={handleResetDemo}
          disabled={resetting}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 py-1.5 px-2.5 rounded-lg transition-all shadow-2xs"
          title="Restore fresh 45-day sales history and batch records"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${resetting ? 'animate-spin text-emerald-600' : ''}`} />
          <span>{resetting ? 'Reloading...' : 'Reload Demo Data'}</span>
        </button>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.companyName || 'Distribution'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-screen shrink-0 sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;

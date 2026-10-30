import React from 'react';
import { Menu, Sparkles, Building2, Calendar } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const pageTitles = {
  '/': { title: 'Distribution Dashboard', subtitle: 'Real-time multi-location inventory & operations' },
  '/locations': { title: 'Distribution Locations', subtitle: 'Manage retail storefronts and regional warehouses' },
  '/supplies': { title: 'Supply Batches', subtitle: 'Track incoming product batches, shelf-life and costs' },
  '/sales': { title: 'Daily Sales Log', subtitle: 'Record and analyze daily off-take across locations' },
  '/inventory': { title: 'Inventory & Expiry Tracker', subtitle: 'Earliest-Expiry-First allocation and spoilage risks' },
  '/procurement': { title: 'AI Procurement Centre', subtitle: 'Predictive demand forecasting & automated replenishment' },
  '/savings': { title: 'Savings Analytics', subtitle: 'Evaluate historical losses against projected outcomes' },
};

const Navbar = ({ setIsMobileOpen }) => {
  const location = useLocation();
  const { user } = useAuth();
  const currentMeta = pageTitles[location.pathname] || {
    title: 'Distribution Intelligence',
    subtitle: 'Demand Forecasting & Inventory Optimization'
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Page Titles */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight">
                {currentMeta.title}
              </h2>
              {location.pathname === '/procurement' && (
                <span className="badge-emerald flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> Statistical AI
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Date & Quick Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 text-slate-600 rounded-lg text-xs font-medium border border-slate-200/60">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{todayFormatted}</span>
          </div>

          {location.pathname !== '/procurement' && (
            <Link
              to="/procurement"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Procurement</span>
            </Link>
          )}

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 text-xs text-slate-600">
            <Building2 className="w-4 h-4 text-emerald-600 hidden sm:inline" />
            <span className="font-semibold text-slate-800 truncate max-w-[140px]">
              {user?.companyName || 'Apex Distribution'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

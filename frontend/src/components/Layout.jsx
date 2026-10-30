import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar setIsMobileOpen={setIsMobileOpen} />
        
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        <footer className="py-4 px-6 border-t border-slate-200/60 bg-white text-center text-xs text-slate-400">
          Distribution Intelligence · High-Performance Inventory & AI Demand Platform · Single Product Multi-Location
        </footer>
      </div>
    </div>
  );
};

export default Layout;

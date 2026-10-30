import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  PackagePlus,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import api from '../api/axiosClient';
import KpiCard from '../components/KpiCard';

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-200 rounded-xl"></div>
          <div className="h-80 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
        <h3 className="font-bold">Error loading dashboard</h3>
        <p className="text-sm mt-1">{error}</p>
        <button onClick={fetchDashboardData} className="btn-secondary mt-3">
          Retry
        </button>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const salesTrends = data?.salesTrends || [];
  const locationPerformance = data?.locationPerformance || [];
  const urgentExpiringBatches = data?.urgentExpiringBatches || [];

  return (
    <div className="space-y-8">
      {/* Urgent Alert Banner (if batches expiring soon or stockout risk) */}
      {urgentExpiringBatches.length > 0 && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Near-Expiry Inventory Alert: {urgentExpiringBatches.length} Batches Require Attention
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Certain batches will expire within 7 days. AI Procurement automatically excludes expiring inventory from usable stock to avoid spoilage.
              </p>
            </div>
          </div>
          <Link
            to="/procurement"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-lg shrink-0 transition-colors"
          >
            Review Procurement Plan <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Total Locations"
          value={kpis.totalLocations}
          subtitle="All active storefronts"
          icon={MapPin}
          badge="100% active"
          badgeType="emerald"
        />
        <KpiCard
          title="Units Supplied"
          value={kpis.unitsSupplied?.toLocaleString()}
          subtitle="Total recorded units"
          icon={PackagePlus}
          badge="Refrigerated"
          badgeType="slate"
        />
        <KpiCard
          title="Units Sold"
          value={kpis.unitsSold?.toLocaleString()}
          subtitle="Total customer off-take"
          icon={ShoppingCart}
          trend={`${kpis.unitsSold > 0 ? '+9.8%' : '0%'}`}
          trendPositive={true}
        />
        <KpiCard
          title="Physical Inventory"
          value={kpis.currentInventory?.toLocaleString()}
          subtitle={`Usable: ${kpis.usableInventory?.toLocaleString()}`}
          icon={Boxes}
          badge={`${kpis.expiringInventory || 0} Expiring`}
          badgeType={kpis.expiringInventory > 0 ? 'amber' : 'emerald'}
        />
        <KpiCard
          title="Estimated Losses"
          value={`$${kpis.estimatedLosses?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${kpis.expiredInventory || 0} expired units`}
          icon={AlertTriangle}
          badge="Historical Loss"
          badgeType="rose"
        />
        <KpiCard
          title="Projected Savings"
          value={`$${kpis.projectedSavings?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="AI-guided procurement"
          icon={Sparkles}
          badge="Est. Projected"
          badgeType="emerald"
          highlight={true}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales vs Supply Trends (2 cols) */}
        <div className="card-premium p-5 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Demand & Supply Trajectory (Last 30 Days)</h3>
              <p className="text-xs text-slate-500">
                Daily sales units versus incoming batch replenishment
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-3 rounded-xs bg-emerald-500"></span> Units Sold
              </span>
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="w-3 h-3 rounded-xs bg-blue-500"></span> Units Supplied
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  interval={Math.ceil(salesTrends.length / 7)}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="unitsSold"
                  name="Units Sold"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
                <Area
                  type="monotone"
                  dataKey="unitsSupplied"
                  name="Units Supplied"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSupply)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Location Stock vs Demand Comparison (1 col) */}
        <div className="card-premium p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">Location Distribution</h3>
              <span className="badge-slate">Live Stock</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Physical inventory on hand per location
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={locationPerformance}
                layout="vertical"
                margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="code"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(val) => [`${val} units`, 'Physical Stock']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="physicalInventory" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Highest Stock: {locationPerformance[0]?.code}</span>
            <Link to="/inventory" className="text-emerald-600 font-semibold hover:underline">
              View batches →
            </Link>
          </div>
        </div>
      </div>

      {/* Location Performance Summary Table */}
      <div className="card-premium overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Location Procurement & Performance Matrix</h3>
            <p className="text-xs text-slate-500">
              Live capacity utilization, stockout risks, and recommended supply replenishment
            </p>
          </div>
          <Link
            to="/procurement"
            className="btn-primary self-start sm:self-auto text-xs py-2 px-3.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Next Orders</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Units Sold</th>
                <th className="py-3 px-4">Physical / Usable</th>
                <th className="py-3 px-4">Capacity Load</th>
                <th className="py-3 px-4">Stockout Risk</th>
                <th className="py-3 px-4 text-right">Rec. Supply</th>
                <th className="py-3 px-4 text-right">Est. Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {locationPerformance.map((loc) => {
                const isRiskHigh = loc.stockoutRisk === 'High';
                const isRiskMod = loc.stockoutRisk === 'Moderate';

                return (
                  <tr key={loc.locationId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {loc.code}
                        </span>
                        <span>{loc.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{loc.city}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{loc.unitsSold?.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-baseline gap-1 font-medium">
                        <span className="text-slate-900">{loc.physicalInventory}</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-emerald-700 font-semibold">{loc.usableInventory}</span>
                        {loc.expiringInventory > 0 && (
                          <span className="text-[10px] text-amber-600 ml-1">
                            ({loc.expiringInventory} exp)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-24">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>{loc.capacityUtilization}%</span>
                          <span>{loc.capacityUnits} cap</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              loc.capacityUtilization > 85
                                ? 'bg-amber-500'
                                : loc.capacityUtilization < 20
                                ? 'bg-rose-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, loc.capacityUtilization)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {isRiskHigh ? (
                        <span className="badge-rose">High Risk</span>
                      ) : isRiskMod ? (
                        <span className="badge-amber">Moderate</span>
                      ) : (
                        <span className="badge-emerald">Safe</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {loc.recommendedSupply > 0 ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          +{loc.recommendedSupply} units
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">Sufficient (0)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-700">
                      ${loc.projectedSavings?.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

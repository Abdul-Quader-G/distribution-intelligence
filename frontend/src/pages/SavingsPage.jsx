import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  DollarSign,
  PieChart as PieIcon,
  ArrowUpRight,
  Info,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import {
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

const SavingsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSavings();
  }, []);

  const fetchSavings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/savings');
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load savings analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-80 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const historical = data?.historicalBreakdown || {};
  const projected = data?.projectedBreakdown || {};
  const monthlyComparison = data?.monthlyComparison || [];
  const locationComparison = data?.locationComparison || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Notice */}
      <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-3">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
            Comparative Savings Analytics: Historical Actuals vs Projected AI Outcomes
          </h4>
          <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
            This module benchmarks real-world historical losses (unmanaged oversupply and product expiration) against simulated outcomes with AI demand replenishment.
            <strong className="text-emerald-950"> Projected savings are model estimates</strong> based on unit economics ($4.50 cost, $7.99 price, $3.49 margin) and earliest-expiry inventory protection.
          </p>
        </div>
      </div>

      {/* KPI Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Historical Realized Losses"
          value={`$${summary.historicalRealizedLoss?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Realized spoilage write-offs"
          icon={AlertTriangle}
          badge="Past Loss Record"
          badgeType="rose"
        />
        <KpiCard
          title="Cycle Projected Savings"
          value={`$${summary.cycleProjectedSavings?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Estimated weekly value add"
          icon={Sparkles}
          badge="Est. Projected"
          badgeType="emerald"
          highlight={true}
        />
        <KpiCard
          title="Annualized Projected Savings"
          value={`$${summary.annualizedProjectedSavings?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Based on 52 weekly cycles"
          icon={TrendingUp}
          badge="Annual Estimate"
          badgeType="emerald"
        />
        <KpiCard
          title="Estimated Loss Reduction"
          value={`${summary.estimatedLossReductionPercent}%`}
          subtitle="Potential risk reduction"
          icon={ShieldCheck}
          badge="Model Target"
          badgeType="slate"
        />
      </div>

      {/* Chart: Historical Baseline Loss vs AI Projection (Monthly) */}
      <div className="card-premium p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Loss Benchmark: Baseline Unmanaged vs With AI Guidance ($)
            </h3>
            <p className="text-xs text-slate-500">
              Comparing past unguided losses against projected outcomes with location-wise procurement
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-3 h-3 rounded-xs bg-rose-500"></span> Baseline Loss (Without AI)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-3 rounded-xs bg-emerald-500"></span> Projected Loss (With AI)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyComparison}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(val, name) => [`$${val}`, name]}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="baselineLoss" name="Baseline Loss" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="withAIProjection" name="Projected Loss (With AI)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Side-by-Side Financial Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Historical Losses Profile */}
        <div className="card-premium p-5 border-rose-100">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Historical Loss Profile (Unmanaged)
            </h4>
            <span className="badge-rose">Recorded Actuals</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Actual Expired / Spoiled Units:</span>
              <span className="font-bold text-slate-900">{historical.actualExpiredUnits} units</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Direct Financial Write-off (Cost):</span>
              <span className="font-bold text-rose-600">${historical.actualExpiredLossCost?.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Unmanaged Near-Term Holding Risk:</span>
              <span className="font-bold text-amber-700">${historical.unmanagedHoldingRisk?.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Estimated Historical Stockout Lost Margin:</span>
              <span className="font-bold text-slate-800">${historical.estimatedStockoutLoss?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* AI-Guided Projected Outcomes */}
        <div className="card-premium p-5 border-emerald-200 bg-linear-to-b from-white to-emerald-50/10">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" /> AI-Guided Projected Outcomes
            </h4>
            <span className="badge-emerald">Projected Model</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100">
              <span className="text-slate-700">Projected Prevented Spoilage Value:</span>
              <span className="font-bold text-emerald-800">${projected.preventedSpoilageSavings?.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100">
              <span className="text-slate-700">Projected Stockout Margin Recovery:</span>
              <span className="font-bold text-emerald-800">${projected.preventedStockoutSavings?.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100">
              <span className="text-slate-700">Optimized Working Capital / Logistics:</span>
              <span className="font-bold text-emerald-800">${projected.optimizedWorkingCapital?.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-emerald-100/70 rounded-lg border border-emerald-300">
              <span className="font-bold text-emerald-950">Total Cycle Projected Savings:</span>
              <span className="font-extrabold text-emerald-950 text-sm">${projected.totalProjectedCycleSavings?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Savings Opportunity Matrix */}
      <div className="card-premium overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            Location-Level Projected Opportunity Matrix
          </h3>
          <p className="text-xs text-slate-500">
            Projected financial outcome comparison by storefront based on demand variance
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Usable Stock</th>
                <th className="py-3 px-4">Expiring Stock</th>
                <th className="py-3 px-4">Rec. Supply</th>
                <th className="py-3 px-4">Est. Loss Without Action</th>
                <th className="py-3 px-4 font-bold text-emerald-800">Est. Projected Savings</th>
                <th className="py-3 px-4 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {locationComparison.map((loc) => (
                <tr key={loc.locationId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded mr-1.5 border border-slate-200">
                      {loc.code}
                    </span>
                    {loc.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{loc.city}</td>
                  <td className="py-3 px-4 font-medium text-slate-700">{loc.usableInventory}u</td>
                  <td className="py-3 px-4">
                    {loc.expiringInventory > 0 ? (
                      <span className="text-amber-700 font-semibold">{loc.expiringInventory}u at risk</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    +{loc.recommendedSupply}u
                  </td>
                  <td className="py-3 px-4 text-rose-600 font-medium">
                    ${loc.projectedLossWithoutAction?.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-700 bg-emerald-50/40">
                    +${loc.projectedSavings?.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="badge-emerald">{loc.confidenceScore}%</span>
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

export default SavingsPage;

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  PackagePlus,
  ShieldCheck,
  Calendar,
  Layers,
  HelpCircle,
  FileCheck2,
  Info
} from 'lucide-react';
import api from '../api/axiosClient';
import KpiCard from '../components/KpiCard';

const ProcurementPage = () => {
  const [procurementData, setProcurementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [horizonDays, setHorizonDays] = useState(7);
  const [recalculating, setRecalculating] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, [horizonDays]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/procurement?horizonDays=${horizonDays}`);
      if (res.data?.success) {
        setProcurementData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load procurement recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateAll = async () => {
    try {
      setRecalculating(true);
      await fetchRecommendations();
    } finally {
      setRecalculating(false);
    }
  };

  const handleApproveOrder = async (forecastId, locationName, recommendedUnits) => {
    if (recommendedUnits <= 0) {
      alert('This location has sufficient inventory. No replenishment needed.');
      return;
    }

    if (confirm(`Approve procurement of ${recommendedUnits} units for "${locationName}"? This will auto-generate a fresh supply batch.`)) {
      try {
        setApprovingId(forecastId);
        const res = await api.post(`/procurement/approve/${forecastId}`);
        if (res.data?.success) {
          setSuccessMessage(res.data.message);
          setTimeout(() => setSuccessMessage(''), 5000);
          fetchRecommendations();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to approve procurement order');
      } finally {
        setApprovingId(null);
      }
    }
  };

  if (loading && !procurementData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  const summary = procurementData?.summary || {};
  const forecasts = procurementData?.data || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-emerald flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Automated Procurement Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Horizon: {horizonDays}-Day Cycle
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Optimizes replenishment orders using Weighted Moving Average sales velocity minus near-term expiring stock.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={horizonDays}
            onChange={(e) => setHorizonDays(Number(e.target.value))}
            className="input-field text-xs py-1.5 px-3 w-auto"
          >
            <option value={7}>7-Day Supply Cycle</option>
            <option value={10}>10-Day Supply Cycle</option>
            <option value={14}>14-Day Supply Cycle</option>
          </select>

          <button
            onClick={handleRecalculateAll}
            disabled={recalculating}
            className="btn-secondary text-xs py-1.5"
            title="Recalculate forecast models based on latest sales"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{recalculating ? 'Forecasting...' : 'Recalculate'}</span>
          </button>
        </div>
      </div>

      {/* Mandatory Projection Notice Banner */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-blue-950">Mathematical Projection Notice: </strong>
          Projected savings and stockout margins displayed below are algorithmic estimates derived from target period sales velocity, product gross margin ($3.49/unit), and prevented spoilage penalties. They represent potential optimization value, not realized accounting records.
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Network Rollup KPI Summary (6 items) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="Predicted Demand"
          value={`${summary.totalPredictedDemand?.toLocaleString()}`}
          subtitle={`${horizonDays}-day total network`}
          badge="WMA Model"
          badgeType="slate"
        />
        <KpiCard
          title="Physical Stock"
          value={`${summary.totalPhysicalInventory?.toLocaleString()}`}
          subtitle="All batches in stores"
          badge="On Hand"
          badgeType="slate"
        />
        <KpiCard
          title="Expiring Inventory"
          value={`${summary.totalExpiringInventory?.toLocaleString()}`}
          subtitle={`Spoils ≤ ${horizonDays} days`}
          badge={summary.totalExpiringInventory > 0 ? "Excluded" : "Zero"}
          badgeType={summary.totalExpiringInventory > 0 ? "amber" : "emerald"}
        />
        <KpiCard
          title="Usable Inventory"
          value={`${summary.totalUsableInventory?.toLocaleString()}`}
          subtitle="Safe stock for cycle"
          badge="Physical - Expiring"
          badgeType="emerald"
        />
        <KpiCard
          title="Recommended Supply"
          value={`${summary.totalRecommendedSupply?.toLocaleString()}`}
          subtitle="Total procurement units"
          badge="Net Deficit"
          badgeType="emerald"
          highlight={true}
        />
        <KpiCard
          title="Projected Savings"
          value={`$${summary.totalProjectedSavings?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Estimated value add"
          badge="Est. Projected"
          badgeType="emerald"
          highlight={true}
        />
      </div>

      {/* Procurement Formula Card */}
      <div className="card-premium p-4 bg-linear-to-r from-emerald-50/50 via-white to-slate-50 border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-sm shrink-0">
            fx
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Procurement Optimization Formula
            </h4>
            <p className="text-xs font-mono text-emerald-900 mt-0.5">
              Recommended Supply = max( 0 , Forecast Demand - Usable Inventory )
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-white px-3 py-2 rounded-lg border border-slate-200">
          Usable Inventory = Physical Stock - Quantities Expiring Before Day {horizonDays}
        </div>
      </div>

      {/* Location-wise Detailed Forecast Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Location-by-Location Procurement Orders ({forecasts.length})
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {forecasts.map((fc) => {
            const loc = fc.location;
            const isHighRisk = fc.projectedStockoutRisk === 'High';
            const isModRisk = fc.projectedStockoutRisk === 'Moderate';
            const isOrdered = fc.status === 'ordered';
            const details = fc.calculationDetails || {};
            const projections = details.dailyProjections || [];

            return (
              <div
                key={fc._id}
                className="card-premium p-5 transition-all hover:border-slate-300 shadow-soft"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
                      {loc?.code}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>{loc?.name}</span>
                        {isHighRisk && <span className="badge-rose">Stockout Risk: High</span>}
                        {isModRisk && <span className="badge-amber">Stockout Risk: Moderate</span>}
                        {!isHighRisk && !isModRisk && <span className="badge-emerald">Healthy Stock</span>}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {loc?.type} · {loc?.city}, {loc?.state} · Storage Capacity: {loc?.capacityUnits} units
                      </p>
                    </div>
                  </div>

                  {/* Status & Approval CTA */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {isOrdered ? (
                      <span className="badge-emerald text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold">
                        <FileCheck2 className="w-4 h-4 text-emerald-600" /> Order Placed & Booked
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApproveOrder(fc._id, loc?.name, fc.recommendedSupply)}
                        disabled={approvingId === fc._id || fc.recommendedSupply <= 0}
                        className={`text-xs py-2 px-4 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                          fc.recommendedSupply > 0
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        <span>
                          {approvingId === fc._id
                            ? 'Booking Batch...'
                            : fc.recommendedSupply > 0
                            ? `Approve Order (${fc.recommendedSupply} units)`
                            : 'Stock Sufficient'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 6 Metric Comparison Blocks */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase">Predicted Demand</p>
                    <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {fc.predictedTotalDemand} <span className="text-xs font-normal text-slate-500">units</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">~{fc.predictedDailyDemand} units/day</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase">Physical Stock</p>
                    <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {fc.physicalInventory} <span className="text-xs font-normal text-slate-500">units</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">All active batches</p>
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/70">
                    <p className="text-[11px] font-semibold text-amber-800 uppercase">Expiring Stock</p>
                    <p className="text-lg font-extrabold text-amber-900 mt-0.5">
                      {fc.expiringInventory} <span className="text-xs font-normal text-amber-700">units</span>
                    </p>
                    <p className="text-[10px] text-amber-700 mt-0.5">Expires ≤ {fc.targetPeriodDays} days</p>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200/70">
                    <p className="text-[11px] font-semibold text-emerald-800 uppercase">Usable Inventory</p>
                    <p className="text-lg font-extrabold text-emerald-900 mt-0.5">
                      {fc.usableInventory} <span className="text-xs font-normal text-emerald-700">units</span>
                    </p>
                    <p className="text-[10px] text-emerald-700 mt-0.5">Phys - Expiring</p>
                  </div>

                  <div className="p-3 bg-emerald-100/60 rounded-lg border border-emerald-300">
                    <p className="text-[11px] font-bold text-emerald-900 uppercase">Recommended Supply</p>
                    <p className="text-lg font-extrabold text-emerald-950 mt-0.5">
                      {fc.recommendedSupply > 0 ? `+${fc.recommendedSupply}` : '0'}{' '}
                      <span className="text-xs font-normal text-emerald-800">units</span>
                    </p>
                    <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">Formula result</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase">Est. Projected Savings</p>
                    <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                      ${fc.projectedSavings?.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Avoided loss & margin</p>
                  </div>
                </div>

                {/* Day-of-Week Seasonality Daily Forecast Breakdown */}
                {projections.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Day-of-Week Forecast Trajectory:
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                      {projections.map((p) => (
                        <div
                          key={p.dayNumber}
                          className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-center shrink-0 min-w-[50px]"
                        >
                          <div className="text-[10px] text-slate-500 font-semibold">{p.dayName}</div>
                          <div className="text-xs font-bold text-slate-800">{p.predictedUnits}u</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProcurementPage;

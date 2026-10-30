import React, { useState, useEffect } from 'react';
import {
  Boxes,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axiosClient';
import KpiCard from '../components/KpiCard';

const InventoryPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState('all');
  const [horizonDays, setHorizonDays] = useState(7);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInventory();
  }, [horizonDays]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/inventory?horizonDays=${horizonDays}`);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load inventory');
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
        <div className="h-96 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  const breakdown = data?.locationBreakdown || [];
  const selectedLocation = selectedLocationId === 'all'
    ? null
    : breakdown.find(l => l.locationId === selectedLocationId);

  // Batches to display: either for selected location or aggregated across all
  const displayedBatches = selectedLocation
    ? selectedLocation.batches.map(b => ({ ...b, locationName: selectedLocation.location?.name, locationCode: selectedLocation.location?.code }))
    : breakdown.flatMap(lb => lb.batches.map(b => ({ ...b, locationName: lb.location?.name, locationCode: lb.location?.code })));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Physical Inventory"
          value={`${data?.physicalInventory?.toLocaleString()} units`}
          subtitle="All stock in distribution"
          icon={Boxes}
          badge="On Hand"
          badgeType="slate"
        />
        <KpiCard
          title="Usable Inventory"
          value={`${data?.usableInventory?.toLocaleString()} units`}
          subtitle={`Safe for next ${horizonDays} days`}
          icon={CheckCircle2}
          badge="Excludes Expiring"
          badgeType="emerald"
          highlight={true}
        />
        <KpiCard
          title="Expiring Within Horizon"
          value={`${data?.expiringInventory?.toLocaleString()} units`}
          subtitle={`Risk window: next ${horizonDays} days`}
          icon={Clock}
          badge={data?.expiringInventory > 0 ? "Action Required" : "All Safe"}
          badgeType={data?.expiringInventory > 0 ? "amber" : "emerald"}
        />
        <KpiCard
          title="Historical Expiry Loss"
          value={`$${data?.expiredLossCost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${data?.expiredInventory} spoiled units`}
          icon={AlertTriangle}
          badge="Past Loss"
          badgeType="rose"
        />
      </div>

      {/* Logic Explanation Box */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
              Earliest-Expiry-First (EEFO) Allocation Engine
            </h4>
            <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
              Sales records automatically consume the earliest expiring batch first. 
              <strong> Usable Inventory</strong> strictly discounts stock that will spoil before the forecast horizon ({horizonDays} days) concludes, preventing catastrophic food waste and over-estimation of retail stock depth.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <span className="text-xs text-slate-500 font-medium">Evaluation Horizon:</span>
          <select
            value={horizonDays}
            onChange={(e) => setHorizonDays(Number(e.target.value))}
            className="input-field text-xs py-1 px-2.5 w-auto"
          >
            <option value={5}>5 Days</option>
            <option value={7}>7 Days (Standard)</option>
            <option value={10}>10 Days</option>
            <option value={14}>14 Days (Two Weeks)</option>
          </select>
        </div>
      </div>

      {/* Filter and Location Selector Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedLocationId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedLocationId === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Locations ({breakdown.length})
          </button>
          {breakdown.map(lb => (
            <button
              key={lb.locationId}
              onClick={() => setSelectedLocationId(lb.locationId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedLocationId === lb.locationId
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {lb.location?.code} - {lb.location?.name}
            </button>
          ))}
        </div>

        <Link to="/procurement" className="btn-primary text-xs py-1.5">
          <span>Go to AI Procurement</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Batch Breakdown Table */}
      <div className="card-premium overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Batch-Level Shelf-Life & Depletion Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Individual batch tracking with earliest expiry sorting and real-time days-to-expire countdown
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {displayedBatches.length} tracked batches
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Store Location</th>
                <th className="py-3 px-4">Supply Date</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Days Left</th>
                <th className="py-3 px-4">Remaining Units</th>
                <th className="py-3 px-4">Original Qty</th>
                <th className="py-3 px-4">Batch Value</th>
                <th className="py-3 px-4">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedBatches.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    No batches recorded for this view.
                  </td>
                </tr>
              ) : (
                displayedBatches.map((b) => {
                  const days = b.daysUntilExpiry;
                  let classBadge;

                  if (b.status === 'depleted') {
                    classBadge = <span className="badge-slate">Depleted (0 Units)</span>;
                  } else if (days < 0) {
                    classBadge = <span className="badge-rose">Expired (-{Math.abs(days)}d)</span>;
                  } else if (days <= 7) {
                    classBadge = <span className="badge-amber">Expiring Soon ({days}d)</span>;
                  } else {
                    classBadge = <span className="badge-emerald">Fresh ({days}d safe)</span>;
                  }

                  const batchValuation = (b.remainingQuantity * (b.unitCost || 4.5)).toFixed(2);

                  return (
                    <tr key={b._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{b.locationName}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({b.locationCode})</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(b.supplyDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {new Date(b.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={days < 0 ? 'text-rose-600' : days <= 7 ? 'text-amber-600' : 'text-emerald-700'}>
                          {days > 0 ? `+${days} days` : `${days} days`}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {b.remainingQuantity} units
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {b.originalQuantity} units
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        ${batchValuation}
                      </td>
                      <td className="py-3 px-4">
                        {classBadge}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  Filter,
  Search,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

const SalesPage = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [metrics, setMetrics] = useState({ totalRevenue: 0, totalUnitsSold: 0 });

  // Single Entry Form
  const [singleForm, setSingleForm] = useState({
    location: '',
    date: new Date().toISOString().split('T')[0],
    quantitySold: 45,
    unitPrice: user?.defaultSellingPrice || 7.99,
    notes: 'Standard daily off-take'
  });

  // Bulk Entry Form (date + list of quantities for each location)
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkEntries, setBulkEntries] = useState({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedLocation]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, locationsRes] = await Promise.all([
        api.get(`/sales?location=${selectedLocation}&limit=200`),
        api.get('/locations')
      ]);

      if (salesRes.data?.success) {
        setSales(salesRes.data.data);
        setMetrics(salesRes.data.metrics || { totalRevenue: 0, totalUnitsSold: 0 });
      }
      if (locationsRes.data?.success) {
        setLocations(locationsRes.data.data);
        if (!singleForm.location && locationsRes.data.data.length > 0) {
          setSingleForm(prev => ({ ...prev, location: locationsRes.data.data[0]._id }));
        }
        // Initialize bulk entries
        const initialBulk = {};
        locationsRes.data.data.forEach(l => {
          initialBulk[l._id] = 40;
        });
        setBulkEntries(initialBulk);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.post('/sales', singleForm);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to log sale');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        date: bulkDate,
        entries: Object.keys(bulkEntries).map(locId => ({
          locationId: locId,
          quantitySold: Number(bulkEntries[locId] || 0),
          notes: 'Daily multi-store log'
        }))
      };

      await api.post('/sales/bulk', payload);
      setBulkModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to bulk log sales');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this sales log entry?')) {
      try {
        await api.delete(`/sales/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete sale');
      }
    }
  };

  const filteredSales = sales.filter(s =>
    s.location?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.location?.code?.toLowerCase().includes(search.toLowerCase()) ||
    s.notes?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-premium p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Total Units Sold</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              {metrics.totalUnitsSold?.toLocaleString()} units
            </h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>

        <div className="card-premium p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Total Revenue Recorded</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              ${metrics.totalRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="card-premium p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Avg Daily Velocity</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              {sales.length > 0 ? (metrics.totalUnitsSold / Math.max(1, sales.length)).toFixed(1) : 0} units/day
            </h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Action and Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by store or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="input-field text-xs py-1.5 w-auto"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc._id} value={loc._id}>{loc.code} - {loc.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBulkModalOpen(true)}
            className="btn-secondary text-xs"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>End-of-Day Bulk Entry</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Log Daily Sale</span>
          </button>
        </div>
      </div>

      {/* Sales Table Card */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Quantity Sold</th>
                <th className="py-3 px-4">Unit Selling Price</th>
                <th className="py-3 px-4">Total Revenue</th>
                <th className="py-3 px-4">Notes / Channel</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    Loading sales records...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No sales records found.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {new Date(sale.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{sale.location?.name || 'Location'}</div>
                      <div className="text-[10px] text-slate-400">{sale.location?.code} · {sale.location?.city}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {sale.quantitySold?.toLocaleString()} units
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      ${sale.unitPrice?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      ${sale.revenue?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {sale.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(sale._id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete Sale"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Sale Entry Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="card-premium max-w-md w-full p-6 shadow-xl relative animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Log Daily Store Sale</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter daily customer demand off-take for a specific location.
            </p>

            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Store Location</label>
                <select
                  required
                  value={singleForm.location}
                  onChange={(e) => setSingleForm({ ...singleForm, location: e.target.value })}
                  className="input-field text-xs"
                >
                  {locations.map(loc => (
                    <option key={loc._id} value={loc._id}>{loc.code} - {loc.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sales Date</label>
                  <input
                    type="date"
                    required
                    value={singleForm.date}
                    onChange={(e) => setSingleForm({ ...singleForm, date: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity Sold</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={singleForm.quantitySold}
                    onChange={(e) => setSingleForm({ ...singleForm, quantitySold: Number(e.target.value) })}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Selling Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={singleForm.unitPrice}
                  onChange={(e) => setSingleForm({ ...singleForm, unitPrice: Number(e.target.value) })}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Promotion Tag</label>
                <input
                  type="text"
                  value={singleForm.notes}
                  onChange={(e) => setSingleForm({ ...singleForm, notes: e.target.value })}
                  placeholder="Weekend promotion, standard retail, etc."
                  className="input-field text-xs"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-medium">Calculated Gross Revenue:</span>
                <span className="text-emerald-800 font-extrabold text-sm">
                  ${(singleForm.quantitySold * singleForm.unitPrice).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs"
                >
                  {saving ? 'Recording...' : 'Save Sales Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk End-of-Day Entry Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="card-premium max-w-lg w-full p-6 shadow-xl relative animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">End-of-Day Multi-Location Sales Entry</h3>
            <p className="text-xs text-slate-500 mb-4">
              Quickly submit closing off-take across all storefronts for a single date.
            </p>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Sales Date</label>
                <input
                  type="date"
                  required
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {locations.map(loc => (
                  <div key={loc._id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{loc.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{loc.code} · {loc.city}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={bulkEntries[loc._id] || 0}
                        onChange={(e) => setBulkEntries({ ...bulkEntries, [loc._id]: Number(e.target.value) })}
                        className="input-field text-xs w-24 text-right py-1"
                        placeholder="Units"
                      />
                      <span className="text-xs text-slate-500">units</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs"
                >
                  {saving ? 'Saving...' : 'Submit Bulk Sales'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;

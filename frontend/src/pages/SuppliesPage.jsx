import React, { useState, useEffect } from 'react';
import {
  PackagePlus,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter
} from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

const SuppliesPage = () => {
  const { user } = useAuth();
  const [supplies, setSupplies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState(null);
  const [formData, setFormData] = useState({
    batchNumber: '',
    location: '',
    quantity: 200,
    supplyDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    unitCost: user?.defaultUnitCost || 4.5,
    supplierName: 'Apex Organics Dairy Co.',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedLocation, selectedStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppliesRes, locationsRes] = await Promise.all([
        api.get(`/supplies?location=${selectedLocation}&status=${selectedStatus}`),
        api.get('/locations')
      ]);

      if (suppliesRes.data?.success) {
        setSupplies(suppliesRes.data.data);
      }
      if (locationsRes.data?.success) {
        setLocations(locationsRes.data.data);
        if (!formData.location && locationsRes.data.data.length > 0) {
          setFormData(prev => ({ ...prev, location: locationsRes.data.data[0]._id }));
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load supply records');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingSupply(null);
    const now = new Date();
    const future = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
    setFormData({
      batchNumber: '',
      location: locations[0]?._id || '',
      quantity: 250,
      supplyDate: now.toISOString().split('T')[0],
      expiryDate: future.toISOString().split('T')[0],
      unitCost: user?.defaultUnitCost || 4.5,
      supplierName: 'Apex Organics Dairy Co.',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setEditingSupply(sup);
    setFormData({
      batchNumber: sup.batchNumber,
      location: sup.location?._id || sup.location,
      quantity: sup.quantity,
      supplyDate: new Date(sup.supplyDate).toISOString().split('T')[0],
      expiryDate: new Date(sup.expiryDate).toISOString().split('T')[0],
      unitCost: sup.unitCost,
      supplierName: sup.supplierName || '',
      notes: sup.notes || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async (id, batchNumber) => {
    if (confirm(`Are you sure you want to delete supply batch "${batchNumber}"?`)) {
      try {
        await api.delete(`/supplies/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete supply record');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingSupply) {
        await api.put(`/supplies/${editingSupply._id}`, formData);
      } else {
        await api.post('/supplies', formData);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record supply batch');
    } finally {
      setSaving(false);
    }
  };

  const setExpiryPreset = (days) => {
    const supplyD = new Date(formData.supplyDate || Date.now());
    const exp = new Date(supplyD.getTime() + days * 24 * 60 * 60 * 1000);
    setFormData({ ...formData, expiryDate: exp.toISOString().split('T')[0] });
  };

  const filteredSupplies = supplies.filter(s =>
    s.batchNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.location?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.supplierName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search batch # or location..."
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

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field text-xs py-1.5 w-auto"
            >
              <option value="all">All Batches</option>
              <option value="active">Active Batches</option>
              <option value="expired">Expired Batches</option>
              <option value="depleted">Depleted Batches</option>
            </select>
          </div>
        </div>

        <button onClick={handleOpenAdd} className="btn-primary self-start md:self-auto text-xs">
          <Plus className="w-4 h-4" />
          <span>Record Supply Batch</span>
        </button>
      </div>

      {/* Supplies Table Card */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Supply Date</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Shelf-Life Status</th>
                <th className="py-3 px-4">Original Qty</th>
                <th className="py-3 px-4">Remaining Qty</th>
                <th className="py-3 px-4">Unit Cost</th>
                <th className="py-3 px-4">Total Cost</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400">
                    Loading supply records...
                  </td>
                </tr>
              ) : filteredSupplies.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400">
                    No supply batches found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredSupplies.map((sup) => {
                  const days = sup.daysUntilExpiry;
                  let shelfBadge = <span className="badge-emerald">Fresh ({days}d)</span>;
                  if (days < 0) {
                    shelfBadge = <span className="badge-rose">Expired ({Math.abs(days)}d ago)</span>;
                  } else if (days <= 7) {
                    shelfBadge = <span className="badge-amber">Expiring Soon ({days}d)</span>;
                  }

                  const totalBatchCost = (sup.quantity * sup.unitCost).toFixed(2);

                  return (
                    <tr key={sup._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {sup.batchNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{sup.location?.name || 'Store'}</div>
                        <div className="text-[10px] text-slate-400">{sup.location?.code} · {sup.location?.city}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(sup.supplyDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {new Date(sup.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4">
                        {shelfBadge}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {sup.quantity?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        {sup.remainingQuantity?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        ${sup.unitCost?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        ${totalBatchCost}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(sup)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            title="Edit Batch"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sup._id, sup.batchNumber)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete Batch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Supply Batch Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="card-premium max-w-lg w-full p-6 shadow-xl relative animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingSupply ? 'Edit Supply Batch' : 'Record Inbound Supply Batch'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter incoming perishable batch with production & expiry dates to update Earliest-Expiry-First tracking.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Location</label>
                  <select
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input-field text-xs"
                  >
                    {locations.map(loc => (
                      <option key={loc._id} value={loc._id}>{loc.code} - {loc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch # (Auto if empty)</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    placeholder="BAT-2026-0042"
                    className="input-field text-xs uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity (Units)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supply Date</label>
                  <input
                    type="date"
                    required
                    value={formData.supplyDate}
                    onChange={(e) => setFormData({ ...formData, supplyDate: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Expiry Date</label>
                    <div className="flex gap-1 text-[10px]">
                      <button type="button" onClick={() => setExpiryPreset(7)} className="text-slate-500 hover:text-emerald-700 underline">+7d</button>
                      <button type="button" onClick={() => setExpiryPreset(14)} className="text-slate-500 hover:text-emerald-700 underline">+14d</button>
                      <button type="button" onClick={() => setExpiryPreset(21)} className="text-emerald-600 font-bold underline">+21d</button>
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier / Dairy Co.</label>
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  placeholder="Apex Organics Dairy Co."
                  className="input-field text-xs"
                />
              </div>

              {/* Total Batch Valuation Callout */}
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-medium">Estimated Batch Valuation:</span>
                <span className="text-emerald-800 font-extrabold text-sm">
                  ${(formData.quantity * formData.unitCost).toFixed(2)}
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
                  {saving ? 'Saving...' : editingSupply ? 'Update Batch' : 'Record Supply Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliesPage;

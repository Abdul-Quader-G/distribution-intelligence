import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Phone,
  User,
  Boxes,
  CheckCircle2,
  XCircle,
  Building,
  Search
} from 'lucide-react';
import api from '../api/axiosClient';

const LocationsPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Flagship Retail',
    address: '',
    city: '',
    state: 'NY',
    contactPerson: '',
    contactPhone: '',
    capacityUnits: 1500,
    minSafetyStock: 50
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/locations');
      if (res.data?.success) {
        setLocations(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      code: `LOC-0${locations.length + 1}`,
      type: 'Flagship Retail',
      address: '',
      city: '',
      state: 'NY',
      contactPerson: '',
      contactPhone: '',
      capacityUnits: 1500,
      minSafetyStock: 50
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (loc) => {
    setEditingLocation(loc);
    setFormData({
      name: loc.name,
      code: loc.code,
      type: loc.type,
      address: loc.address || '',
      city: loc.city || '',
      state: loc.state || 'NY',
      contactPerson: loc.contactPerson || '',
      contactPhone: loc.contactPhone || '',
      capacityUnits: loc.capacityUnits || 1500,
      minSafetyStock: loc.minSafetyStock || 50
    });
    setModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Are you sure you want to delete or deactivate "${name}"?`)) {
      try {
        await api.delete(`/locations/${id}`);
        fetchLocations();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete location');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingLocation) {
        await api.put(`/locations/${editingLocation._id}`, formData);
      } else {
        await api.post('/locations', formData);
      }
      setModalOpen(false);
      fetchLocations();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const filteredLocations = locations.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.code.toLowerCase().includes(search.toLowerCase()) ||
    l.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search locations by name, code or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-xs"
          />
        </div>

        <button onClick={handleOpenAdd} className="btn-primary self-start sm:self-auto text-xs">
          <Plus className="w-4 h-4" />
          <span>Add Distribution Location</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((loc) => (
            <div key={loc._id} className="card-premium p-5 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 inline-block mb-1.5">
                      {loc.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{loc.name}</h3>
                    <p className="text-xs text-slate-500">{loc.type} · {loc.city}, {loc.state}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(loc)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Location"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(loc._id, loc.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Location"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Capacity Gauge */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 my-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-medium">Capacity Utilization</span>
                    <span className="font-bold text-slate-800">{loc.capacityUtilization || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (loc.capacityUtilization || 0) > 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, loc.capacityUtilization || 0)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                    <span>Stock: {loc.physicalInventory || 0} units</span>
                    <span>Max: {loc.capacityUnits} units</span>
                  </div>
                </div>

                {/* Contact & Address */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{loc.contactPerson || 'Store Manager'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{loc.contactPhone || '+1 (555) 010-0000'}</span>
                  </div>
                </div>
              </div>

              {/* Footer Stats */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Total Sold: <strong className="text-slate-800">{loc.totalUnitsSold?.toLocaleString() || 0}</strong>
                </span>
                <span className="badge-emerald">
                  {loc.active ? 'Operational' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="card-premium max-w-lg w-full p-6 shadow-xl relative animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingLocation ? 'Edit Distribution Location' : 'Add New Distribution Location'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure store details, storage capacity and safety thresholds
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Downtown Flagship"
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Code (Unique)</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="LOC-06"
                    className="input-field text-xs uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input-field text-xs"
                  >
                    <option value="Flagship Retail">Flagship Retail</option>
                    <option value="Regional Hub">Regional Hub</option>
                    <option value="Supermarket Kiosk">Supermarket Kiosk</option>
                    <option value="Wholesale Outlet">Wholesale Outlet</option>
                    <option value="Convenience Store">Convenience Store</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity (Units)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={formData.capacityUnits}
                    onChange={(e) => setFormData({ ...formData, capacityUnits: Number(e.target.value) })}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Commerce St"
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="New York"
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="John Doe"
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+1 (555) 012-3456"
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
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
                  {saving ? 'Saving...' : editingLocation ? 'Update Location' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationsPage;

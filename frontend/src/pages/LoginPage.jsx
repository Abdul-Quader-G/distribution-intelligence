import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Sparkles, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('admin@distribintel.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@distribintel.com');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Distribution<span className="text-emerald-600">Intelligence</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Single-Product Multi-Location AI Demand & Procurement Platform
          </p>
        </div>

        {/* Card */}
        <div className="card-premium p-8 shadow-card border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Business Owner Portal</h2>
              <p className="text-xs text-slate-500">Sign in to review inventory and procurement</p>
            </div>
            <span className="badge-emerald flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Secure
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@distribintel.com"
                className="input-field"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Fill Pill */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">Evaluation Demo Account</span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" /> Auto-fill credentials
              </button>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-xs text-slate-600 flex items-center justify-between font-mono">
              <span>admin@distribintel.com</span>
              <span className="text-slate-400">admin123</span>
            </div>
          </div>
        </div>

        {/* Value Prop Footer */}
        <div className="mt-8 text-center text-xs text-slate-400 space-y-1">
          <p className="flex items-center justify-center gap-1.5 text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Earliest-Expiry-First (EEFO) Allocation
          </p>
          <p>Location-wise Weighted Moving Average Forecasting</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

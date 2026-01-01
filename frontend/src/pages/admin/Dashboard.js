import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building2, Users, Laptop, Wrench, Shield, TrendingUp, 
  TrendingDown, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatCard = ({ icon: Icon, label, value, subtext, trend, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="card-elevated" data-testid={`stat-${label.toLowerCase().replace(' ', '-')}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-3xl font-semibold text-slate-900">{value}</p>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`mt-4 flex items-center gap-1 text-sm ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span>{Math.abs(trend)}% from last month</span>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0F62FE] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your warranty and asset management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Building2} 
          label="Companies" 
          value={stats?.companies_count || 0}
          color="blue"
        />
        <StatCard 
          icon={Users} 
          label="Users" 
          value={stats?.users_count || 0}
          color="slate"
        />
        <StatCard 
          icon={Laptop} 
          label="Devices" 
          value={stats?.devices_count || 0}
          color="green"
        />
        <StatCard 
          icon={Wrench} 
          label="Parts Tracked" 
          value={stats?.parts_count || 0}
          color="orange"
        />
      </div>

      {/* Warranty Status */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-elevated">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Warranty Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="font-medium text-slate-900">Active Warranties</span>
              </div>
              <span className="text-2xl font-semibold text-emerald-600" data-testid="active-warranties">
                {stats?.active_warranties || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-100 rounded-xl">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-slate-500" />
                <span className="font-medium text-slate-900">Expired Warranties</span>
              </div>
              <span className="text-2xl font-semibold text-slate-600" data-testid="expired-warranties">
                {stats?.expired_warranties || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-slate-900">Active AMC</span>
              </div>
              <span className="text-2xl font-semibold text-blue-600" data-testid="active-amc">
                {stats?.active_amc || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Devices */}
        <div className="card-elevated">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Recent Devices</h3>
          {stats?.recent_devices && stats.recent_devices.length > 0 ? (
            <div className="space-y-3" data-testid="recent-devices-list">
              {stats.recent_devices.map((device, index) => (
                <div 
                  key={device.id || index} 
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Laptop className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {device.brand} {device.model}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {device.serial_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      device.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {device.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Laptop className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No devices added yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-elevated">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Quick Actions</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a 
            href="/admin/companies" 
            className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
          >
            <Building2 className="h-5 w-5 text-slate-400 mb-2 group-hover:text-[#0F62FE]" />
            <p className="text-sm font-medium text-slate-900">Add Company</p>
            <p className="text-xs text-slate-500">Register new customer</p>
          </a>
          <a 
            href="/admin/devices" 
            className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
          >
            <Laptop className="h-5 w-5 text-slate-400 mb-2 group-hover:text-[#0F62FE]" />
            <p className="text-sm font-medium text-slate-900">Add Device</p>
            <p className="text-xs text-slate-500">Register new asset</p>
          </a>
          <a 
            href="/admin/parts" 
            className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
          >
            <Wrench className="h-5 w-5 text-slate-400 mb-2 group-hover:text-[#0F62FE]" />
            <p className="text-sm font-medium text-slate-900">Add Part</p>
            <p className="text-xs text-slate-500">Track replacement</p>
          </a>
          <a 
            href="/admin/amc" 
            className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
          >
            <Shield className="h-5 w-5 text-slate-400 mb-2 group-hover:text-[#0F62FE]" />
            <p className="text-sm font-medium text-slate-900">Add AMC</p>
            <p className="text-xs text-slate-500">Setup service contract</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

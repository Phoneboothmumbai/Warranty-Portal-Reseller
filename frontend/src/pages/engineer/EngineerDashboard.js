import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Wrench, LogOut, Clock, CheckCircle2, AlertCircle, 
  MapPin, Phone, Building2, Laptop, ChevronRight,
  Play, Calendar
} from 'lucide-react';
import { useEngineerAuth } from '../../context/EngineerAuthContext';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';

const API = process.env.REACT_APP_BACKEND_URL;

const EngineerDashboard = () => {
  const navigate = useNavigate();
  const { engineer, token, logout } = useEngineerAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const response = await axios.get(`${API}/api/engineer/my-visits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisits(response.data);
    } catch (err) {
      console.error('Failed to fetch visits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/engineer');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'in_progress': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'assigned': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <Play className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredVisits = visits.filter(v => {
    if (activeTab === 'pending') return v.status === 'assigned' || v.status === 'in_progress';
    return v.status === 'completed';
  });

  const pendingCount = visits.filter(v => v.status === 'assigned' || v.status === 'in_progress').length;
  const completedCount = visits.filter(v => v.status === 'completed').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">{engineer?.name}</p>
                <p className="text-xs text-slate-400">Field Engineer</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-slate-700">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'pending' 
                ? 'text-orange-400 border-b-2 border-orange-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'completed' 
                ? 'text-orange-400 border-b-2 border-orange-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 pb-20">
        {filteredVisits.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === 'pending' ? (
                <Clock className="h-8 w-8 text-slate-400" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-slate-400" />
              )}
            </div>
            <p className="text-slate-500">
              {activeTab === 'pending' ? 'No pending visits' : 'No completed visits'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVisits.map((visit) => (
              <Card 
                key={visit.id} 
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/engineer/visit/${visit.id}`)}
                data-testid={`visit-card-${visit.id}`}
              >
                <CardContent className="p-0">
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(visit.status)} border`}>
                          {getStatusIcon(visit.status)}
                          <span className="ml-1 capitalize">{visit.status.replace('_', ' ')}</span>
                        </Badge>
                        {visit.ticket?.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>

                    {/* Ticket Info */}
                    <div className="mb-3">
                      <p className="font-medium text-slate-900 text-sm">
                        {visit.ticket?.ticket_number}
                      </p>
                      <p className="text-slate-600 text-sm line-clamp-1">
                        {visit.ticket?.subject}
                      </p>
                    </div>

                    {/* Device & Company */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Laptop className="h-4 w-4 text-slate-400" />
                        <span>{visit.device?.brand} {visit.device?.model}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-mono text-xs">{visit.device?.serial_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span>{visit.company?.name}</span>
                      </div>
                      {visit.device?.location && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span>{visit.device.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Times */}
                    {visit.check_in_time && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(visit.check_in_time)}
                        </span>
                        <span>In: {formatTime(visit.check_in_time)}</span>
                        {visit.check_out_time && (
                          <span>Out: {formatTime(visit.check_out_time)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Refresh Button */}
      <div className="fixed bottom-4 right-4">
        <Button 
          onClick={fetchVisits}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg h-12 w-12 p-0"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </Button>
      </div>
    </div>
  );
};

export default EngineerDashboard;

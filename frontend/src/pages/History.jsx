import { useEffect, useState } from 'react';
import { Search, Filter, Clock, CheckCircle, XCircle } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

// Reusable component
const StatusBadge = ({ status }) => {
  const isSuccess = status;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
      isSuccess 
        ? 'bg-green-50 text-green-700 border-green-100' 
        : 'bg-red-50 text-red-700 border-red-100'
    }`}>
      {isSuccess ? <CheckCircle size={12} /> : <XCircle size={12} />}
      {isSuccess ? 'Success' : 'Failed'}
    </span>
  );
};

const History = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = async (isBackground = false) => {
    if (!isBackground) setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/scan-results/`);

      if (!res.ok) throw new Error('Failed to fetch history');

      const data = await res.json();

      setLogs(data);

    } catch (err) {
      console.error('Error fetching history:', err);
      if (!isBackground) setLogs([]);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(false);

    const intervalId = setInterval(() => {
      fetchHistory(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('pl-PL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const filteredLogs = logs.filter(log =>
    log.device?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.device?.ip_address?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Scan History</h2>
        <p className="text-slate-500">Log of all network monitoring activities.</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search logs by device or IP..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
          <Filter size={18} /> Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Time', 'Device', 'Status', 'Response Time', 'Message'].map(header => (
                  <th key={header} className="p-4 text-xs font-semibold text-slate-500 uppercase">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading history...</td></tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm text-slate-600 flex items-center gap-2">
                      <Clock size={16} className="text-slate-400"/>
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="p-4">
                      {/* Tutaj korzystamy z danych prosto z backendu */}
                      <div className="font-medium text-slate-800">{log.device?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{log.device?.ip_address || '---'}</div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="p-4 text-sm font-mono text-slate-600">
                      {log.response_time_ms !== null ? `${log.response_time_ms} ms` : '-'}
                    </td>
                    <td className="p-4 text-sm text-slate-500 truncate max-w-xs">
                       {log.log_message || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
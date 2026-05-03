import { useEffect, useState } from 'react';
import { Search, Clock, CheckCircle, XCircle, Radar } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'scan', label: 'Scans' },
  { id: 'discovery', label: 'Discovery' },
];

const EventBadge = ({ entry }) => {
  if (entry.event_type === 'discovery') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-100">
        <Radar size={12} />
        Discovery
      </span>
    );
  }

  const isOnline = entry.status;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
      isOnline
        ? 'bg-green-50 text-green-700 border-green-100'
        : 'bg-red-50 text-red-700 border-red-100'
    }`}>
      {isOnline ? <CheckCircle size={12} /> : <XCircle size={12} />}
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
};

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchLogs = async (filterId, isBackground = false) => {
    if (!isBackground) setLoading(true);

    try {
      const url = new URL(`${API_BASE}/logs/`);
      if (filterId !== 'all') url.searchParams.set('event_type', filterId);

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch logs');

      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching logs:', err);
      if (!isBackground) setLogs([]);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(activeFilter, false);

    const intervalId = setInterval(() => {
      fetchLogs(activeFilter, true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [activeFilter]);

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('pl-PL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      log.device_name?.toLowerCase().includes(term) ||
      log.ip_address?.toLowerCase().includes(term) ||
      log.message?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Logs</h2>
        <p className="text-slate-500">Combined log of monitoring scans and host discovery events.</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search logs by device, IP or message..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full md:w-auto">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeFilter === filter.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Time', 'Type', 'Device', 'Status', 'Response Time', 'Message'].map((header) => (
                  <th key={header} className="p-4 text-xs font-semibold text-slate-500 uppercase">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading logs...</td></tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const isDiscovery = log.event_type === 'discovery';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm text-slate-600">
                        <span className="flex items-center gap-2">
                          <Clock size={16} className="text-slate-400" />
                          {formatDate(log.timestamp)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                          isDiscovery ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {isDiscovery ? 'Discovery' : 'Scan'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className={`font-medium ${isDiscovery ? 'text-amber-700 italic' : 'text-slate-800'}`}>
                          {log.device_name || 'unknown'}
                        </div>
                        <div className="text-xs text-slate-500">{log.ip_address || '---'}</div>
                      </td>
                      <td className="p-4">
                        <EventBadge entry={log} />
                      </td>
                      <td className="p-4 text-sm font-mono text-slate-600">
                        {log.response_time_ms != null ? `${log.response_time_ms} ms` : '-'}
                      </td>
                      <td className="p-4 text-sm text-slate-500 truncate max-w-xs" title={log.message || ''}>
                        {log.message || '-'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">No logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Logs;

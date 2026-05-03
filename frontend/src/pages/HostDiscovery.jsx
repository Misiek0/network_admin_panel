import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Radar, Clock } from 'lucide-react';
import DiscoveryNetworkFormModal from '../components/DiscoveryNetworkFormModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const API_BASE = 'http://127.0.0.1:8000';

const HostDiscovery = () => {
  const [networks, setNetworks] = useState([]);
  const [pendingHosts, setPendingHosts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [hostNames, setHostNames] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ type: null, network: null });

  const getToken = () => localStorage.getItem('token');
  const getAuthHeaders = () => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const [networksRes, pendingRes, locationsRes, typesRes] = await Promise.all([
        fetch(`${API_BASE}/discovery-networks/`, { headers }),
        fetch(`${API_BASE}/discovered-hosts/pending`, { headers }),
        fetch(`${API_BASE}/locations/`, { headers }),
        fetch(`${API_BASE}/device-types/`, { headers }),
      ]);

      const [networksData, pendingData, locationsData, typesData] = await Promise.all([
        networksRes.json(),
        pendingRes.json(),
        locationsRes.json(),
        typesRes.json(),
      ]);

      setNetworks(Array.isArray(networksData) ? networksData : []);
      setPendingHosts(Array.isArray(pendingData) ? pendingData : []);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
      setDeviceTypes(Array.isArray(typesData) ? typesData : []);
    } catch (error) {
      console.error('Error fetching host discovery data:', error);
      setNetworks([]);
      setPendingHosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const handleSaveNetwork = async (formData) => {
    const isEdit = modalState.type === 'edit';
    const url = isEdit
      ? `${API_BASE}/discovery-networks/${modalState.network.id}`
      : `${API_BASE}/discovery-networks/`;

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Save failed');
      }
      setModalState({ type: null, network: null });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteNetwork = async () => {
    if (!modalState.network) return;
    try {
      const res = await fetch(`${API_BASE}/discovery-networks/${modalState.network.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Delete failed');
      }
      setModalState({ type: null, network: null });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSkipHost = async (hostId) => {
    try {
      const res = await fetch(`${API_BASE}/discovered-hosts/${hostId}/skip`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Skip failed');
      }
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddHostAsDevice = async (host) => {
    const name = (hostNames[host.id] || '').trim();
    if (!name) {
      alert('Provide device name before adding.');
      return;
    }
    if (!locations.length || !deviceTypes.length) {
      alert('Location and device type dictionaries are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/discovered-hosts/${host.id}/accept`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          location_id: locations[0].id,
          device_type_id: deviceTypes[0].id,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Add device failed');
      }
      setHostNames((prev) => ({ ...prev, [host.id]: '' }));
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredNetworks = networks.filter(
    (network) =>
      network.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      network.cidr.includes(searchTerm)
  );

  const formatDateTime = (isoDate) => {
    if (!isoDate) return '-';
    return new Date(isoDate).toLocaleString('pl-PL');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search discovery networks..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setModalState({ type: 'add', network: null })}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm w-full sm:w-auto justify-center shadow-sm"
        >
          <Plus size={18} />
          Add Discovery Network
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Network Name</th>
                <th className="px-6 py-4">Network Address and Mask</th>
                <th className="px-6 py-4">Last Discovery (time)</th>
                <th className="px-6 py-4">New Hosts Count</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400">Loading discovery networks...</td></tr>
              ) : filteredNetworks.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400">No discovery networks found.</td></tr>
              ) : (
                filteredNetworks.map((network) => (
                  <tr key={network.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{network.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{network.cidr}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 text-slate-600">
                        <Clock size={16} className="text-slate-400" />
                        {formatDateTime(network.last_discovery)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2">
                        <Radar size={16} className={network.new_hosts_count > 0 ? 'text-amber-500' : 'text-slate-400'} />
                        {network.new_hosts_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setModalState({ type: 'edit', network })}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => setModalState({ type: 'delete', network })}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pendingHosts.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm !m-0">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">New Hosts Discovered</h3>
              <p className="text-sm text-slate-500">Assign a device name and add each host to inventory, or skip it.</p>
            </div>
            <div className="p-6 space-y-3 max-h-[70vh] overflow-auto">
              {pendingHosts.map((host) => (
                <div key={host.id} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3 items-center p-3 border border-slate-200 rounded-lg">
                  <div className="font-mono text-sm text-slate-700">{host.ip_address}</div>
                  <input
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Device name"
                    value={hostNames[host.id] || ''}
                    onChange={(e) => setHostNames((prev) => ({ ...prev, [host.id]: e.target.value }))}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleAddHostAsDevice(host)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Add Device
                    </button>
                    <button
                      onClick={() => handleSkipHost(host.id)}
                      className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <DiscoveryNetworkFormModal
        isOpen={modalState.type === 'add' || modalState.type === 'edit'}
        onClose={() => setModalState({ type: null, network: null })}
        onSubmit={handleSaveNetwork}
        initialData={modalState.network}
      />

      <DeleteConfirmModal
        isOpen={modalState.type === 'delete'}
        onClose={() => setModalState({ type: null, network: null })}
        onConfirm={handleDeleteNetwork}
        itemName={modalState.network?.name}
        itemLabel="Discovery Network"
      />
    </div>
  );
};

export default HostDiscovery;

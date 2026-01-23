import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Monitor, Wifi, Server, Smartphone, AlertCircle } from 'lucide-react';
import DeviceFormModal from '../components/DeviceFormModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState({ type: null, device: null });
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

      const [devRes, locRes, typeRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/devices/', { headers }),
        fetch('http://127.0.0.1:8000/locations/', { headers }),
        fetch('http://127.0.0.1:8000/device-types/', { headers })
      ]);

      if (devRes.status === 401) {
        console.error("Session expired or unauthorized");
      }

      const devData = await devRes.json();
      const locData = await locRes.json();
      const typeData = await typeRes.json();

      setDevices(Array.isArray(devData) ? devData : []);
      setLocations(Array.isArray(locData) ? locData : []);
      setDeviceTypes(Array.isArray(typeData) ? typeData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (formData) => {
    const isEdit = modalState.type === 'edit';

    const payload = {
      name: formData.name,
      ip_address: formData.ip_address,
      mac_address: formData.mac_address || null,
      location_id: parseInt(formData.location_id),
      device_type_id: parseInt(formData.device_type_id)
    };

    const url = isEdit
      ? `http://127.0.0.1:8000/devices/${modalState.device.id}`
      : 'http://127.0.0.1:8000/devices/';

    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Save failed');
      }

      setModalState({ type: null, device: null });
      fetchData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!modalState.device) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/devices/${modalState.device.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        if (res.status === 403) {
            throw new Error("Permission denied. Only Administrators can delete devices.");
        }
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Delete failed');
      }

      setModalState({ type: null, device: null });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getDeviceStatus = (device) => {
    if (!device.scan_results || device.scan_results.length === 0) {
        return false;
    }

    const lastScan = device.scan_results[device.scan_results.length - 1];
    return lastScan.status; // true (online) lub false (offline)
  };

  const getIcon = (typeName) => {
    switch (typeName?.toLowerCase()) {
      case 'router': return <Wifi className="text-blue-500" size={20} />;
      case 'switch': return <Server className="text-indigo-500" size={20} />;
      case 'pc': return <Monitor className="text-slate-500" size={20} />;
      case 'smartphone': return <Smartphone className="text-green-500" size={20} />;
      default: return <AlertCircle className="text-gray-400" size={20} />;
    }
  };

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.ip_address.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search devices..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setModalState({ type: 'add', device: null })}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm w-full sm:w-auto justify-center shadow-sm"
        >
          <Plus size={18} />
          Add Device
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">MAC Address</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">Loading devices...</td></tr>
              ) : filteredDevices.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">No devices found.</td></tr>
              ) : (
                filteredDevices.map((device) => {
                  const isOnline = getDeviceStatus(device);

                  return (
                    <tr key={device.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">{device.name}</td>
                      <td className="px-6 py-4 font-mono text-xs">{device.ip_address}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          {device.mac_address || '-'}
                      </td>
                      <td className="px-6 py-4">{device.location?.name || '-'}</td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        {getIcon(device.device_type?.name)}
                        {device.device_type?.name}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setModalState({ type: 'edit', device })}
                          className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => setModalState({ type: 'delete', device })}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeviceFormModal
        isOpen={modalState.type === 'add' || modalState.type === 'edit'}
        onClose={() => setModalState({ type: null, device: null })}
        onSubmit={handleSave}
        initialData={modalState.device}
        locations={locations}
        types={deviceTypes}
      />

      <DeleteConfirmModal
        isOpen={modalState.type === 'delete'}
        onClose={() => setModalState({ type: null, device: null })}
        onConfirm={handleDelete}
        deviceName={modalState.device?.name}
      />
    </div>
  );
};

export default Devices;
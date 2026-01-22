import { useEffect, useState } from 'react';
import { Search, Plus, Filter, Laptop, Server, Printer, Router, CheckCircle, XCircle, Trash2, Pencil } from 'lucide-react';
import DeviceFormModal from '../components/DeviceFormModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const API_BASE = 'http://127.0.0.1:8000';

const getDeviceStatus = (device) => {
  const lastScan = device.scan_results?.at(-1); // .at(-1) newer method for last element
  return lastScan?.status ? 'online' : 'offline';
};

const getDeviceIcon = (typeName = '') => {
  const type = typeName.toLowerCase();
  if (type.includes('router') || type.includes('gateway')) return <Router size={20} className="text-purple-500" />;
  if (type.includes('printer')) return <Printer size={20} className="text-orange-500" />;
  if (type.includes('server')) return <Server size={20} className="text-blue-500" />;
  return <Laptop size={20} className="text-slate-500" />;
};

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalState, setModalState] = useState({ type: null, device: null }); // type: 'add' | 'edit' | 'delete' | null

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dev, loc, types] = await Promise.all([
        fetch(`${API_BASE}/devices/`).then(r => r.json()),
        fetch(`${API_BASE}/locations/`).then(r => r.json()),
        fetch(`${API_BASE}/device-types/`).then(r => r.json())
      ]);
      setDevices(dev); setLocations(loc); setDeviceTypes(types);
    } catch (err) {
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (formData) => {
    const isEdit = modalState.type === 'edit';
    const url = isEdit ? `${API_BASE}/devices/${modalState.device.id}` : `${API_BASE}/devices/`;

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Save failed');
      setModalState({ type: null, device: null });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_BASE}/devices/${modalState.device.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setModalState({ type: null, device: null });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredDevices = devices.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.ip_address.includes(searchTerm)
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Device Inventory</h2>
          <p className="text-slate-500">Manage network devices.</p>
        </div>
        <button onClick={() => setModalState({ type: 'add', device: null })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
          <Plus size={18} /> Add Device
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Search devices..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"><Filter size={18} /> Filter</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Device Name', 'IP Address', 'Type', 'Location', 'Status', 'Actions'].map(h => <th key={h} className="p-4 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading...</td></tr> : filteredDevices.map((device) => {
                const isOnline = getDeviceStatus(device) === 'online';
                return (
                  <tr key={device.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">{getDeviceIcon(device.device_type?.name)}</div>
                      <div><p className="font-medium text-slate-800">{device.name}</p><p className="text-xs text-slate-500">{device.mac_address || 'No MAC'}</p></div>
                    </td>
                    <td className="p-4 font-mono text-sm text-slate-600">{device.ip_address}</td>
                    <td className="p-4 text-sm text-slate-600">{device.device_type?.name || '-'}</td>
                    <td className="p-4 text-sm text-slate-600">{device.location?.name || '-'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${isOnline ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                        {isOnline ? <CheckCircle size={12} /> : <XCircle size={12} />} {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModalState({ type: 'edit', device })} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"><Pencil size={18} /></button>
                        <button onClick={() => setModalState({ type: 'delete', device })} className="p-2 hover:bg-red-50 text-red-600 rounded-lg"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <DeviceFormModal
        isOpen={modalState.type === 'add' || modalState.type === 'edit'}
        onClose={() => setModalState({ type: null, device: null })}
        onSubmit={handleSave}
        initialData={modalState.device}
        locations={locations} types={deviceTypes}
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
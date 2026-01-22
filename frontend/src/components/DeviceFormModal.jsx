import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

// --- Reusable Field Components ---
const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" {...props} />
  </div>
);

const SelectField = ({ label, options, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" {...props}>
      <option value="">Select...</option>
      {options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
    </select>
  </div>
);

const DeviceFormModal = ({ isOpen, onClose, onSubmit, initialData, locations, types }) => {
  const [form, setForm] = useState({ name: '', ip_address: '', mac_address: '', location_id: '', device_type_id: '' });

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...initialData, mac_address: initialData.mac_address || '' }
        : { name: '', ip_address: '', mac_address: '', location_id: '', device_type_id: '' });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, location_id: parseInt(form.location_id), device_type_id: parseInt(form.device_type_id) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm !m-0">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">{initialData ? 'Edit Device' : 'Add New Device'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <InputField label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Printer" required />
          <InputField label="IP Address" value={form.ip_address} onChange={e => setForm({...form, ip_address: e.target.value})} placeholder="192.168.1.10" required />

          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Type" options={types} value={form.device_type_id} onChange={e => setForm({...form, device_type_id: e.target.value})} required />
            <SelectField label="Location" options={locations} value={form.location_id} onChange={e => setForm({...form, location_id: e.target.value})} required />
          </div>

          <InputField label="MAC Address" value={form.mac_address} onChange={e => setForm({...form, mac_address: e.target.value})} placeholder="Optional" />

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">{initialData ? 'Save Changes' : 'Add Device'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeviceFormModal;
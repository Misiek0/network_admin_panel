import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const DiscoveryNetworkFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState({ name: '', cidr: '' });

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? { name: initialData.name || '', cidr: initialData.cidr || '' }
          : { name: '', cidr: '' }
      );
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ name: form.name.trim(), cidr: form.cidr.trim() });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm !m-0">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">
            {initialData ? 'Edit Discovery Network' : 'Add Discovery Network'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Network Name</label>
            <input
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Office LAN"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Network Address and Mask</label>
            <input
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.cidr}
              onChange={(e) => setForm({ ...form, cidr: e.target.value })}
              placeholder="192.168.1.0/24"
              required
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">
              {initialData ? 'Save Changes' : 'Add Network'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiscoveryNetworkFormModal;

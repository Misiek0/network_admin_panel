import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import LocalizationFormModal from '../components/LocalizationFormModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const API_BASE = 'http://127.0.0.1:8000';

const Localizations = () => {
  const [localizations, setLocalizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState({ type: null, localization: null });

  const getToken = () => localStorage.getItem('token');

  const getAuthHeaders = () => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };

  const fetchLocalizations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/locations/`, { headers: getAuthHeaders() });
      const data = await res.json();
      setLocalizations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching localizations:', error);
      setLocalizations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalizations();
  }, []);

  const handleSave = async (formData) => {
    const isEdit = modalState.type === 'edit';
    const url = isEdit
      ? `${API_BASE}/locations/${modalState.localization.id}`
      : `${API_BASE}/locations/`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: formData.name }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Save failed');
      }

      setModalState({ type: null, localization: null });
      fetchLocalizations();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!modalState.localization) return;

    try {
      const res = await fetch(`${API_BASE}/locations/${modalState.localization.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Delete failed');
      }

      setModalState({ type: null, localization: null });
      fetchLocalizations();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredLocalizations = localizations.filter((localization) =>
    localization.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search localizations..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setModalState({ type: 'add', localization: null })}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm w-full sm:w-auto justify-center shadow-sm"
        >
          <Plus size={18} />
          Add Localization
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Devices</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="3" className="p-8 text-center text-slate-400">Loading localizations...</td></tr>
              ) : filteredLocalizations.length === 0 ? (
                <tr><td colSpan="3" className="p-8 text-center text-slate-400">No localizations found.</td></tr>
              ) : (
                filteredLocalizations.map((localization) => (
                  <tr key={localization.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{localization.name}</td>
                    <td className="px-6 py-4">{localization.devices_count ?? 0}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setModalState({ type: 'edit', localization })}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => setModalState({ type: 'delete', localization })}
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

      <LocalizationFormModal
        isOpen={modalState.type === 'add' || modalState.type === 'edit'}
        onClose={() => setModalState({ type: null, localization: null })}
        onSubmit={handleSave}
        initialData={modalState.localization}
      />

      <DeleteConfirmModal
        isOpen={modalState.type === 'delete'}
        onClose={() => setModalState({ type: null, localization: null })}
        onConfirm={handleDelete}
        itemName={modalState.localization?.name}
        itemLabel="Localization"
      />
    </div>
  );
};

export default Localizations;

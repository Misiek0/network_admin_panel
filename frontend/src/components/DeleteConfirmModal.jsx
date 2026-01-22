import { AlertTriangle } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, deviceName }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm !m-0">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in duration-200">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="text-red-600" size={24} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Device?</h3>
        <p className="text-slate-500 mb-6">Are you sure you want to delete <strong>{deviceName}</strong>? This cannot be undone.</p>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
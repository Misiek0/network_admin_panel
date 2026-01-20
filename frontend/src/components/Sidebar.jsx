import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Router, History, Server, X } from 'lucide-react';

const Sidebar = ({ isOpen, closeSidebar }) => {
    const location = useLocation();

    const menuItems = [
        { path: '/', label: 'Overview', icon: LayoutDashboard},
        { path: '/devices', label: 'Devices', icon: Router},
        { path: '/history', label: 'Scan History', icon: History},
    ];

    return (
    <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col h-screen border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:shadow-none flex-shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>

      {/* 1. LOGO AND BRANDING */}
      {/* Changed to justify-between to push X button to the right */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3 font-bold text-lg tracking-wide">
          <Server className="text-blue-500" size={24} />
          <span>NET<span className="text-blue-500">ADMIN</span></span>
        </div>

        {/* Close Button (Visible only on mobile) */}
        <button
            onClick={closeSidebar}
            className="md:hidden text-slate-400 hover:text-white transition-colors"
        >
            <X size={20} />
        </button>
      </div>

      {/* 2. NAVIGATION */}
      <nav className="flex-1 py-6 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200 border-l-4 ${
                isActive
                  ? 'bg-slate-800 border-blue-500 text-white' // Active tab style
                  : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white' // Inactive style
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 3. USER FOOTER */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                AD
            </div>
            <div>
                <p className="text-xs font-semibold text-white">Admin User</p>
                <p className="text-[10px] text-slate-400">admin@local</p>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
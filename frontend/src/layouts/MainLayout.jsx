import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const MainLayout = () => {
    return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">

      {/* LEFT SIDE: SIDEBAR */}
      {/* Sidebar has a fixed width defined inside the component */}
      <Sidebar />

      {/* RIGHT SIDE: MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* HEADER (TOP BAR) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">

          {/* Current section title (expandable later) */}
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Network Admin Panel
          </h1>

          {/* System Status (Visual indicator) */}
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold text-green-700 uppercase tracking-wider">System Online</span>
          </div>

        </header>

        {/* WORKSPACE (SUBPAGES RENDER HERE) */}
        <div className="flex-1 overflow-auto p-8 relative">
            {/* <Outlet /> is the placeholder where React Router renders Dashboard, Devices, or History */}
            <div className="max-w-7xl mx-auto">
                <Outlet />
            </div>
        </div>

      </main>
    </div>
  );

};

export default MainLayout;

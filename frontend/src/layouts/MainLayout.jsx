import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* MOBILE OVERLAY
          Dark background that appears under the menu on mobile.
          Clicking it closes the menu.
      */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {/* LEFT SIDE: SIDEBAR */}
      {/* Sidebar has a fixed width defined inside the component */}
      <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />

      {/* RIGHT SIDE: MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* HEADER (TOP BAR) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shadow-sm z-10">

          {/* Current section title (expandable later) */}
          <div className="flex items-center gap-4">
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Network Admin Panel
            </h1>
          </div>

          {/* System Status (Visual indicator) */}
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold text-green-700 uppercase tracking-wider hidden sm:inline">
                System Online
            </span>

            {/* Show only "Online" on screens smaller than SM (mobile) */}
            <span className="text-xs font-bold text-green-700 uppercase tracking-wider sm:hidden">
                Online
            </span>
          </div>

        </header>

        {/* WORKSPACE (SUBPAGES RENDER HERE) */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 relative">
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

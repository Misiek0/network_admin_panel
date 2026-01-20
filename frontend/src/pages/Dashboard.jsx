import { Activity, Wifi, WifiOff, AlertTriangle } from 'lucide-react'

const Dashboard = () => {
    // Mock data for UI visualization (will be replaced by API data later)
  const stats = [
    { label: 'Total Hosts', value: '45', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Online', value: '38', icon: Wifi, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Offline', value: '7', icon: WifiOff, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Active Alerts', value: '2', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

    return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <p className="text-slate-500">Real-time network status monitoring.</p>
      </div>

      {/* Stats Grid - Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:scale-[1.02] cursor-default"
            >
              <div className={`p-4 rounded-lg ${stat.bg}`}>
                <Icon className={stat.color} size={24} />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Placeholder for future Charts/Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-64 flex items-center justify-center text-slate-400 border-dashed">
             Chart Placeholder (Network Traffic)
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-64 flex items-center justify-center text-slate-400 border-dashed">
             Recent Activity Log Placeholder
         </div>
      </div>

    </div>
  );
};

export default Dashboard;
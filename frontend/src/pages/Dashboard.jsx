import { Activity, Wifi, WifiOff, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

const Dashboard = () => {
    // Define start state
  const [stats, setStats] = useState([
    { label: 'Total Hosts', value: 'Loading...', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Online', value: '-', icon: Wifi, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Offline', value: '-', icon: WifiOff, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Active Alerts', value: '-', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
  ]);

  // 2. useEffect runs once after the page loads
  useEffect(() => {
    fetch('http://127.0.0.1:8000/devices/')
      .then(res => res.json())
      .then(data => {
        console.log("Data from API:", data);

        // Calculate number of devices (array length)
        const totalDevices = data.length;

        // Update "Total Hosts" tile
        setStats(prev => {
            const newStats = [...prev];
            // Update the first element (Total Hosts)
            newStats[0] = { ...newStats[0], value: totalDevices.toString() };

            // Optional: If status data is available, calculate online/offline here
            // Keep '-' for others for now, focusing on Total Hosts
            return newStats;
        });
      })
      .catch(err => {
        console.error("Error connecting with API:", err);
        setStats(prev => {
            const newStats = [...prev];
            newStats[0] = { ...newStats[0], value: "Error" };
            return newStats;
        });
      });
  }, []);

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
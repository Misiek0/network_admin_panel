import { Activity, Wifi, WifiOff, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

const Dashboard = () => {
    // Define start state
  const [stats, setStats] = useState([
    { label: 'Total Hosts', value: 'Loading...', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Online', value: '-', icon: Wifi, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Offline', value: '-', icon: WifiOff, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Active Alerts', value: '-', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
  ]);

  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [devicesRes, pendingRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/devices/'),
          fetch('http://127.0.0.1:8000/discovered-hosts/pending'),
        ]);

        const devices = await devicesRes.json();
        const pendingHosts = pendingRes.ok ? await pendingRes.json() : [];

        const totalDevices = devices.length;
        let onlineCount = 0;
        const allScans = [];

        devices.forEach(device => {
            if (device.scan_results && device.scan_results.length > 0) {
                const lastScan = device.scan_results[device.scan_results.length - 1];
                if (lastScan.status === true) {
                    onlineCount++;
                }

                device.scan_results.forEach(scan => {
                    allScans.push({
                        id: scan.id,
                        device_name: device.name,
                        status: scan.status,
                        time: scan.timestamp
                    });
                });
            }
        });

        allScans.sort((a, b) => new Date(b.time) - new Date(a.time));
        setActivities(allScans.slice(0, 5));

        const offlineCount = totalDevices - onlineCount;
        const pendingCount = Array.isArray(pendingHosts) ? pendingHosts.length : 0;

        setStats(prev => {
            const newStats = [...prev];
            newStats[0] = { ...newStats[0], value: totalDevices.toString() };
            newStats[1] = { ...newStats[1], value: onlineCount.toString() };
            newStats[2] = { ...newStats[2], value: offlineCount.toString() };
            newStats[3] = { ...newStats[3], value: pendingCount.toString() };
            return newStats;
        });
      } catch (err) {
        console.error("Error connecting with API:", err);
        setStats(prev => {
            const newStats = [...prev];
            newStats[0] = { ...newStats[0], value: "Error" };
            return newStats;
        });
      }
    };

    fetchDashboardData();
    const intervalId = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(intervalId);
  }, []);

    const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

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
             Network Latency Chart (Coming Soon)
         </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80 flex flex-col">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock size={20} className="text-slate-400"/> Recent Activity
             </h3>

             <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                {activities.length > 0 ? (
                    <div className="space-y-3">
                        {activities.map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    {log.status ?
                                        <CheckCircle size={18} className="text-green-500" /> :
                                        <XCircle size={18} className="text-red-500" />
                                    }
                                    <span className="font-medium text-slate-700">{log.device_name}</span>
                                </div>
                                <span className="text-xs text-slate-400 font-mono">
                                    {formatTime(log.time)}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                        No recent activity found.
                    </div>
                )}
             </div>
         </div>

      </div>

    </div>
  );
};

export default Dashboard;
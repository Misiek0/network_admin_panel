import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Devices from './pages/Devices.jsx';
import History from './pages/History.jsx';
import MainLayout from "./layouts/MainLayout.jsx";
import Login from "./pages/Login.jsx";

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));

    const handleLogin = (accessToken) => {
        localStorage.setItem('token', accessToken);
        setToken(accessToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
    };

    if (!token) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainLayout onLogout={handleLogout} />}>
                    <Route index element={<Dashboard />} />
                    <Route path="/devices" element={<Devices />} />
                    <Route path="/history" element={<History />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
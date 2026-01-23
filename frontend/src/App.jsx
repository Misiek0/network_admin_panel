import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Devices from './pages/Devices.jsx';
import History from './pages/History.jsx';
import MainLayout from "./layouts/MainLayout.jsx";
import Login from "./pages/Login.jsx";

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');

    const handleLogin = (accessToken, email) => {
        localStorage.setItem('token', accessToken);
        localStorage.setItem('userEmail', email); // Zapisujemy email
        setToken(accessToken);
        setUserEmail(email);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail'); // Czyścimy email
        setToken(null);
        setUserEmail('');
    };

    if (!token) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* ZMIANA: Przekazujemy userEmail do MainLayout */}
                <Route path="/" element={<MainLayout onLogout={handleLogout} userEmail={userEmail} />}>
                    <Route index element={<Dashboard />} />
                    <Route path="/devices" element={<Devices />} />
                    <Route path="/history" element={<History />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
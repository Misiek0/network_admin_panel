import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Devices from './pages/Devices.jsx';
import History from './pages/History.jsx';

function App(){
    return(
      <BrowserRouter>
          <Routes>
              <Route path="/" element={<Dashboard/>}/>
              <Route path="/devices" element={<Devices/>}/>
              <Route path="/history" element={<History/>}/>
          </Routes>
      </BrowserRouter>
    );
}

export default App;
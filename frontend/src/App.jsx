import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DashboardNew from './components/DashboardNew';
import DataEntry from './components/DataEntry';
import Report from './components/Report';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
	<Route path="/dashboard-new" element={<DashboardNew />} />
        <Route path="/data-entry" element={<DataEntry />} />
        <Route path="/report" element={<Report />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
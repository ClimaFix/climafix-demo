import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DataEntry from './components/DataEntry';
import Report from './components/Report';

function App() {
  const token = localStorage.getItem('token');
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/data-entry" element={token ? <DataEntry /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
	<Route path="/report" element={token ? <Report /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
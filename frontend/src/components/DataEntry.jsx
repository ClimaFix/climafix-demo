import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function DataEntry() {
  const [month, setMonth] = useState('');
  const [electricity, setElectricity] = useState('');
  const [diesel, setDiesel] = useState('');
  const [water, setWater] = useState('');
  const [production, setProduction] = useState('');
  const [dataList, setDataList] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('https://climafix-api.onrender.com/api/data/monthly', { params: { token } });
      setDataList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post('https://climafix-api.onrender.com/api/data/monthly', {
        month,
        electricity_kwh: parseFloat(electricity),
        diesel_liters: parseFloat(diesel),
        water_liters: parseFloat(water),
        production_kg: parseFloat(production)
      }, { params: { token } });
      setMessage('Data saved successfully!');
      setMonth('');
      setElectricity('');
      setDiesel('');
      setWater('');
      setProduction('');
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error saving data');
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#1B5E20' }}>Data Entry</h1>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', background: '#0D9488', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Back to Dashboard</button>
      </div>
      
      {message && <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>{message}</div>}
      
      <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', marginBottom: '30px' }}>
        <h3>Add Monthly Data</h3>
        <div style={{ marginBottom: '15px' }}>
          <label>Month (YYYY-MM)</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc' }} required />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Electricity (kWh)</label>
          <input type="number" value={electricity} onChange={(e) => setElectricity(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc' }} required />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Diesel (liters)</label>
          <input type="number" value={diesel} onChange={(e) => setDiesel(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc' }} required />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Water (liters)</label>
          <input type="number" value={water} onChange={(e) => setWater(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc' }} required />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Production (kg)</label>
          <input type="number" value={production} onChange={(e) => setProduction(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc' }} required />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', background: '#1B5E20', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save Data</button>
      </form>
      
      <h3>Existing Data</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '16px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#e8f5e9' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Month</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Energy Intensity</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Water Intensity</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Carbon</th>
          </tr>
        </thead>
        <tbody>
          {dataList.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px' }}>{item.month}</td>
              <td style={{ padding: '10px' }}>{item.energy_intensity?.toFixed(2)} kWh/kg</td>
              <td style={{ padding: '10px' }}>{item.water_intensity?.toFixed(2)} L/kg</td>
              <td style={{ padding: '10px' }}>{item.carbon_footprint?.toFixed(2)} tCO₂e</td>
            </tr>
          ))}
          {dataList.length === 0 && (
            <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>No data yet. Add your first entry!</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataEntry;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Dashboard() {
  const [kpis, setKpis] = useState({ energy_intensity: 0, water_intensity: 0, carbon_footprint: 0 });
  const [trend, setTrend] = useState({ months: [], energy_intensity: [], water_intensity: [], carbon_footprint: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [kpisRes, trendRes] = await Promise.all([
          axios.get('https://climafix-api.onrender.com/api/dashboard/kpis', { params: { token } }),
          axios.get('https://climafix-api.onrender.com/api/dashboard/trend', { params: { token } })
        ]);
        setKpis(kpisRes.data);
        setTrend(trendRes.data);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const chartData = {
    labels: trend.months,
    datasets: [
      {
        label: 'Energy Intensity (kWh/kg)',
        data: trend.energy_intensity,
        borderColor: '#1B5E20',
        backgroundColor: 'rgba(27,94,32,0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#1B5E20' }}>CLIMAFIX Dashboard</h1>
        <div>
          <button onClick={() => navigate('/data-entry')} style={{ marginRight: '10px', padding: '8px 16px', background: '#0D9488', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Data Entry</button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Logout</button>
<button onClick={() => navigate('/report')} style={{ marginRight: '10px', padding: '8px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Generate Report</button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#5f6b7a' }}>Energy Intensity</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#1B5E20' }}>{kpis.energy_intensity} <span style={{ fontSize: '0.8rem' }}>kWh/kg</span></div>
        </div>
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#5f6b7a' }}>Water Intensity</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0D9488' }}>{kpis.water_intensity} <span style={{ fontSize: '0.8rem' }}>L/kg</span></div>
        </div>
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#5f6b7a' }}>Carbon Footprint</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b' }}>{kpis.carbon_footprint} <span style={{ fontSize: '0.8rem' }}>tCO₂e</span></div>
        </div>
      </div>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3>Energy Intensity Trend</h3>
        <Line data={chartData} options={{ responsive: true }} />
      </div>
    </div>
  );
}

export default Dashboard;
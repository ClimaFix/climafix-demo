import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function DashboardNew() {
  const [kpis, setKpis] = useState({
    energy_intensity: 4.12,
    water_intensity: 48,
    carbon_footprint: 1.05,
    savings: 1.42,
    compliance: 92
  });
  const [sensors, setSensors] = useState({
    energy: { online: 12, total: 12 },
    water: { online: 5, total: 6 },
    vibration: { online: 5, total: 6 },
    gateway: true
  });
  const [offlineSensors, setOfflineSensors] = useState([
    { name: "ETP Inlet Flow Meter", location: "ETP Plant", lastSeen: "2026-05-25 08:23 AM" },
    { name: "Compressor #3 Vibration", location: "Compressor Room", lastSeen: "2026-05-25 09:15 AM" }
  ]);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const navigate = useNavigate();
  const API_URL = 'https://climafix-api.onrender.com';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [kpisRes, trendRes] = await Promise.all([
        axios.get(`${API_URL}/api/dashboard/kpis`, { params: { token } }),
        axios.get(`${API_URL}/api/dashboard/trend`, { params: { token } })
      ]);
      
      setKpis({
        energy_intensity: kpisRes.data.energy_intensity || 4.12,
        water_intensity: kpisRes.data.water_intensity || 48,
        carbon_footprint: kpisRes.data.carbon_footprint || 1.05,
        savings: 1.42,
        compliance: 92
      });
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendTestAlert = async () => {
    setShowAlert(true);
    // In production, call your backend to send SMS/email
    setTimeout(() => setShowAlert(false), 5000);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f0f9f0 0%, #e6f0fa 100%)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #1B5E20, #0D9488)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            <i className="fas fa-microchip"></i> CLIMAFIX DMRV | Live Intelligence Dashboard
          </h1>
          <p style={{ color: '#4a5568' }}>IoT → Satellite → AI/Blockchain → Verifiable Impact</p>
        </div>

        {/* Main Layout */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          
          {/* Left: Main Dashboard Cards */}
          <div style={{ flex: '3', minWidth: '280px' }}>
            
            {/* Row 1: Data Sources */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <div style={{ flex: 1, background: 'white', borderRadius: '28px', padding: '20px', boxShadow: '0 8px 28px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #e9ecef', paddingBottom: '12px' }}>
                  <i className="fas fa-microchip" style={{ color: '#2E7D32', fontSize: '28px' }}></i>
                  <h3 style={{ margin: 0 }}>📡 IoT & Sensors</h3>
                </div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-charging-station"></i> 47 sub-meters | {kpis.energy_intensity} kWh/kg</div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-tint"></i> ETP + MEE+RO (ZLD)</div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-industry"></i> Thies dyeing | Thermic boiler 87%</div>
                <span style={{ background: '#e8f5e9', color: '#1B5E20', padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '700' }}>Edge AI preprocessing</span>
              </div>

              <div style={{ flex: 1, background: 'white', borderRadius: '28px', padding: '20px', boxShadow: '0 8px 28px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #e9ecef', paddingBottom: '12px' }}>
                  <i className="fas fa-satellite-dish" style={{ color: '#0D9488', fontSize: '28px' }}></i>
                  <h3 style={{ margin: 0 }}>🛰️ Geospatial</h3>
                </div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-globe-asia"></i> Sentinel-2 L2A: 2.4 ha</div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-water"></i> Water stress index (Medium-Low)</div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-leaf"></i> NDVI 0.24, thermal validation</div>
                <span style={{ background: '#e8f5e9', color: '#1B5E20', padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '700' }}>Weekly satellite refresh</span>
              </div>

              <div style={{ flex: 1, background: 'white', borderRadius: '28px', padding: '20px', boxShadow: '0 8px 28px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #e9ecef', paddingBottom: '12px' }}>
                  <i className="fas fa-flask" style={{ color: '#8B5CF6', fontSize: '28px' }}></i>
                  <h3 style={{ margin: 0 }}>📋 ZDHC & Ops</h3>
                </div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-database"></i> ZDHC Gateway: 114 chemicals</div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-chart-simple"></i> Higg FEM gap -22% (sensor fusion)</div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-recycle"></i> PCR 34% · GRS certified</div>
                <span style={{ background: '#e8f5e9', color: '#1B5E20', padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '700' }}>PFAS ND (&lt;5 ppb)</span>
              </div>
            </div>

            {/* Hardware Status Card - Live */}
            <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '28px', padding: '24px', marginBottom: '24px', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
                <i className="fas fa-microchip" style={{ color: '#4caf50', fontSize: '28px' }}></i>
                <h3 style={{ margin: 0 }}>🔧 Hardware Installation Status</h3>
                <span style={{ background: '#4caf50', color: 'white', padding: '4px 12px', borderRadius: '30px', fontSize: '12px', marginLeft: 'auto' }}>Live Monitoring</span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span><i className="fas fa-charging-station"></i> Overall System Health:</span>
                  <span>{Math.round((sensors.energy.online + sensors.water.online + sensors.vibration.online) / (sensors.energy.total + sensors.water.total + sensors.vibration.total) * 100)}% Online</span>
                </div>
                <div style={{ background: '#334155', borderRadius: '12px', height: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${(sensors.energy.online + sensors.water.online + sensors.vibration.online) / (sensors.energy.total + sensors.water.total + sensors.vibration.total) * 100}%`, background: '#4caf50', height: '100%', borderRadius: '12px' }}></div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ background: '#334155', borderRadius: '16px', padding: '12px' }}>
                    <i className="fas fa-bolt"></i> Energy Sub-meters: <strong>{sensors.energy.online}/{sensors.energy.total}</strong>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#4caf50', borderRadius: '10px', marginLeft: '8px', boxShadow: '0 0 0 2px rgba(76,175,80,0.3)' }}></span>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{kpis.energy_intensity} kWh/kg live</div>
                  </div>
                </div>
                <div>
                  <div style={{ background: '#334155', borderRadius: '16px', padding: '12px' }}>
                    <i className="fas fa-tint"></i> Water Flow Meters: <strong>{sensors.water.online}/{sensors.water.total}</strong>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#4caf50', borderRadius: '10px', marginLeft: '8px' }}></span>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>ETP inlet sensor pending</div>
                  </div>
                </div>
                <div>
                  <div style={{ background: '#334155', borderRadius: '16px', padding: '12px' }}>
                    <i className="fas fa-industry"></i> Machine Vibration: <strong>{sensors.vibration.online}/{sensors.vibration.total}</strong>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#ef4444', borderRadius: '10px', marginLeft: '8px' }}></span>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Compressor #3 offline</div>
                  </div>
                </div>
                <div>
                  <div style={{ background: '#334155', borderRadius: '16px', padding: '12px' }}>
                    <i className="fas fa-wifi"></i> Gateway Connectivity: <strong>4G Active</strong>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#4caf50', borderRadius: '10px', marginLeft: '8px' }}></span>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Backup SIM ready</div>
                  </div>
                </div>
              </div>

              {/* Offline Sensors Alert */}
              {offlineSensors.length > 0 && (
                <div style={{ background: '#7f1a1a', borderRadius: '16px', padding: '16px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <i className="fas fa-exclamation-triangle"></i>
                    <strong>⚠️ Offline Sensors ({offlineSensors.length})</strong>
                  </div>
                  {offlineSensors.map((sensor, idx) => (
                    <div key={idx} style={{ marginLeft: '24px', marginBottom: '8px', fontSize: '13px' }}>
                      • {sensor.name} ({sensor.location}) — last seen: {sensor.lastSeen}
                    </div>
                  ))}
                  <div style={{ marginTop: '12px', fontSize: '12px' }}>🔧 Action: Remote diagnostic initiated. Technician notified.</div>
                </div>
              )}

              {/* Test Alert Button */}
              <button onClick={sendTestAlert} style={{ width: '100%', marginTop: '16px', background: '#f59e0b', border: 'none', color: '#1e293b', padding: '12px', borderRadius: '40px', fontWeight: '700', cursor: 'pointer' }}>
                <i className="fas fa-bell"></i> 🔔 Test Alert: Simulate Offline Sensor
              </button>

              {showAlert && (
                <div style={{ marginTop: '16px', background: '#f59e0b', color: '#1e293b', padding: '12px', borderRadius: '12px', textAlign: 'center', fontWeight: '600' }}>
                  🔔 DEMO: Alert would be sent via SMS/Email to plant manager
                </div>
              )}

              <div style={{ fontSize: '12px', textAlign: 'center', marginTop: '16px', color: '#94a3b8' }}>
                <i className="fas fa-sync-alt"></i> Last data sync: 2 minutes ago · Blockchain anchor: Ethereum Sepolia
              </div>
            </div>

            {/* Row 2: AI + Blockchain */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <div style={{ flex: 1, background: 'white', borderRadius: '28px', padding: '20px', boxShadow: '0 8px 28px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #e9ecef', paddingBottom: '12px' }}>
                  <i className="fas fa-brain" style={{ color: '#A855F7', fontSize: '28px' }}></i>
                  <h3 style={{ margin: 0 }}>🧠 AI Core</h3>
                </div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-chart-line"></i> LSTM energy forecast (48h)</div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-wrench"></i> Predictive maintenance</div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-robot"></i> Anomaly detection: steam flow</div>
                <span style={{ background: '#e8f5e9', color: '#1B5E20', padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '700' }}>Dyeing recipe AI: -11% energy</span>
              </div>

              <div style={{ flex: 1, background: 'white', borderRadius: '28px', padding: '20px', boxShadow: '0 8px 28px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #e9ecef', paddingBottom: '12px' }}>
                  <i className="fas fa-link" style={{ color: '#E67E22', fontSize: '28px' }}></i>
                  <h3 style={{ margin: 0 }}>⛓️ Blockchain</h3>
                </div>
                <div style={{ marginBottom: '12px' }}><i className="fab fa-ethereum"></i> Ethereum Sepolia anchor</div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-shield-alt"></i> Zero-knowledge proofs + ISO 27001</div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-file-signature"></i> Smart contract maintenance</div>
                <span style={{ background: '#e8f5e9', color: '#1B5E20', padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '700' }}>Immutable ESG proof</span>
              </div>

              <div style={{ flex: 1, background: 'white', borderRadius: '28px', padding: '20px', boxShadow: '0 8px 28px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #e9ecef', paddingBottom: '12px' }}>
                  <i className="fas fa-gavel" style={{ color: '#2c5282', fontSize: '28px' }}></i>
                  <h3 style={{ margin: 0 }}>📏 Standards (EU+India)</h3>
                </div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-flag-checkered"></i> EU: CBAM, ESPR-DPP, PFAS, ZDHC L3</div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-chart-line"></i> India: CCTS, BEE PAT, CPCB ZLD, SBTi</div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-passport"></i> DPP + PEF methodology ready</div>
                <span style={{ background: '#e8f5e9', color: '#1B5E20', padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '700' }}>Higg FEM auto-populated</span>
              </div>
            </div>

            {/* Row 3: Impact */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, background: 'white', borderRadius: '28px', padding: '20px', boxShadow: '0 8px 28px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #e9ecef', paddingBottom: '12px' }}>
                  <i className="fas fa-chart-pie" style={{ color: '#16A34A', fontSize: '28px' }}></i>
                  <h3 style={{ margin: 0 }}>📊 Real-time MRV</h3>
                </div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-bolt"></i> Energy mix: 62% grid / 28% biomass / 10% solar</div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-droplet"></i> Water: {kpis.water_intensity} L/kg · 84% recycled (ZLD)</div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-cloud-upload-alt"></i> Carbon: 3,842 tCO₂e YTD</div>
                <span style={{ background: '#e8f5e9', color: '#1B5E20', padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '700' }}>Audit fatigue -67%</span>
              </div>

              <div style={{ flex: 1, background: '#fffaf0', borderRadius: '28px', padding: '20px', boxShadow: '0 8px 28px rgba(0,0,0,0.08)', borderLeft: '4px solid #f39c12' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #e9ecef', paddingBottom: '12px' }}>
                  <i className="fas fa-chart-simple" style={{ color: '#E67E22', fontSize: '28px' }}></i>
                  <h3 style={{ margin: 0 }}>💰 Client Impact</h3>
                </div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-rupee-sign"></i> Annual savings: ₹{kpis.savings} Cr</div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-tag"></i> Green premium: +12.5% on EU orders</div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-clock"></i> 1,200 man-hours saved</div>
                <div style={{ marginBottom: '12px' }}><i className="fas fa-recycle"></i> 89% waste diversion</div>
                <span style={{ background: '#e8f5e9', color: '#1B5E20', padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '700' }}>ROI &lt; 6 months</span>
              </div>
            </div>
          </div>

          {/* Right: Legend Panel */}
          <div style={{ flex: '1', minWidth: '240px', background: 'rgba(255,255,245,0.95)', borderRadius: '32px', padding: '20px', boxShadow: '0 8px 28px rgba(0,0,0,0.08)', height: 'fit-content', position: 'sticky', top: '20px' }}>
            <h3 style={{ marginBottom: '16px', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px' }}>
              <i className="fas fa-info-circle"></i> Clickable Lexicon
            </h3>
            {[
              { term: "ZLD", desc: "Zero Liquid Discharge – all wastewater recycled." },
              { term: "ZDHC MRSL", desc: "Manufacturing Restricted Substances List – chemical phase-out." },
              { term: "Higg FEM", desc: "Facility Environmental Module – self-assessed metric." },
              { term: "PFAS", desc: "Forever chemicals – banned in EU textiles." },
              { term: "DPP", desc: "Digital Product Passport – EU ESPR requirement." },
              { term: "CBAM", desc: "Carbon Border Adjustment Mechanism – EU carbon tax." },
              { term: "CCTS", desc: "Carbon Credit Trading Scheme (India)." },
              { term: "SBTi", desc: "Science Based Targets initiative – 1.5°C pathway." },
              { term: "NDVI", desc: "Normalized Difference Vegetation Index – satellite green cover." },
              { term: "LSTM", desc: "Long Short-Term Memory – AI time-series prediction." },
              { term: "Sentinel-2", desc: "ESA satellite – 10m resolution, thermal monitoring." }
            ].map((item, idx) => (
              <div key={idx} style={{ marginBottom: '12px', borderLeft: '3px solid #2E7D32', paddingLeft: '10px', cursor: 'pointer' }} onClick={() => alert(`🔍 ${item.term}: ${item.desc}`)}>
                <div style={{ fontWeight: '700', color: '#1B5E20' }}>{item.term}</div>
                <div style={{ fontSize: '11px', color: '#2c3e2f', marginTop: '2px' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '40px', padding: '20px', borderTop: '1px solid #cce5cc', fontSize: '12px', color: '#2c5e2a' }}>
          <i className="fas fa-charging-station"></i> CLIMAFIX DMRV – live digital twin (dyeing, boiler, ETP, compressed air)
          <br />
          <i className="fas fa-shield-alt"></i> Data privacy vault (zero-knowledge) · Blockchain anchored on Sepolia · AI-driven verification
        </div>
      </div>
    </div>
  );
}

export default DashboardNew;
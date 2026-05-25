import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      let response;
      const API_URL = 'https://climafix-api.onrender.com';
      
      if (isLogin) {
        response = await axios.post(`${API_URL}/api/auth/login`, { 
          email, 
          password 
        });
      } else {
        response = await axios.post(`${API_URL}/api/auth/register`, { 
          name, 
          email, 
          password 
        });
      }
      
      if (response.data && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('tenant_id', response.data.tenant_id);
        navigate('/dashboard');
      } else {
        setError('No token received from server');
      }
    } catch (err) {
      console.error('API Error:', err);
      if (err.response) {
        setError(err.response.data?.detail || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setError('Cannot reach server. Make sure backend is running on port 8001');
      } else {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', color: '#1B5E20' }}>CLIMAFIX</h2>
      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>{isLogin ? 'Login' : 'Register'}</h3>
      
      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <input
            type="text"
            placeholder="Company Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '10px', background: '#1B5E20', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '15px', cursor: 'pointer', color: '#0D9488' }} onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
      </p>
    </div>
  );
}

export default Login;
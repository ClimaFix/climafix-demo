import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function DataEntry() {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const API_URL = 'https://climafix-api.onrender.com';

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const res = await axios.get(`${API_URL}/api/data/monthly`, { params: { token } });
      setDataList(res.data);
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

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Your submit logic here
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Data Entry</h1>
      {/* Your form JSX here */}
    </div>
  );
}

export default DataEntry;
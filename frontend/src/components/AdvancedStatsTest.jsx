import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118';

const AdvancedStatsTest = () => {
  const [status, setStatus] = useState('loading');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('AdvancedStatsTest mounted, API_URL:', API_URL);

    fetch(`${API_URL}/api/statistics/comparison-with-ci`)
      .then(res => {
        console.log('Fetch response:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Data received:', data);
        setData(data);
        setStatus('success');
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError(err.message);
        setStatus('error');
      });
  }, []);

  console.log('Render - status:', status, 'data:', data ? 'present' : 'null', 'error:', error);

  if (status === 'loading') {
    return (
      <div style={{ padding: '40px', fontSize: '20px' }}>
        <h2>Caricamento dati...</h2>
        <p>API URL: {API_URL}</p>
        <p>Endpoint: /api/statistics/comparison-with-ci</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ padding: '40px', color: 'red' }}>
        <h2>Errore</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ color: '#1e40af' }}>Test Statistiche Avanzate</h1>
      <p>Stato: {status}</p>
      <p>Dati ricevuti: {data ? 'Sì' : 'No'}</p>
      {data && (
        <div>
          <h2>Comparisons: {data.comparisons?.length || 0}</h2>
          <pre style={{ backgroundColor: '#f3f4f6', padding: '20px', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AdvancedStatsTest;

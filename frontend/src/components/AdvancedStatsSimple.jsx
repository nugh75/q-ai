import { useState, useEffect } from 'react';
import axios from 'axios';
import ErrorBarChart from './ErrorBarChart';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118';

const AdvancedStatsSimple = () => {
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching from:', `${API_URL}/api/statistics/comparison-with-ci`);
        const response = await axios.get(`${API_URL}/api/statistics/comparison-with-ci`);
        console.log('Data received:', response.data);
        setComparisonData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Caricamento...</h2>
        <p>API: {API_URL}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', color: 'red' }}>
        <h2>Errore</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Riprova</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ color: '#1e40af', textAlign: 'center', marginBottom: '30px' }}>
        📊 Statistiche Avanzate - Grafici con Intervalli di Confidenza
      </h1>

      {comparisonData && comparisonData.comparisons && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <ErrorBarChart
            data={comparisonData.comparisons}
            title="Confronto Studenti vs Insegnanti con Intervalli di Confidenza 95%"
          />

          <div style={{
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            borderLeft: '4px solid #0ea5e9'
          }}>
            <h3 style={{ color: '#0c4a6e', marginBottom: '15px' }}>
              💡 Interpretazione Statistica
            </h3>
            <p style={{ color: '#475569', lineHeight: '1.6' }}>
              Le <strong>barre di errore</strong> (linee verticali sopra le barre) rappresentano
              gli <strong>intervalli di confidenza al 95%</strong>, calcolati usando la distribuzione
              t di Student. Se le barre di errore di due gruppi <strong>non si sovrappongono</strong>,
              possiamo concludere con alta probabilità che esiste una differenza significativa tra i gruppi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedStatsSimple;

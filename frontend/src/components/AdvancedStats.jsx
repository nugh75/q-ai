import { useState, useEffect } from 'react';
import axios from 'axios';
import ErrorBarChart from './ErrorBarChart';
import CorrelationHeatmap from './CorrelationHeatmap';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118';

/**
 * Componente per visualizzazioni statistiche avanzate
 * Include grafici con error bars e heatmap correlazioni
 */
const AdvancedStats = () => {
  const [comparisonData, setComparisonData] = useState(null);
  const [correlationDataStudent, setCorrelationDataStudent] = useState(null);
  const [correlationDataTeacher, setCorrelationDataTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('comparison');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [compRes, corrStudentRes, corrTeacherRes] = await Promise.all([
        axios.get(`${API_URL}/api/statistics/comparison-with-ci`),
        axios.get(`${API_URL}/api/statistics/correlation-matrix/student?method=pearson`),
        axios.get(`${API_URL}/api/statistics/correlation-matrix/teacher?method=pearson`)
      ]);

      setComparisonData(compRes.data);
      setCorrelationDataStudent(corrStudentRes.data);
      setCorrelationDataTeacher(corrTeacherRes.data);
    } catch (err) {
      console.error('Errore nel caricamento dati avanzati:', err);
      setError('Errore nel caricamento dei dati. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        fontSize: '1.2em',
        color: '#64748b'
      }}>
        Caricamento statistiche avanzate...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#dc2626',
        backgroundColor: '#fee2e2',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <p style={{ fontSize: '1.1em', fontWeight: 'bold', marginBottom: '10px' }}>
          ⚠️ Errore
        </p>
        <p>{error}</p>
        <button
          onClick={fetchData}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1em'
          }}
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#1e40af', marginBottom: '10px' }}>
          📊 Statistiche Avanzate - Publication Ready
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1em' }}>
          Visualizzazioni scientifiche con intervalli di confidenza e analisi correlazioni
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '10px'
      }}>
        <button
          onClick={() => setSelectedTab('comparison')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: selectedTab === 'comparison' ? '#3b82f6' : 'transparent',
            color: selectedTab === 'comparison' ? 'white' : '#64748b',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: selectedTab === 'comparison' ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}
        >
          📊 Confronto con Error Bars
        </button>
        <button
          onClick={() => setSelectedTab('correlation-student')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: selectedTab === 'correlation-student' ? '#3b82f6' : 'transparent',
            color: selectedTab === 'correlation-student' ? 'white' : '#64748b',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: selectedTab === 'correlation-student' ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}
        >
          🔗 Correlazioni Studenti
        </button>
        <button
          onClick={() => setSelectedTab('correlation-teacher')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: selectedTab === 'correlation-teacher' ? '#3b82f6' : 'transparent',
            color: selectedTab === 'correlation-teacher' ? 'white' : '#64748b',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: selectedTab === 'correlation-teacher' ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}
        >
          🔗 Correlazioni Insegnanti
        </button>
      </div>

      {/* Content */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {selectedTab === 'comparison' && comparisonData && (
          <div>
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
              <p style={{ color: '#475569', lineHeight: '1.6', marginTop: '10px' }}>
                Un IC al 95% significa: "Se ripetessimo questo studio 100 volte, in 95 casi il valore
                vero della media cadrebbe all'interno di questo intervallo".
              </p>
            </div>
          </div>
        )}

        {selectedTab === 'correlation-student' && correlationDataStudent && (
          <div>
            <CorrelationHeatmap
              correlationData={correlationDataStudent}
              title="Matrice di Correlazione - Studenti (Pearson)"
            />

            <div style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: '#ecfdf5',
              borderRadius: '8px',
              borderLeft: '4px solid #10b981'
            }}>
              <h3 style={{ color: '#065f46', marginBottom: '15px' }}>
                📈 Insights Chiave - Studenti
              </h3>
              {correlationDataStudent.significant_correlations.length > 0 && (
                <ul style={{ color: '#475569', lineHeight: '1.8', paddingLeft: '20px' }}>
                  {correlationDataStudent.significant_correlations.slice(0, 3).map((corr, idx) => (
                    <li key={idx} style={{ marginBottom: '8px' }}>
                      <strong style={{ color: corr.direction === 'positive' ? '#0ea5e9' : '#ef4444' }}>
                        {corr.var1} ↔ {corr.var2}
                      </strong>: correlazione {corr.strength} (r={corr.correlation.toFixed(3)}, p{corr.p_value < 0.001 ? '<0.001' : `=${corr.p_value.toFixed(3)}`})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'correlation-teacher' && correlationDataTeacher && (
          <div>
            <CorrelationHeatmap
              correlationData={correlationDataTeacher}
              title="Matrice di Correlazione - Insegnanti (Pearson)"
            />

            <div style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: '#fefce8',
              borderRadius: '8px',
              borderLeft: '4px solid #eab308'
            }}>
              <h3 style={{ color: '#713f12', marginBottom: '15px' }}>
                📈 Insights Chiave - Insegnanti
              </h3>
              <p style={{ color: '#475569', marginBottom: '15px' }}>
                <strong>Variabili binarie incluse:</strong>
              </p>
              <ul style={{ color: '#475569', lineHeight: '1.6', paddingLeft: '20px', marginBottom: '15px' }}>
                <li><strong>currently_teaching_binary</strong>: 1 = Insegna attualmente, 0 = Non insegna</li>
                <li><strong>subject_type_stem</strong>: 1 = STEM, 0 = Umanistica</li>
              </ul>
              {correlationDataTeacher.significant_correlations.length > 0 && (
                <ul style={{ color: '#475569', lineHeight: '1.8', paddingLeft: '20px' }}>
                  {correlationDataTeacher.significant_correlations.slice(0, 5).map((corr, idx) => (
                    <li key={idx} style={{ marginBottom: '8px' }}>
                      <strong style={{ color: corr.direction === 'positive' ? '#0ea5e9' : '#ef4444' }}>
                        {corr.var1} ↔ {corr.var2}
                      </strong>: correlazione {corr.strength} (r={corr.correlation.toFixed(3)}, p{corr.p_value < 0.001 ? '<0.001' : `=${corr.p_value.toFixed(3)}`})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer con info metodo */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        fontSize: '0.9em',
        color: '#64748b',
        textAlign: 'center'
      }}>
        <p>
          <strong>Metodologia:</strong> Correlazioni di Pearson | Intervalli di Confidenza al 95% (t di Student) |
          Significatività: * p&lt;0.05, ** p&lt;0.01, *** p&lt;0.001
        </p>
        <p style={{ marginTop: '10px' }}>
          Grafici ottimizzati per pubblicazioni scientifiche | Esportabili in formato SVG
        </p>
      </div>
    </div>
  );
};

export default AdvancedStats;

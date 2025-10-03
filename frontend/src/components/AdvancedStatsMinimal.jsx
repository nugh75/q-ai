import { useState, useEffect } from 'react';
import axios from 'axios';
import ErrorBarChart from './ErrorBarChart';
import CorrelationHeatmap from './CorrelationHeatmap';
import CorrelationHeatmapGrouped from './CorrelationHeatmapGrouped';
import CorrelationComparison from './CorrelationComparison';
import TeacherCategorySwitch from './TeacherCategorySwitch';
import { Icons } from './Icons';
import { TEACHER_FILTER_PARAMS } from '../constants/colors';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118';

const AdvancedStatsMinimal = () => {
  const [comparisonData, setComparisonData] = useState(null);
  const [correlationDataStudent, setCorrelationDataStudent] = useState(null);
  const [correlationDataTeacher, setCorrelationDataTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('comparison');
  const [teacherCategory, setTeacherCategory] = useState('teachers_active');
  const [viewMode, setViewMode] = useState('full'); // 'full' o 'grouped'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = TEACHER_FILTER_PARAMS[teacherCategory];

        const [compRes, corrStudentRes, corrTeacherRes] = await Promise.all([
          axios.get(`${API_URL}/api/statistics/comparison-with-ci`, { params }),
          axios.get(`${API_URL}/api/statistics/correlation-matrix/student?method=pearson`),
          axios.get(`${API_URL}/api/statistics/correlation-matrix/teacher`, { params: { ...params, method: 'pearson' } })
        ]);

        setComparisonData(compRes.data);
        setCorrelationDataStudent(corrStudentRes.data);
        setCorrelationDataTeacher(corrTeacherRes.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [teacherCategory]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Caricamento dati...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', color: 'red' }}>
        <h2>Errore nel caricamento</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ color: '#1e40af', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Icons.Chart className="w-8 h-8" />
          Statistiche Avanzate - Publication Ready
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1em' }}>
          Visualizzazioni scientifiche con intervalli di confidenza e analisi correlazioni
        </p>
      </div>

      {/* Switch Categoria Insegnanti */}
      <TeacherCategorySwitch
        selectedCategory={teacherCategory}
        onCategoryChange={setTeacherCategory}
      />

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
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Icons.Comparison className="w-5 h-5" />
          Confronto con Error Bars
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
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Icons.Student className="w-5 h-5" />
          Correlazioni Studenti
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
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Icons.Teacher className="w-5 h-5" />
          Correlazioni Insegnanti
        </button>
        <button
          onClick={() => setSelectedTab('comparison-multi')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: selectedTab === 'comparison-multi' ? '#3b82f6' : 'transparent',
            color: selectedTab === 'comparison-multi' ? 'white' : '#64748b',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: selectedTab === 'comparison-multi' ? 'bold' : 'normal',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Confronto Variabili
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
              teacherCategory={teacherCategory}
            />

            <div style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              borderLeft: '4px solid #0ea5e9'
            }}>
              <h3 style={{ color: '#0c4a6e', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" style={{ width: '24px', height: '24px' }}>
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
                Interpretazione Statistica
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

        {selectedTab === 'correlation-student' && correlationDataStudent && (
          <div>
            {/* Toggle visualizzazione */}
            <div style={{
              marginBottom: '20px',
              display: 'flex',
              gap: '10px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setViewMode('full')}
                style={{
                  padding: '10px 20px',
                  border: `2px solid ${viewMode === 'full' ? '#3b82f6' : '#cbd5e1'}`,
                  backgroundColor: viewMode === 'full' ? '#3b82f6' : 'white',
                  color: viewMode === 'full' ? 'white' : '#64748b',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: viewMode === 'full' ? '600' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                Matrice Completa
              </button>
              <button
                onClick={() => setViewMode('grouped')}
                style={{
                  padding: '10px 20px',
                  border: `2px solid ${viewMode === 'grouped' ? '#3b82f6' : '#cbd5e1'}`,
                  backgroundColor: viewMode === 'grouped' ? '#3b82f6' : 'white',
                  color: viewMode === 'grouped' ? 'white' : '#64748b',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: viewMode === 'grouped' ? '600' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                Per Gruppi
              </button>
            </div>

            {viewMode === 'full' ? (
              <CorrelationHeatmap
                correlationData={correlationDataStudent}
                title="Matrice di Correlazione - Studenti (Pearson)"
              />
            ) : (
              <CorrelationHeatmapGrouped
                correlationData={correlationDataStudent}
                title="Matrice di Correlazione Raggruppata - Studenti (Pearson)"
              />
            )}

            <div style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: '#ecfdf5',
              borderRadius: '8px',
              borderLeft: '4px solid #10b981'
            }}>
              <h3 style={{ color: '#065f46', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Insights Chiave - Studenti
              </h3>
              <p style={{ color: '#475569', marginBottom: '10px' }}>
                Trovate <strong>{correlationDataStudent.significant_correlations?.length || 0} correlazioni significative</strong> su {correlationDataStudent.interpretation?.total_comparisons || 0} possibili.
              </p>
            </div>
          </div>
        )}

        {selectedTab === 'correlation-teacher' && correlationDataTeacher && (
          <div>
            {/* Toggle visualizzazione */}
            <div style={{
              marginBottom: '20px',
              display: 'flex',
              gap: '10px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setViewMode('full')}
                style={{
                  padding: '10px 20px',
                  border: `2px solid ${viewMode === 'full' ? '#3b82f6' : '#cbd5e1'}`,
                  backgroundColor: viewMode === 'full' ? '#3b82f6' : 'white',
                  color: viewMode === 'full' ? 'white' : '#64748b',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: viewMode === 'full' ? '600' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                Matrice Completa
              </button>
              <button
                onClick={() => setViewMode('grouped')}
                style={{
                  padding: '10px 20px',
                  border: `2px solid ${viewMode === 'grouped' ? '#3b82f6' : '#cbd5e1'}`,
                  backgroundColor: viewMode === 'grouped' ? '#3b82f6' : 'white',
                  color: viewMode === 'grouped' ? 'white' : '#64748b',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: viewMode === 'grouped' ? '600' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                Per Gruppi
              </button>
            </div>

            {viewMode === 'full' ? (
              <CorrelationHeatmap
                correlationData={correlationDataTeacher}
                title="Matrice di Correlazione - Insegnanti (Pearson)"
              />
            ) : (
              <CorrelationHeatmapGrouped
                correlationData={correlationDataTeacher}
                title="Matrice di Correlazione Raggruppata - Insegnanti (Pearson)"
              />
            )}

            <div style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: '#fefce8',
              borderRadius: '8px',
              borderLeft: '4px solid #eab308'
            }}>
              <h3 style={{ color: '#713f12', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Insights Chiave - Insegnanti
              </h3>
              <p style={{ color: '#475569', marginBottom: '10px' }}>
                Trovate <strong>{correlationDataTeacher.significant_correlations?.length || 0} correlazioni significative</strong> su {correlationDataTeacher.interpretation?.total_comparisons || 0} possibili.
              </p>
            </div>
          </div>
        )}

        {selectedTab === 'comparison-multi' && (
          <div>
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              borderLeft: '4px solid #3b82f6'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>
                Seleziona tipo di rispondente:
              </h4>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => setSelectedTab('comparison-multi-student')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Icons.Student className="w-4 h-4" />
                  Studenti
                </button>
                <button
                  onClick={() => setSelectedTab('comparison-multi-teacher')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    backgroundColor: '#10b981',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Icons.Teacher className="w-4 h-4" />
                  Insegnanti
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'comparison-multi-student' && correlationDataStudent && (
          <CorrelationComparison
            correlationData={correlationDataStudent}
            title="Confronto Variabili - Studenti"
          />
        )}

        {selectedTab === 'comparison-multi-teacher' && correlationDataTeacher && (
          <CorrelationComparison
            correlationData={correlationDataTeacher}
            title="Confronto Variabili - Insegnanti"
          />
        )}
      </div>

      {/* Footer */}
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
          Grafici ottimizzati per pubblicazioni scientifiche
        </p>
      </div>
    </div>
  );
};

export default AdvancedStatsMinimal;

import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

/**
 * Componente per confrontare 2 o più dimensioni con scatter plot
 */
const CorrelationComparison = ({ correlationData, title }) => {
  const [selectedVarX, setSelectedVarX] = useState('');
  const [selectedVarsY, setSelectedVarsY] = useState([]);

  if (!correlationData || !correlationData.correlation_matrix) {
    return <div className="no-data">Nessun dato disponibile</div>;
  }

  const { variables, correlation_matrix, p_value_matrix, raw_data } = correlationData;

  // Mappa etichette
  const labelMap = {
    'practical_competence': 'Competenza Pratica',
    'theoretical_competence': 'Competenza Teorica',
    'ai_change_study': 'AI Cambia Studio',
    'ai_change_teaching': 'AI Cambia Insegnamento',
    'training_adequacy': 'Formazione Adeguata',
    'trust_integration': 'Fiducia Integrazione',
    'concern_ai_school': 'Preoccupazione Scuola',
    'concern_ai_peers': 'Preoccupazione Pari',
    'concern_ai_education': 'Preoccupazione Educazione',
    'concern_ai_students': 'Preoccupazione Studenti',
    'age': 'Età',
    'hours_daily': 'Ore/Giorno',
    'hours_study': 'Ore Studio',
    'hours_training': 'Ore Formazione',
    'hours_lesson_planning': 'Ore Pianificazione',
    'gender_code': 'Genere (cod)',
    'uses_ai_daily_code': 'Uso Quotidiano (cod)',
    'uses_ai_study_code': 'Uso Studio (cod)',
    'school_type_code': 'Tipo Scuola (cod)',
    'school_level_code': 'Livello Scuola (cod)',
    'currently_teaching_code': 'Insegna Ora (cod)'
  };

  const getLabel = (v) => labelMap[v] || v;

  // Toggle selezione Y
  const toggleVarY = (varName) => {
    if (selectedVarsY.includes(varName)) {
      setSelectedVarsY(selectedVarsY.filter(v => v !== varName));
    } else {
      if (selectedVarsY.length < 5) { // Max 5 variabili Y
        setSelectedVarsY([...selectedVarsY, varName]);
      }
    }
  };

  // Trova correlazione tra due variabili
  const getCorrelation = (var1, var2) => {
    const idx1 = variables.indexOf(var1);
    const idx2 = variables.indexOf(var2);
    if (idx1 === -1 || idx2 === -1) return null;

    const r = correlation_matrix[idx1][idx2];
    const p = p_value_matrix[idx1][idx2];

    return { r, p };
  };

  // Colori per le diverse variabili Y
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Funzione download CSV
  const downloadCSV = () => {
    if (!selectedVarX || selectedVarsY.length === 0 || !raw_data) return;

    // Prepara header
    const headers = [selectedVarX, ...selectedVarsY];
    let csvContent = headers.map(h => getLabel(h)).join(',') + '\n';

    // Prepara righe
    const xData = raw_data[selectedVarX] || [];
    const maxLength = xData.length;

    for (let i = 0; i < maxLength; i++) {
      const row = [xData[i]];
      selectedVarsY.forEach(varY => {
        const yData = raw_data[varY] || [];
        row.push(yData[i] ?? '');
      });
      csvContent += row.join(',') + '\n';
    }

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `correlazione_${selectedVarX}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ width: '100%', padding: '20px' }}>
      {title && (
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#1e40af' }}>
          {title}
        </h3>
      )}

      {/* Selezione Variabili */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Variabile X (Asse orizzontale) */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '2px solid #e2e8f0'
        }}>
          <h4 style={{ color: '#1e40af', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Variabile X (Asse Orizzontale)
          </h4>
          <select
            value={selectedVarX}
            onChange={(e) => setSelectedVarX(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '0.95em',
              borderRadius: '6px',
              border: '2px solid #cbd5e1',
              backgroundColor: 'white'
            }}
          >
            <option value="">-- Seleziona variabile X --</option>
            {variables.map(v => (
              <option key={v} value={v}>{getLabel(v)}</option>
            ))}
          </select>
        </div>

        {/* Variabili Y (Asse verticale - multiple) */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '2px solid #e2e8f0'
        }}>
          <h4 style={{ color: '#1e40af', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Variabili Y (Asse Verticale - max 5)
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {variables.filter(v => v !== selectedVarX).map((v, idx) => (
              <label
                key={v}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  backgroundColor: selectedVarsY.includes(v) ? colors[selectedVarsY.indexOf(v)] : 'white',
                  color: selectedVarsY.includes(v) ? 'white' : '#64748b',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85em',
                  fontWeight: selectedVarsY.includes(v) ? '600' : 'normal',
                  transition: 'all 0.2s',
                  border: selectedVarsY.includes(v) ? 'none' : '1px solid #e2e8f0'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedVarsY.includes(v)}
                  onChange={() => toggleVarY(v)}
                  disabled={!selectedVarsY.includes(v) && selectedVarsY.length >= 5}
                  style={{ cursor: 'pointer' }}
                />
                {getLabel(v)}
              </label>
            ))}
          </div>
          <p style={{ marginTop: '10px', fontSize: '0.8em', color: '#64748b' }}>
            Selezionate: {selectedVarsY.length}/5
          </p>
        </div>
      </div>

      {/* Mostra correlazioni */}
      {selectedVarX && selectedVarsY.length > 0 && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          borderLeft: '4px solid #3b82f6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, color: '#1e40af' }}>
              Correlazioni di {getLabel(selectedVarX)} con:
            </h4>
            {raw_data && (
              <button
                onClick={downloadCSV}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600'
                }}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download CSV
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedVarsY.map((varY, idx) => {
              const corr = getCorrelation(selectedVarX, varY);
              if (!corr) return null;

              const { r, p } = corr;
              const strength = Math.abs(r) >= 0.7 ? 'forte' :
                               Math.abs(r) >= 0.5 ? 'moderata' :
                               Math.abs(r) >= 0.3 ? 'debole' : 'molto debole';
              const direction = r > 0 ? 'positiva' : 'negativa';

              let stars = '';
              if (p < 0.001) stars = '***';
              else if (p < 0.01) stars = '**';
              else if (p < 0.05) stars = '*';

              return (
                <div
                  key={varY}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    borderLeft: `4px solid ${colors[idx]}`
                  }}
                >
                  <span style={{ fontWeight: '600', color: colors[idx] }}>
                    {getLabel(varY)}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.9em', color: '#64748b' }}>
                      r = {r.toFixed(3)} {stars}
                    </span>
                    <span style={{
                      fontSize: '0.85em',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: Math.abs(r) >= 0.5 ? '#dcfce7' : '#fef3c7',
                      color: Math.abs(r) >= 0.5 ? '#166534' : '#92400e'
                    }}>
                      {strength} {direction}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scatter Plot */}
      {selectedVarX && selectedVarsY.length > 0 && raw_data && (
        <div style={{ marginTop: '20px' }}>
          {selectedVarsY.map((varY, idx) => {
            // Prepara dati per scatter plot
            const scatterData = [];
            const xData = raw_data[selectedVarX] || [];
            const yData = raw_data[varY] || [];

            for (let i = 0; i < Math.min(xData.length, yData.length); i++) {
              if (xData[i] !== null && yData[i] !== null) {
                scatterData.push({
                  x: xData[i],
                  y: yData[i]
                });
              }
            }

            if (scatterData.length === 0) return null;

            const corr = getCorrelation(selectedVarX, varY);

            return (
              <div key={varY} style={{ marginBottom: '30px' }}>
                <h4 style={{
                  color: colors[idx],
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: colors[idx],
                    borderRadius: '50%'
                  }}></div>
                  {getLabel(selectedVarX)} vs {getLabel(varY)}
                  {corr && (
                    <span style={{
                      fontSize: '0.85em',
                      color: '#64748b',
                      fontWeight: 'normal'
                    }}>
                      (r = {corr.r.toFixed(3)}, p {corr.p < 0.001 ? '<0.001' : `=${corr.p.toFixed(3)}`})
                    </span>
                  )}
                </h4>

                <ResponsiveContainer width="100%" height={350}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="x"
                      name={getLabel(selectedVarX)}
                      label={{
                        value: getLabel(selectedVarX),
                        position: 'insideBottom',
                        offset: -10,
                        style: { fontSize: '14px', fontWeight: 'bold' }
                      }}
                      stroke="#64748b"
                    />
                    <YAxis
                      dataKey="y"
                      name={getLabel(varY)}
                      label={{
                        value: getLabel(varY),
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: '14px', fontWeight: 'bold' }
                      }}
                      stroke="#64748b"
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload[0]) return null;
                        return (
                          <div style={{
                            backgroundColor: 'white',
                            padding: '10px',
                            border: `2px solid ${colors[idx]}`,
                            borderRadius: '6px',
                            fontSize: '0.9em'
                          }}>
                            <p style={{ margin: '2px 0' }}>
                              <strong>{getLabel(selectedVarX)}:</strong> {payload[0].value}
                            </p>
                            <p style={{ margin: '2px 0' }}>
                              <strong>{getLabel(varY)}:</strong> {payload[1].value}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Scatter
                      data={scatterData}
                      fill={colors[idx]}
                      fillOpacity={0.6}
                    />
                    {/* Linea di regressione (opzionale) */}
                    {corr && Math.abs(corr.r) > 0.3 && (
                      <ReferenceLine
                        stroke={colors[idx]}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        segment={[
                          { x: Math.min(...scatterData.map(d => d.x)), y: 0 },
                          { x: Math.max(...scatterData.map(d => d.x)), y: 0 }
                        ]}
                      />
                    )}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      )}

      {selectedVarX && selectedVarsY.length > 0 && !raw_data && (
        <div style={{
          padding: '40px',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#92400e',
          marginTop: '20px'
        }}>
          <svg style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p style={{ fontSize: '1em', fontWeight: '600' }}>
            Dati raw non disponibili
          </p>
          <p style={{ fontSize: '0.9em', marginTop: '8px' }}>
            Lo scatter plot richiede i dati raw dal backend. Ricarica la pagina per ottenerli.
          </p>
        </div>
      )}

      {!selectedVarX && (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: '#94a3b8'
        }}>
          <svg style={{ width: '64px', height: '64px', margin: '0 auto 20px', opacity: 0.3 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h4 style={{ color: '#64748b', marginBottom: '10px' }}>
            Seleziona variabili per iniziare
          </h4>
          <p style={{ fontSize: '0.9em' }}>
            Scegli una variabile X e una o più variabili Y per confrontare le correlazioni
          </p>
        </div>
      )}

      {/* Legenda */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f1f5f9',
        borderRadius: '8px',
        fontSize: '0.9em'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>Legenda</h4>
        <p style={{ margin: '5px 0', color: '#475569' }}>
          <strong>Intensità:</strong> |r| ≥ 0.7 (forte), 0.5-0.7 (moderata), 0.3-0.5 (debole), &lt; 0.3 (molto debole)
        </p>
        <p style={{ margin: '5px 0', color: '#475569' }}>
          <strong>Significatività:</strong> * p&lt;0.05, ** p&lt;0.01, *** p&lt;0.001
        </p>
        <p style={{ margin: '5px 0', color: '#475569' }}>
          <strong>Direzione:</strong> r positivo = relazione diretta, r negativo = relazione inversa
        </p>
      </div>
    </div>
  );
};

export default CorrelationComparison;

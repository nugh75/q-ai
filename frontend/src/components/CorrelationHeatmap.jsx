import React from 'react';

/**
 * Heatmap per matrice di correlazione usando CSS Grid
 * Fallback version senza Plotly per evitare problemi di dipendenze
 */
const CorrelationHeatmap = ({ correlationData, title }) => {
  const [minCorr, setMinCorr] = React.useState(0);
  const [showOnlySignificant, setShowOnlySignificant] = React.useState(false);

  if (!correlationData || !correlationData.correlation_matrix) {
    return <div className="no-data">Nessun dato disponibile</div>;
  }

  const { variables, correlation_matrix, p_value_matrix } = correlationData;

  // Crea etichette variabili più leggibili
  const variableLabels = variables.map(v => {
    const labelMap = {
      // Competenze Likert
      'practical_competence': 'Comp. Pratica',
      'theoretical_competence': 'Comp. Teorica',
      'ai_change_study': 'AI Cambia Studio',
      'ai_change_teaching': 'AI Cambia Insegn.',
      'training_adequacy': 'Formaz. Adeguata',
      'trust_integration': 'Fiducia Integr.',
      'concern_ai_school': 'Preoccup. Scuola',
      'concern_ai_peers': 'Preoccup. Pari',
      'concern_ai_education': 'Preoccup. Educaz.',
      'concern_ai_students': 'Preoccup. Studenti',
      // Variabili numeriche
      'age': 'Età',
      'hours_daily': 'Ore/Giorno',
      'hours_study': 'Ore Studio',
      'hours_training': 'Ore Formazione',
      'hours_lesson_planning': 'Ore Pianif.',
      // Variabili categoriche
      'gender_code': 'Genere',
      'uses_ai_daily_code': 'Uso Quotid.',
      'uses_ai_study_code': 'Uso Studio',
      'school_type_code': 'Tipo Scuola',
      'school_level_code': 'Livello Scuola',
      'currently_teaching_code': 'Insegna Ora'
    };
    return labelMap[v] || v;
  });

  // Funzione per ottenere colore basato su correlazione
  const getColor = (r) => {
    if (r >= 0.7) return '#1e40af';      // Blu scuro
    if (r >= 0.5) return '#60a5fa';      // Blu chiaro
    if (r >= 0.3) return '#93c5fd';      // Blu molto chiaro
    if (r >= 0.1) return '#dbeafe';      // Blu pallidissimo
    if (r >= -0.1) return '#f3f4f6';     // Grigio
    if (r >= -0.3) return '#fecaca';     // Rosso pallidissimo
    if (r >= -0.5) return '#f87171';     // Rosso chiaro
    if (r >= -0.7) return '#dc2626';     // Rosso medio
    return '#b91c1c';                     // Rosso scuro
  };

  // Funzione per determinare colore testo (bianco per celle scure)
  const getTextColor = (r) => {
    return Math.abs(r) > 0.5 ? '#ffffff' : '#000000';
  };

  return (
    <div style={{ width: '100%', padding: '20px' }}>
      {title && (
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#1e40af' }}>
          {title}
        </h3>
      )}

      {/* Filtri */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        display: 'flex',
        gap: '30px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.9em', fontWeight: '600', color: '#475569' }}>
            Intensità minima: |r| ≥ {minCorr.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="0.7"
            step="0.1"
            value={minCorr}
            onChange={(e) => setMinCorr(parseFloat(e.target.value))}
            style={{ width: '200px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="significantOnly"
            checked={showOnlySignificant}
            onChange={(e) => setShowOnlySignificant(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="significantOnly" style={{ fontSize: '0.9em', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>
            Solo significative (p &lt; 0.05)
          </label>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `140px repeat(${variables.length}, ${variables.length > 10 ? '70px' : '100px'})`,
        gap: '1px',
        backgroundColor: '#e2e8f0',
        padding: '2px',
        borderRadius: '8px',
        marginBottom: '20px',
        overflow: 'auto',
        maxWidth: '100%'
      }}>
        {/* Header vuoto in alto a sinistra */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '8px',
          fontWeight: 'bold',
          fontSize: '0.9em'
        }}></div>

        {/* Header colonne */}
        {variableLabels.map((label, idx) => (
          <div
            key={`header-${idx}`}
            style={{
              backgroundColor: '#f1f5f9',
              padding: '8px',
              fontWeight: 'bold',
              fontSize: '0.85em',
              textAlign: 'center',
              transform: 'rotate(-45deg)',
              transformOrigin: 'center',
              height: '80px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center'
            }}
          >
            {label}
          </div>
        ))}

        {/* Righe della matrice */}
        {variables.map((rowVar, i) => (
          <React.Fragment key={`row-${i}`}>
            {/* Etichetta riga */}
            <div style={{
              backgroundColor: '#f1f5f9',
              padding: '8px',
              fontWeight: 'bold',
              fontSize: '0.85em',
              display: 'flex',
              alignItems: 'center'
            }}>
              {variableLabels[i]}
            </div>

            {/* Celle della matrice */}
            {variables.map((colVar, j) => {
              const r = correlation_matrix[i][j];
              const p = p_value_matrix[i][j];
              const isSignificant = p < 0.05;

              // Applica filtri
              if (Math.abs(r) < minCorr) {
                return (
                  <div
                    key={`cell-${i}-${j}`}
                    style={{
                      backgroundColor: '#f8fafc',
                      color: '#cbd5e1',
                      padding: '12px 4px',
                      textAlign: 'center',
                      fontSize: '0.9em'
                    }}
                  >
                    -
                  </div>
                );
              }

              if (showOnlySignificant && !isSignificant && i !== j) {
                return (
                  <div
                    key={`cell-${i}-${j}`}
                    style={{
                      backgroundColor: '#f8fafc',
                      color: '#cbd5e1',
                      padding: '12px 4px',
                      textAlign: 'center',
                      fontSize: '0.85em'
                    }}
                  >
                    n.s.
                  </div>
                );
              }

              let stars = '';
              if (i !== j) {
                if (p < 0.001) stars = '***';
                else if (p < 0.01) stars = '**';
                else if (p < 0.05) stars = '*';
              }

              return (
                <div
                  key={`cell-${i}-${j}`}
                  style={{
                    backgroundColor: getColor(r),
                    color: getTextColor(r),
                    padding: '12px 4px',
                    textAlign: 'center',
                    fontSize: '0.9em',
                    fontWeight: i === j ? 'bold' : 'normal',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    position: 'relative'
                  }}
                  title={`${variableLabels[i]} vs ${variableLabels[j]}: r=${r.toFixed(3)}, p=${p < 0.001 ? '<0.001' : p.toFixed(3)}`}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {r.toFixed(2)}
                  {stars && <div style={{ fontSize: '0.7em' }}>{stars}</div>}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f1f5f9',
        borderRadius: '8px',
        fontSize: '0.9em'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>
          Legenda Colori
        </h4>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '40px', height: '20px', backgroundColor: '#b91c1c' }}></div>
            <span>r ≤ -0.7 (forte negativa)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '40px', height: '20px', backgroundColor: '#f87171' }}></div>
            <span>-0.7 &lt; r ≤ -0.3 (moderata negativa)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '40px', height: '20px', backgroundColor: '#f3f4f6' }}></div>
            <span>-0.1 &lt; r &lt; 0.1 (nessuna)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '40px', height: '20px', backgroundColor: '#93c5fd' }}></div>
            <span>0.3 ≤ r &lt; 0.7 (moderata positiva)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '40px', height: '20px', backgroundColor: '#1e40af' }}></div>
            <span>r ≥ 0.7 (forte positiva)</span>
          </div>
        </div>
        <p style={{ margin: '10px 0 0 0', color: '#475569', fontSize: '0.9em' }}>
          * p&lt;0.05, ** p&lt;0.01, *** p&lt;0.001 | Hover sulle celle per dettagli
        </p>
      </div>

      {correlationData.significant_correlations && correlationData.significant_correlations.length > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          borderLeft: '4px solid #3b82f6'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>
            Correlazioni Significative (Top 10)
          </h4>
          <table style={{ width: '100%', fontSize: '0.9em', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#dbeafe' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Variabile 1</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Variabile 2</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>r</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Forza</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>p-value</th>
              </tr>
            </thead>
            <tbody>
              {correlationData.significant_correlations.slice(0, 10).map((corr, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px' }}>{corr.var1}</td>
                  <td style={{ padding: '8px' }}>{corr.var2}</td>
                  <td style={{
                    padding: '8px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: corr.direction === 'positive' ? '#0ea5e9' : '#ef4444'
                  }}>
                    {corr.correlation.toFixed(3)}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.85em',
                      backgroundColor:
                        corr.strength === 'very strong' ? '#dcfce7' :
                        corr.strength === 'strong' ? '#dbeafe' :
                        corr.strength === 'moderate' ? '#fef3c7' : '#fee2e2',
                      color:
                        corr.strength === 'very strong' ? '#166534' :
                        corr.strength === 'strong' ? '#1e40af' :
                        corr.strength === 'moderate' ? '#92400e' : '#991b1b'
                    }}>
                      {corr.strength}
                    </span>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', fontSize: '0.85em', color: '#64748b' }}>
                    {corr.p_value < 0.001 ? '<0.001' : corr.p_value.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CorrelationHeatmap;

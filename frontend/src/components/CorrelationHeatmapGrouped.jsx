import React, { useState } from 'react';

// Icone SVG per i gruppi
const LikertIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const NumericIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
  </svg>
);

const CategoryIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

/**
 * Heatmap di correlazione con raggruppamento per tipo di variabile
 */
const CorrelationHeatmapGrouped = ({ correlationData, title }) => {
  const [minCorr, setMinCorr] = useState(0);
  const [showOnlySignificant, setShowOnlySignificant] = useState(false);

  if (!correlationData || !correlationData.correlation_matrix) {
    return <div className="no-data">Nessun dato disponibile</div>;
  }

  const { variables, correlation_matrix, p_value_matrix } = correlationData;

  // Raggruppa variabili per tipo
  const groups = {
    likert: [],
    numeric: [],
    categorical: []
  };

  variables.forEach((v, idx) => {
    if (v.includes('competence') || v.includes('change') || v.includes('adequacy') ||
        v.includes('trust') || v.includes('concern')) {
      groups.likert.push({ name: v, index: idx });
    } else if (v.endsWith('_code')) {
      groups.categorical.push({ name: v, index: idx });
    } else {
      groups.numeric.push({ name: v, index: idx });
    }
  });

  // Mappa etichette leggibili
  const labelMap = {
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
    'age': 'Età',
    'hours_daily': 'Ore/Giorno',
    'hours_study': 'Ore Studio',
    'hours_training': 'Ore Formazione',
    'hours_lesson_planning': 'Ore Pianif.',
    'gender_code': 'Genere',
    'uses_ai_daily_code': 'Uso Quotid.',
    'uses_ai_study_code': 'Uso Studio',
    'school_type_code': 'Tipo Scuola',
    'school_level_code': 'Livello Scuola',
    'currently_teaching_code': 'Insegna Ora'
  };

  const getLabel = (v) => labelMap[v] || v;

  // Funzione colore
  const getColor = (r) => {
    if (r >= 0.7) return '#1e40af';
    if (r >= 0.5) return '#60a5fa';
    if (r >= 0.3) return '#93c5fd';
    if (r >= 0.1) return '#dbeafe';
    if (r >= -0.1) return '#f3f4f6';
    if (r >= -0.3) return '#fecaca';
    if (r >= -0.5) return '#f87171';
    if (r >= -0.7) return '#dc2626';
    return '#b91c1c';
  };

  const getTextColor = (r) => Math.abs(r) > 0.5 ? '#ffffff' : '#000000';

  // Rendering gruppo
  const renderGroup = (groupName, groupTitle, groupVars, IconComponent) => {
    if (groupVars.length === 0) return null;

    return (
      <div key={groupName} style={{ marginBottom: '40px' }}>
        <h4 style={{
          color: '#1e40af',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{
            padding: '6px 12px',
            backgroundColor: groupName === 'likert' ? '#dbeafe' : groupName === 'numeric' ? '#dcfce7' : '#fef3c7',
            borderRadius: '6px',
            fontSize: '0.9em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <IconComponent />
            {groupTitle}
          </span>
          <span style={{ fontSize: '0.85em', color: '#64748b' }}>
            ({groupVars.length} variabili)
          </span>
        </h4>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `140px repeat(${groupVars.length}, 80px)`,
          gap: '1px',
          backgroundColor: '#e2e8f0',
          padding: '2px',
          borderRadius: '8px',
          overflow: 'auto',
          maxWidth: '100%'
        }}>
          {/* Header vuoto */}
          <div style={{ backgroundColor: '#f8fafc', padding: '6px' }}></div>

          {/* Header colonne */}
          {groupVars.map((col) => (
            <div
              key={`header-${col.index}`}
              style={{
                backgroundColor: '#f1f5f9',
                padding: '6px 4px',
                fontWeight: 'bold',
                fontSize: '0.75em',
                textAlign: 'center',
                transform: 'rotate(-45deg)',
                transformOrigin: 'center',
                height: '70px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center'
              }}
            >
              {getLabel(col.name)}
            </div>
          ))}

          {/* Righe */}
          {groupVars.map((row) => (
            <React.Fragment key={`row-${row.index}`}>
              <div style={{
                backgroundColor: '#f1f5f9',
                padding: '6px',
                fontWeight: 'bold',
                fontSize: '0.8em',
                display: 'flex',
                alignItems: 'center'
              }}>
                {getLabel(row.name)}
              </div>

              {groupVars.map((col) => {
                const r = correlation_matrix[row.index][col.index];
                const p = p_value_matrix[row.index][col.index];
                const isSignificant = p < 0.05;

                // Applica filtri
                if (Math.abs(r) < minCorr) return (
                  <div key={`cell-${row.index}-${col.index}`} style={{
                    backgroundColor: '#f8fafc',
                    padding: '10px 4px',
                    textAlign: 'center',
                    fontSize: '0.8em',
                    color: '#cbd5e1'
                  }}>
                    -
                  </div>
                );

                if (showOnlySignificant && !isSignificant && row.index !== col.index) return (
                  <div key={`cell-${row.index}-${col.index}`} style={{
                    backgroundColor: '#f8fafc',
                    padding: '10px 4px',
                    textAlign: 'center',
                    fontSize: '0.8em',
                    color: '#cbd5e1'
                  }}>
                    n.s.
                  </div>
                );

                let stars = '';
                if (row.index !== col.index) {
                  if (p < 0.001) stars = '***';
                  else if (p < 0.01) stars = '**';
                  else if (p < 0.05) stars = '*';
                }

                return (
                  <div
                    key={`cell-${row.index}-${col.index}`}
                    style={{
                      backgroundColor: getColor(r),
                      color: getTextColor(r),
                      padding: '10px 4px',
                      textAlign: 'center',
                      fontSize: '0.85em',
                      fontWeight: row.index === col.index ? 'bold' : 'normal',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    title={`${getLabel(row.name)} vs ${getLabel(col.name)}: r=${r.toFixed(3)}, p=${p < 0.001 ? '<0.001' : p.toFixed(3)}`}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {r.toFixed(2)}
                    {stars && <div style={{ fontSize: '0.65em' }}>{stars}</div>}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
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
        marginBottom: '30px',
        padding: '20px',
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

      {/* Heatmap raggruppate */}
      {renderGroup('likert', 'Variabili Likert (1-7)', groups.likert, LikertIcon)}
      {renderGroup('numeric', 'Variabili Numeriche Continue', groups.numeric, NumericIcon)}
      {renderGroup('categorical', 'Variabili Categoriche Codificate', groups.categorical, CategoryIcon)}

      {/* Legenda */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f1f5f9',
        borderRadius: '8px',
        fontSize: '0.9em'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>Legenda</h4>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '30px', height: '15px', backgroundColor: '#1e40af' }}></div>
            <span style={{ fontSize: '0.85em' }}>r ≥ 0.7</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '30px', height: '15px', backgroundColor: '#93c5fd' }}></div>
            <span style={{ fontSize: '0.85em' }}>0.3 ≤ r &lt; 0.7</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '30px', height: '15px', backgroundColor: '#f3f4f6' }}></div>
            <span style={{ fontSize: '0.85em' }}>|r| &lt; 0.1</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '30px', height: '15px', backgroundColor: '#f87171' }}></div>
            <span style={{ fontSize: '0.85em' }}>-0.7 &lt; r ≤ -0.3</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '30px', height: '15px', backgroundColor: '#b91c1c' }}></div>
            <span style={{ fontSize: '0.85em' }}>r ≤ -0.7</span>
          </div>
        </div>
        <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '0.85em' }}>
          * p&lt;0.05, ** p&lt;0.01, *** p&lt;0.001 | n.s. = non significativa
        </p>
      </div>
    </div>
  );
};

export default CorrelationHeatmapGrouped;

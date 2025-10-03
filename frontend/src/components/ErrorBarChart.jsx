import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ErrorBar, ReferenceLine } from 'recharts';
import { CATEGORY_COLORS, CATEGORY_COLORS_DARK } from '../constants/colors';

/**
 * Grafico a barre con error bars (intervalli di confidenza 95%)
 *
 * @param {Array} data - Dati per il grafico
 * @param {string} title - Titolo del grafico
 * @param {string} teacherCategory - Categoria insegnanti (teachers_all, teachers_active, teachers_training)
 */
const ErrorBarChart = ({ data, title, teacherCategory = 'teachers_active' }) => {
  if (!data || data.length === 0) {
    return <div className="no-data">Nessun dato disponibile</div>;
  }

  // Trasforma i dati dal formato API al formato Recharts
  const chartData = data.map(item => ({
    label: item.label,
    Studenti: item.students.mean,
    Studenti_error: [
      item.students.mean - item.students.ci_lower,  // Error down
      item.students.ci_upper - item.students.mean   // Error up
    ],
    Studenti_sd: item.students.sd,
    Studenti_n: item.students.n,
    Insegnanti: item.teachers.mean,
    Insegnanti_error: [
      item.teachers.mean - item.teachers.ci_lower,
      item.teachers.ci_upper - item.teachers.mean
    ],
    Insegnanti_sd: item.teachers.sd,
    Insegnanti_n: item.teachers.n
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload;
    const group = payload[0].name; // "Studenti" o "Insegnanti"

    const mean = group === "Studenti" ? data.Studenti : data.Insegnanti;
    const sd = group === "Studenti" ? data.Studenti_sd : data.Insegnanti_sd;
    const n = group === "Studenti" ? data.Studenti_n : data.Insegnanti_n;
    const ciLower = group === "Studenti"
      ? data.Studenti - data.Studenti_error[0]
      : data.Insegnanti - data.Insegnanti_error[0];
    const ciUpper = group === "Studenti"
      ? data.Studenti + data.Studenti_error[1]
      : data.Insegnanti + data.Insegnanti_error[1];

    return (
      <div style={{
        backgroundColor: 'white',
        padding: '12px',
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1e40af' }}>
          {data.label}
        </p>
        <p style={{ fontWeight: '600', color: payload[0].color }}>
          {group}
        </p>
        <p style={{ margin: '4px 0' }}>
          Media: <strong>{mean.toFixed(2)}</strong>
        </p>
        <p style={{ margin: '4px 0' }}>
          SD: ±{sd.toFixed(2)}
        </p>
        <p style={{ margin: '4px 0', fontSize: '0.9em', color: '#64748b' }}>
          95% CI: [{ciLower.toFixed(2)}, {ciUpper.toFixed(2)}]
        </p>
        <p style={{ margin: '4px 0', fontSize: '0.85em', color: '#94a3b8' }}>
          n = {n}
        </p>
      </div>
    );
  };

  // Determina se usare layout verticale (più di 6 categorie)
  const useVerticalLayout = chartData.length > 6;
  const chartHeight = useVerticalLayout ? Math.max(500, chartData.length * 80) : 450;

  return (
    <div style={{ width: '100%', padding: '20px' }}>
      {title && (
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#1e40af' }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout={useVerticalLayout ? "vertical" : "horizontal"}
          margin={{ top: 20, right: 30, left: useVerticalLayout ? 180 : 20, bottom: useVerticalLayout ? 50 : 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          {useVerticalLayout ? (
            <>
              <XAxis
                type="number"
                domain={[0, 7]}
                label={{
                  value: 'Punteggio (1-7)',
                  position: 'bottom',
                  style: { fontSize: '14px', fontWeight: 'bold' }
                }}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={160}
                style={{ fontSize: '11px' }}
                interval={0}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="label"
                angle={-30}
                textAnchor="end"
                height={100}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                domain={[0, 7]}
                label={{
                  value: 'Punteggio (1-7)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: '14px', fontWeight: 'bold' }
                }}
                style={{ fontSize: '12px' }}
              />
            </>
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />

          {/* Linea di riferimento al punto medio */}
          <ReferenceLine
            {...(useVerticalLayout ? { x: 4 } : { y: 4 })}
            stroke="#94a3b8"
            strokeDasharray="3 3"
            label={{ value: 'Punto medio', position: useVerticalLayout ? 'top' : 'right', fill: '#64748b' }}
          />

          {/* Barre Studenti con error bars */}
          <Bar
            dataKey="Studenti"
            fill={CATEGORY_COLORS.students}
            name="Studenti"
            barSize={60}
          >
            <ErrorBar
              dataKey="Studenti_error"
              width={4}
              strokeWidth={2}
              stroke={CATEGORY_COLORS_DARK.students}
              direction={useVerticalLayout ? "x" : "y"}
            />
          </Bar>

          {/* Barre Insegnanti con error bars */}
          <Bar
            dataKey="Insegnanti"
            fill={CATEGORY_COLORS[teacherCategory]}
            name="Insegnanti"
            barSize={60}
          >
            <ErrorBar
              dataKey="Insegnanti_error"
              width={4}
              strokeWidth={2}
              stroke={CATEGORY_COLORS_DARK[teacherCategory]}
              direction={useVerticalLayout ? "x" : "y"}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{
        textAlign: 'center',
        marginTop: '20px',
        fontSize: '0.9em',
        color: '#64748b'
      }}>
        Le barre di errore rappresentano gli intervalli di confidenza al 95% (t di Student)
      </div>
    </div>
  );
};

export default ErrorBarChart;

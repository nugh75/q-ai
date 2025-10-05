import { useState, useEffect } from 'react'
import { Icons } from './Icons'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'

function InterpretativeAnalysis() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [studentsRes, teachersActiveRes, teachersTrainingRes, comparisonRes, likertRes] = await Promise.all([
        fetch(`${API_URL}/api/students`),
        fetch(`${API_URL}/api/teachers?include_non_teaching=false`),
        fetch(`${API_URL}/api/teachers?only_non_teaching=true`),
        fetch(`${API_URL}/api/comparison`),
        fetch(`${API_URL}/api/likert-questions`)
      ])

      const students = await studentsRes.json()
      const teachersActive = await teachersActiveRes.json()
      const teachersTraining = await teachersTrainingRes.json()
      const comparison = await comparisonRes.json()
      const likert = await likertRes.json()

      setData({ students, teachersActive, teachersTraining, comparison, likert })
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Caricamento analisi interpretativa...</div>
  }

  if (!data) {
    return <div className="error">Errore nel caricamento dei dati</div>
  }

  return (
    <div className="interpretative-analysis">
      <header className="section-header">
        <div>
          <h2>
            <Icons.FileText className="w-6 h-6" />
            Analisi interpretativa dei risultati
          </h2>
          <p className="section-subtitle">
            Interpretazione discorsiva dei dati statistici raccolti
          </p>
        </div>
      </header>

      {/* Overview generale */}
      <section className="analysis-section">
        <h3 className="analysis-title">
          <Icons.TrendingUp className="w-5 h-5" />
          Quadro generale
        </h3>
        <div className="analysis-content">
          <p>
            L'indagine ha raccolto <strong>{data.students.total_responses} risposte da studenti</strong> e{' '}
            <strong>{data.teachersActive.total_responses} da insegnanti attualmente in servizio</strong>,
            offrendo uno spaccato significativo sulla percezione e l'uso dell'Intelligenza Artificiale nel contesto educativo italiano.
          </p>
          <p>
            Un dato particolarmente rilevante emerge dall'analisi dell'utilizzo quotidiano: l'<strong>{data.students.utilizzo.uses_ai_daily_percentage}%</strong> degli
            studenti utilizza l'IA quotidianamente, contro il <strong>{data.teachersActive.utilizzo.uses_ai_daily_percentage}%</strong> degli insegnanti in servizio.
            Questo divario di quasi 24 punti percentuali evidenzia una differenza generazionale significativa nell'adozione tecnologica.
          </p>
        </div>
      </section>

      {/* Analisi competenze */}
      <section className="analysis-section">
        <h3 className="analysis-title">
          <Icons.Award className="w-5 h-5" />
          Competenze e formazione: il paradosso della conoscenza
        </h3>
        <div className="analysis-content">
          <h4>Competenze pratiche vs teoriche</h4>
          <p>
            L'analisi delle competenze rivela un pattern interessante e controintuitivo. Gli studenti si percepiscono più competenti
            nell'uso pratico dell'IA (media: <strong>{data.students.competenze.practical.mean}</strong>) rispetto alla conoscenza teorica
            (media: <strong>{data.students.competenze.theoretical.mean}</strong>), con un gap di oltre 1 punto sulla scala Likert.
          </p>
          <p>
            Questo suggerisce un approccio "learning by doing" caratteristico dei nativi digitali, che acquisiscono competenze pratiche
            attraverso l'uso diretto degli strumenti, spesso senza una formazione teorica strutturata. Gli insegnanti, al contrario,
            mostrano valori più equilibrati tra competenza pratica ({data.teachersActive.competenze.practical.mean}) e teorica
            ({data.teachersActive.competenze.theoretical.mean}), pur mantenendo entrambi i valori al di sotto della media scala.
          </p>

          <h4>Il problema della formazione inadeguata</h4>
          <p>
            Uno dei risultati più critici emerge dall'analisi della formazione ricevuta. Sia studenti (media: <strong>{data.students.impatto_fiducia.training_adequacy.mean}</strong>)
            che insegnanti (media: <strong>{data.teachersActive.impatto.training_adequacy.mean}</strong>) valutano la formazione sull'IA
            come largamente inadeguata, con valori ben al di sotto del punto mediano della scala.
          </p>
          <p>
            La distribuzione dei dati mostra che <strong>{data.students.impatto_fiducia.training_adequacy.distribution['1']} studenti</strong> (
            {((data.students.impatto_fiducia.training_adequacy.distribution['1'] / data.students.total_responses) * 100).toFixed(1)}%)
            e <strong>{data.teachersActive.impatto.training_adequacy.distribution['1']} insegnanti</strong> (
            {((data.teachersActive.impatto.training_adequacy.distribution['1'] / data.teachersActive.total_responses) * 100).toFixed(1)}%)
            hanno assegnato il valore minimo (1) alla formazione ricevuta. Questo evidenzia un bisogno formativo critico e trasversale.
          </p>
        </div>
      </section>

      {/* Analisi impatto e fiducia */}
      <section className="analysis-section">
        <h3 className="analysis-title">
          <Icons.Zap className="w-5 h-5" />
          Percezione del cambiamento: tra ottimismo e cautela
        </h3>
        <div className="analysis-content">
          <h4>Gli insegnanti vedono una rivoluzione in arrivo</h4>
          <p>
            Gli insegnanti mostrano una forte convinzione che l'IA cambierà profondamente l'insegnamento in generale
            (media: <strong>{data.teachersActive.impatto.ai_change_teaching.mean}</strong>, mediana: {data.teachersActive.impatto.ai_change_teaching.median}).
            Con <strong>{data.teachersActive.impatto.ai_change_teaching.distribution['6']} risposte su 6</strong> e{' '}
            <strong>{data.teachersActive.impatto.ai_change_teaching.distribution['7']} su 7</strong>,
            la maggioranza assoluta degli insegnanti ({((parseInt(data.teachersActive.impatto.ai_change_teaching.distribution['6']) +
            parseInt(data.teachersActive.impatto.ai_change_teaching.distribution['7'])) / data.teachersActive.total_responses * 100).toFixed(1)}%)
            prevede un cambiamento significativo.
          </p>
          <p>
            Interessante notare, tuttavia, che quando si parla del proprio insegnamento personale, il valore scende
            a <strong>{data.teachersActive.impatto.ai_change_my_teaching.mean}</strong> (mediana: {data.teachersActive.impatto.ai_change_my_teaching.median}).
            Questo gap di quasi 0.8 punti suggerisce un fenomeno psicologico noto come "bias della terza persona":
            si tende a credere che il cambiamento riguarderà più gli altri che se stessi.
          </p>

          <h4>Studenti: pragmatismo e aspettative moderate</h4>
          <p>
            Gli studenti mostrano aspettative più moderate sul cambiamento del loro modo di studiare
            (media: <strong>{data.students.impatto_fiducia.ai_change_study.mean}</strong>),
            pur riconoscendo un impatto significativo. La mediana di {data.students.impatto_fiducia.ai_change_study.median}
            e la distribuzione concentrata sui valori 5-6 suggeriscono un ottimismo cauto ma diffuso.
          </p>

          <h4>Fiducia nell'integrazione: il divario generazionale</h4>
          <p>
            Gli studenti esprimono maggiore fiducia nell'integrazione dell'IA nell'istruzione
            (media: <strong>{data.students.impatto_fiducia.trust_integration.mean}</strong>) rispetto agli insegnanti
            (media: <strong>{data.teachersActive.fiducia.trust_integration.mean}</strong>),
            con una differenza di {Math.abs(data.students.impatto_fiducia.trust_integration.mean - data.teachersActive.fiducia.trust_integration.mean).toFixed(2)} punti.
          </p>
          <p>
            Questo dato è particolarmente significativo: chi utilizzerà l'IA (studenti) è più fiducioso di chi dovrà insegnarla (insegnanti).
            Il dato potrebbe riflettere sia una maggiore familiarità tecnologica dei giovani, sia preoccupazioni professionali e pedagogiche
            degli insegnanti che vedono complessità che gli studenti potrebbero non percepire.
          </p>
        </div>
      </section>

      {/* Analisi preoccupazioni */}
      <section className="analysis-section">
        <h3 className="analysis-title">
          <Icons.AlertCircle className="w-5 h-5" />
          Preoccupazioni: uno sguardo alle criticità percepite
        </h3>
        <div className="analysis-content">
          <h4>Studenti: preoccupazioni moderate e distribuite</h4>
          <p>
            Gli studenti mostrano livelli di preoccupazione moderati sia riguardo l'uso dell'IA nella scuola
            (media: <strong>{data.students.preoccupazioni.concern_ai_school.mean}</strong>)
            che da parte dei compagni (media: <strong>{data.students.preoccupazioni.concern_ai_peers.mean}</strong>).
            Entrambi i valori si collocano leggermente sopra il punto mediano, suggerendo una consapevolezza dei rischi
            ma non un allarme diffuso.
          </p>
          <p>
            La distribuzione mostra polarizzazione: {data.students.preoccupazioni.concern_ai_school.distribution['1']} studenti
            non sono per nulla preoccupati, mentre {data.students.preoccupazioni.concern_ai_school.distribution['7']}
            sono molto preoccupati. Questa variabilità suggerisce differenze significative nella percezione dei rischi
            all'interno della popolazione studentesca.
          </p>

          <h4>Insegnanti: preoccupazioni elevate, specialmente per gli studenti</h4>
          <p>
            Gli insegnanti esprimono preoccupazioni più marcate, specialmente riguardo all'uso dell'IA da parte degli studenti
            (media: <strong>{data.teachersActive.preoccupazioni.concern_ai_students.mean}</strong>,
            mediana: {data.teachersActive.preoccupazioni.concern_ai_students.median}).
            Con {((parseInt(data.teachersActive.preoccupazioni.concern_ai_students.distribution['5']) +
            parseInt(data.teachersActive.preoccupazioni.concern_ai_students.distribution['6']) +
            parseInt(data.teachersActive.preoccupazioni.concern_ai_students.distribution['7'])) /
            data.teachersActive.total_responses * 100).toFixed(1)}% di risposte sui valori 5-7,
            emerge una preoccupazione maggioritaria e diffusa.
          </p>
          <p>
            Le preoccupazioni generali sull'IA nell'educazione sono più moderate
            (media: <strong>{data.teachersActive.preoccupazioni.concern_ai_education.mean}</strong>),
            ma comunque superiori a quelle degli studenti. Questo gap potrebbe riflettere la maggiore
            consapevolezza degli insegnanti sui rischi pedagogici, etici e professionali dell'IA.
          </p>

          <h4>Il paradosso fiducia-preoccupazione negli insegnanti</h4>
          <p>
            Emerge un paradosso interessante: gli insegnanti che credono fortemente che l'IA cambierà l'insegnamento
            ({data.teachersActive.impatto.ai_change_teaching.mean}) sono anche quelli più preoccupati
            ({data.teachersActive.preoccupazioni.concern_ai_students.mean}).
            Questo suggerisce una consapevolezza critica: riconoscono il potenziale trasformativo ma ne vedono anche i rischi,
            una posizione di "ottimismo informato" o "cautela consapevole".
          </p>
        </div>
      </section>

      {/* Analisi fiducia insegnanti verso studenti */}
      <section className="analysis-section">
        <h3 className="analysis-title">
          <Icons.Users className="w-5 h-5" />
          Fiducia degli insegnanti negli studenti: un dato critico
        </h3>
        <div className="analysis-content">
          <p>
            Uno dei risultati più critici dell'indagine emerge dalla scarsa fiducia che gli insegnanti ripongono
            nell'utilizzo consapevole dell'IA da parte degli studenti (media: <strong>{data.teachersActive.fiducia.trust_students.mean}</strong>,
            mediana: {data.teachersActive.fiducia.trust_students.median}).
          </p>
          <p>
            Con <strong>{data.teachersActive.fiducia.trust_students.distribution['1']} insegnanti su {data.teachersActive.total_responses}</strong> (
            {((data.teachersActive.fiducia.trust_students.distribution['1'] / data.teachersActive.total_responses) * 100).toFixed(1)}%)
            che assegnano il valore minimo di fiducia, emerge un problema di fondo: gli educatori non si sentono rassicurati
            dalla capacità critica degli studenti nell'uso di questi strumenti.
          </p>
          <p>
            Questo dato va messo in relazione con l'alto utilizzo quotidiano dell'IA da parte degli studenti ({data.students.utilizzo.uses_ai_daily_percentage}%).
            Si configura così uno scenario problematico: <strong>gli studenti usano massivamente strumenti che gli insegnanti
            ritengono non siano in grado di gestire criticamente</strong>. Questa disconnessione evidenzia un urgente bisogno
            di alfabetizzazione critica sull'IA.
          </p>
        </div>
      </section>

      {/* Analisi comparativa competenze */}
      <section className="analysis-section">
        <h3 className="analysis-title">
          <Icons.GitCompare className="w-5 h-5" />
          Confronto diretto: chi è più competente?
        </h3>
        <div className="analysis-content">
          <h4>Il paradosso della competenza pratica</h4>
          <p>
            L'analisi comparativa rivela un risultato sorprendente: gli <strong>studenti si percepiscono significativamente
            più competenti degli insegnanti nell'uso pratico dell'IA</strong> (studenti: {data.students.competenze.practical.mean} vs.
            insegnanti: {data.teachersActive.competenze.practical.mean}, differenza: {Math.abs(data.students.competenze.practical.mean -
            data.teachersActive.competenze.practical.mean).toFixed(2)} punti).
          </p>
          <p>
            Questo dato è particolarmente significativo considerando che la mediana è identica (4.0) per entrambi i gruppi,
            ma la distribuzione degli studenti è più spostata verso i valori alti. Ciò suggerisce che mentre la "massa critica"
            di entrambi i gruppi si colloca su un livello intermedio di competenza, esistono più studenti con competenze
            pratiche avanzate rispetto agli insegnanti.
          </p>

          <h4>Competenza teorica: più equilibrio</h4>
          <p>
            Sulla conoscenza teorica, il gap si riduce drasticamente: insegnanti a {data.teachersActive.competenze.theoretical.mean}
            e studenti a {data.students.competenze.theoretical.mean}, con una differenza di soli {Math.abs(data.students.competenze.theoretical.mean -
            data.teachersActive.competenze.theoretical.mean).toFixed(2)} punti.
            Entrambi i gruppi si collocano sotto il punto mediano della scala, evidenziando una generale carenza di fondamenti teorici.
          </p>
          <p>
            Questo equilibrio nella debolezza teorica è preoccupante: significa che <strong>né chi usa l'IA quotidianamente
            (studenti) né chi dovrebbe insegnarla criticamente (insegnanti) possiede una solida base concettuale</strong>.
            Il rischio è un uso strumentale e acritico della tecnologia.
          </p>
        </div>
      </section>

      {/* Pattern temporali */}
      <section className="analysis-section">
        <h3 className="analysis-title">
          <Icons.Clock className="w-5 h-5" />
          Intensità d'uso: un investimento temporale significativo
        </h3>
        <div className="analysis-content">
          <p>
            Gli studenti dedicano in media <strong>{data.students.utilizzo.hours_daily_avg} ore al giorno</strong> all'uso
            generale dell'IA e <strong>{data.students.utilizzo.hours_study_avg} ore</strong> specificamente per lo studio.
            Questo rappresenta una porzione sostanziale del tempo dedicato alle attività accademiche.
          </p>
          <p>
            Gli insegnanti in servizio mostrano pattern diversi: <strong>{data.teachersActive.utilizzo.hours_daily_avg} ore
            al giorno</strong> di uso generale, <strong>{data.teachersActive.utilizzo.hours_training_avg} ore per la formazione</strong>,
            e <strong>{data.teachersActive.utilizzo.hours_planning_avg} ore per la pianificazione didattica</strong>.
          </p>
          <p>
            L'elevato tempo dedicato alla formazione dagli insegnanti (6.67 ore) contrasta fortemente con la bassa percezione
            di adeguatezza della formazione ricevuta ({data.teachersActive.impatto.training_adequacy.mean}).
            Questo suggerisce che il problema non è la quantità di tempo investito, ma la <strong>qualità e rilevanza
            della formazione disponibile</strong>.
          </p>
        </div>
      </section>

      {/* Implicazioni e conclusioni */}
      <section className="analysis-section">
        <h3 className="analysis-title">
          <Icons.Lightbulb className="w-5 h-5" />
          Implicazioni e direzioni future
        </h3>
        <div className="analysis-content">
          <h4>1. Urgenza di formazione strutturata e di qualità</h4>
          <p>
            La prima e più evidente implicazione riguarda la necessità di sviluppare programmi formativi sull'IA
            che siano contemporaneamente rigorosi teoricamente e praticamente applicabili. La formazione deve colmare
            il gap tra l'uso intuitivo (in cui gli studenti eccellono) e la comprensione profonda (che manca a entrambi i gruppi).
          </p>

          <h4>2. Sviluppo di pensiero critico sull'IA</h4>
          <p>
            La bassa fiducia degli insegnanti negli studenti ({data.teachersActive.fiducia.trust_students.mean})
            unita all'alto utilizzo degli stessi ({data.students.utilizzo.uses_ai_daily_percentage}%) evidenzia
            la necessità di programmi specifici di alfabetizzazione critica: non solo "come usare l'IA" ma
            "quando, perché e con quali limiti usarla".
          </p>

          <h4>3. Supporto alla comunità docente</h4>
          <p>
            Gli insegnanti si trovano in una posizione paradossale: devono guidare gli studenti in un territorio
            in cui si sentono meno competenti praticamente. È necessario fornire loro non solo formazione,
            ma anche supporto continuo, comunità di pratica, e risorse didattiche già pronte.
          </p>

          <h4>4. Gestione delle preoccupazioni legittime</h4>
          <p>
            Le preoccupazioni degli insegnanti sull'uso dell'IA da parte degli studenti
            ({data.teachersActive.preoccupazioni.concern_ai_students.mean}) non vanno ignorate ma ascoltate
            e tradotte in policy educative. Questi timori riflettono probabilmente rischi reali legati a
            plagio, dipendenza tecnologica, superficialità dell'apprendimento.
          </p>

          <h4>5. Ridefinizione del ruolo docente</h4>
          <p>
            Il gap tra la percezione che l'IA cambierà l'insegnamento in generale ({data.teachersActive.impatto.ai_change_teaching.mean})
            e il proprio insegnamento personale ({data.teachersActive.impatto.ai_change_my_teaching.mean})
            suggerisce che molti insegnanti non hanno ancora elaborato come integrare concretamente l'IA
            nella loro pratica quotidiana. Servono modelli chiari di integrazione pedagogica.
          </p>

          <h4>Conclusione</h4>
          <p>
            I dati dipingono un sistema educativo in transizione, con studenti che adottano rapidamente le nuove
            tecnologie e insegnanti che ne riconoscono il potenziale trasformativo ma si sentono inadeguatamente
            preparati ad accompagnare questo cambiamento. Il divario non è generazionale ma formativo:
            <strong>ciò che manca non è la volontà di cambiare, ma gli strumenti e le competenze per farlo in modo
            consapevole, critico e pedagogicamente efficace</strong>.
          </p>
          <p>
            La strada da percorrere richiede investimenti significativi in formazione di qualità, sviluppo di
            framework pedagogici per l'integrazione dell'IA, e creazione di spazi di sperimentazione sicura
            dove docenti e studenti possano esplorare insieme le potenzialità e i limiti di queste tecnologie.
          </p>
        </div>
      </section>
    </div>
  )
}

export default InterpretativeAnalysis

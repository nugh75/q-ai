import { useState, useEffect } from 'react'
import { Icons } from './Icons'
import DocumentLayout, { Section } from './DocumentLayout'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'

function LikertInterpretation() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [studentsRes, teachersActiveRes, teachersTrainingRes, likertRes] = await Promise.all([
        fetch(`${API_URL}/api/students`),
        fetch(`${API_URL}/api/teachers?include_non_teaching=false`),
        fetch(`${API_URL}/api/teachers?only_non_teaching=true`),
        fetch(`${API_URL}/api/likert-questions`)
      ])

      const students = await studentsRes.json()
      const teachersActive = await teachersActiveRes.json()
      const teachersTraining = await teachersTrainingRes.json()
      const likert = await likertRes.json()

      setData({ students, teachersActive, teachersTraining, likert })
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Caricamento interpretazione...</div>
  }

  if (!data) {
    return <div className="error">Errore nel caricamento dei dati</div>
  }

  // Trova domande specifiche per l'analisi
  const practicalComp = data.likert.questions.find(q => q.column_name === 'practical_competence' && q.respondent_type === 'students')
  const theoreticalComp = data.likert.questions.find(q => q.column_name === 'theoretical_competence' && q.respondent_type === 'students')
  const aiChangeStudy = data.likert.questions.find(q => q.column_name === 'ai_change_study')
  const trainingAdequacy = data.likert.questions.find(q => q.column_name === 'training_adequacy' && q.respondent_type === 'students')
  const trustIntegrationStudents = data.likert.questions.find(q => q.column_name === 'trust_integration' && q.respondent_type === 'students')

  const practicalCompTeachers = data.likert.questions.find(q => q.column_name === 'practical_competence' && q.respondent_type === 'teachers_active')
  const theoreticalCompTeachers = data.likert.questions.find(q => q.column_name === 'theoretical_competence' && q.respondent_type === 'teachers_active')
  const aiChangeTeaching = data.likert.questions.find(q => q.column_name === 'ai_change_teaching')
  const aiChangeMyTeaching = data.likert.questions.find(q => q.column_name === 'ai_change_my_teaching')
  const trainingAdequacyTeachers = data.likert.questions.find(q => q.column_name === 'training_adequacy' && q.respondent_type === 'teachers_active')
  const trustIntegrationTeachers = data.likert.questions.find(q => q.column_name === 'trust_integration' && q.respondent_type === 'teachers_active')
  const trustStudents = data.likert.questions.find(q => q.column_name === 'trust_students')
  const concernAiStudents = data.likert.questions.find(q => q.column_name === 'concern_ai_students')

  return (
    <DocumentLayout
      title="Interpretazione analisi Likert"
      subtitle="Analisi discorsiva delle risposte alle domande sulla scala Likert 1-7"
    >
      <Section id="competenze" title="Le competenze: il divario tra pratica e teoria" icon={Icons.Award}>
          <h4>Il paradosso degli studenti: pratici ma non teorici</h4>
          <p>
            L'analisi delle risposte Likert sulla scala 1-7 rivela un pattern chiaro e significativo tra gli studenti.
            La competenza pratica mostra una <strong>media di {practicalComp?.stats.mean}</strong> con mediana a {practicalComp?.stats.median},
            mentre la competenza teorica si ferma a <strong>media {theoreticalComp?.stats.mean}</strong> (mediana {theoreticalComp?.stats.median}).
          </p>
          <p>
            Questo gap di oltre 1 punto sulla scala Likert non è casuale. La distribuzione della competenza pratica mostra{' '}
            <strong>{practicalComp?.stats.distribution['5']} risposte sul valore 5</strong> e{' '}
            <strong>{practicalComp?.stats.distribution['6']} sul valore 6</strong>, evidenziando una massa critica di studenti
            che si sente confidentemente competente nell'uso pratico. Al contrario, per la teoria vediamo una concentrazione
            sui valori bassi: <strong>{theoreticalComp?.stats.distribution['2']} risposte sul valore 2</strong> e{' '}
            <strong>{theoreticalComp?.stats.distribution['3']} sul valore 3</strong>.
          </p>
          <p>
            Questa divergenza suggerisce un approccio "trial and error" all'apprendimento dell'IA: gli studenti imparano
            usando direttamente gli strumenti, senza passare attraverso una comprensione formale dei principi sottostanti.
            È l'equivalente digitale di chi impara a guidare senza studiare il funzionamento del motore.
          </p>

          <h4>Gli insegnanti: più equilibrati ma comunque deboli</h4>
          <p>
            Gli insegnanti mostrano un pattern diverso ma non meno preoccupante. La competenza pratica raggiunge{' '}
            <strong>media {practicalCompTeachers?.stats.mean}</strong> (mediana {practicalCompTeachers?.stats.median}),
            mentre quella teorica si attesta a <strong>media {theoreticalCompTeachers?.stats.mean}</strong> (mediana {theoreticalCompTeachers?.stats.median}).
            Il gap è minore rispetto agli studenti, ma entrambi i valori rimangono sotto il punto mediano della scala.
          </p>
          <p>
            La distribuzione rivela la problematica: <strong>{practicalCompTeachers?.stats.distribution['2']} insegnanti su {practicalCompTeachers?.stats.total_responses}</strong>{' '}
            si collocano sul valore 2 per la competenza pratica, evidenziando una massa significativa di docenti
            che si sentono inadeguati nell'uso pratico degli strumenti che dovrebbero insegnare a usare criticamente.
          </p>
      </Section>

      <Section id="formazione" title="La formazione inadeguata: un problema trasversale" icon={Icons.Book}>
          <p>
            Uno dei risultati più allarmanti emerge dalla valutazione della formazione ricevuta sull'IA.
            Gli studenti assegnano una <strong>media di {trainingAdequacy?.stats.mean}</strong> (mediana {trainingAdequacy?.stats.median}),
            mentre gli insegnanti danno <strong>media {trainingAdequacyTeachers?.stats.mean}</strong> (mediana {trainingAdequacyTeachers?.stats.median}).
            Entrambi i valori sono significativamente al di sotto del punto mediano (3.5), indicando insoddisfazione diffusa.
          </p>
          <p>
            La distribuzione è ancora più eloquente: <strong>{trainingAdequacy?.stats.distribution['1']} studenti</strong> (
            {((trainingAdequacy?.stats.distribution['1'] / trainingAdequacy?.stats.total_responses) * 100).toFixed(1)}%)
            hanno assegnato il valore minimo (1 = "per nulla adeguata"), così come{' '}
            <strong>{trainingAdequacyTeachers?.stats.distribution['1']} insegnanti</strong> (
            {((trainingAdequacyTeachers?.stats.distribution['1'] / trainingAdequacyTeachers?.stats.total_responses) * 100).toFixed(1)}%).
          </p>
          <p>
            Questo dato è particolarmente critico se confrontato con l'intensità d'uso: l'{data.students.utilizzo.uses_ai_daily_percentage}%
            degli studenti usa l'IA quotidianamente, ma la maggioranza ritiene inadeguata la formazione ricevuta.
            Si configura così uno scenario di <strong>apprendimento informale e non guidato</strong>, con tutti i rischi
            che comporta in termini di uso acritico e superficiale degli strumenti.
          </p>
      </Section>

      <Section id="cambiamento" title="Percezione del cambiamento: il bias della terza persona" icon={Icons.Zap}>
          <h4>Gli insegnanti prevedono una rivoluzione... per gli altri</h4>
          <p>
            Emerge un pattern psicologico interessante dall'analisi delle domande sul cambiamento.
            Quando si chiede quanto l'IA cambierà <em>l'insegnamento in generale</em>, la risposta è nettamente positiva:
            <strong>media {aiChangeTeaching?.stats.mean}</strong> (mediana {aiChangeTeaching?.stats.median}), con{' '}
            <strong>{aiChangeTeaching?.stats.distribution['6']} risposte sul valore 6</strong> e{' '}
            <strong>{aiChangeTeaching?.stats.distribution['7']} sul valore 7</strong>.
          </p>
          <p>
            Ma quando la domanda diventa personale (<em>"quanto cambierà il TUO modo di insegnare?"</em>),
            il valore scende a <strong>media {aiChangeMyTeaching?.stats.mean}</strong> (mediana {aiChangeMyTeaching?.stats.median}).
            Questo gap di quasi 0.8 punti è statisticamente significativo e psicologicamente rivelatore.
          </p>
          <p>
            Si tratta del classico "bias della terza persona": tendiamo a credere che i grandi cambiamenti
            riguarderanno più gli altri che noi stessi. Questo può essere un meccanismo di difesa psicologico
            (il cambiamento fa paura) o può riflettere un'incertezza concreta su <em>come</em> integrare
            l'IA nella propria pratica quotidiana.
          </p>

          <h4>Studenti: aspettative moderate ma diffuse</h4>
          <p>
            Gli studenti mostrano aspettative più moderate sul cambiamento del loro modo di studiare:
            <strong>media {aiChangeStudy?.stats.mean}</strong> (mediana {aiChangeStudy?.stats.median}).
            La distribuzione mostra <strong>{aiChangeStudy?.stats.distribution['5']} risposte sul valore 5</strong> e{' '}
            <strong>{aiChangeStudy?.stats.distribution['6']} sul valore 6</strong>, suggerendo un ottimismo
            cauto ma diffuso: riconoscono che l'IA avrà un impatto, ma non la vedono come rivoluzionaria
            quanto gli insegnanti vedono il suo impatto sull'insegnamento.
          </p>
      </Section>

      <Section id="fiducia" title="Il problema della fiducia: chi guida chi?" icon={Icons.Users}>
          <h4>Studenti più fiduciosi degli insegnanti</h4>
          <p>
            La fiducia nell'integrazione dell'IA nell'istruzione mostra un divario generazionale significativo.
            Gli studenti esprimono <strong>media {trustIntegrationStudents?.stats.mean}</strong> (mediana {trustIntegrationStudents?.stats.median}),
            mentre gli insegnanti si fermano a <strong>media {trustIntegrationTeachers?.stats.mean}</strong> (mediana {trustIntegrationTeachers?.stats.median}).
          </p>
          <p>
            Questo gap di {Math.abs(trustIntegrationStudents?.stats.mean - trustIntegrationTeachers?.stats.mean).toFixed(2)} punti
            è significativo: chi dovrà essere guidato (studenti) è più ottimista di chi dovrà guidare (insegnanti).
            Questa asimmetria può riflettere sia la maggiore familiarità tecnologica dei giovani, sia preoccupazioni
            pedagogiche e professionali degli insegnanti che vedono complessità che gli studenti potrebbero non percepire.
          </p>

          <h4>La scarsa fiducia negli studenti: un dato critico</h4>
          <p>
            Ancora più preoccupante è la scarsa fiducia che gli insegnanti ripongono negli studenti riguardo
            l'uso consapevole dell'IA: <strong>media {trustStudents?.stats.mean}</strong> (mediana {trustStudents?.stats.median}).
            Con <strong>{trustStudents?.stats.distribution['1']} insegnanti su {trustStudents?.stats.total_responses}</strong> (
            {((trustStudents?.stats.distribution['1'] / trustStudents?.stats.total_responses) * 100).toFixed(1)}%)
            che assegnano il valore minimo, emerge chiaramente che gli educatori <strong>non si fidano della capacità
            critica degli studenti nell'uso di questi strumenti</strong>.
          </p>
          <p>
            Messo in relazione con l'utilizzo quotidiano dell'IA da parte dell'{data.students.utilizzo.uses_ai_daily_percentage}%
            degli studenti, questo dato configura uno scenario problematico: uso massivo di strumenti che gli insegnanti
            ritengono gli studenti non siano in grado di gestire criticamente. È come se molti guidassero senza patente,
            sotto gli occhi preoccupati di istruttori che non hanno gli strumenti per intervenire efficacemente.
          </p>
      </Section>

      <Section id="preoccupazioni" title="Preoccupazioni degli insegnanti: fondate o eccessive?" icon={Icons.AlertCircle}>
          <p>
            Le preoccupazioni degli insegnanti sull'uso dell'IA da parte degli studenti sono marcate:
            <strong>media {concernAiStudents?.stats.mean}</strong> (mediana {concernAiStudents?.stats.median}).
            La distribuzione mostra {((parseInt(concernAiStudents?.stats.distribution['5']) +
            parseInt(concernAiStudents?.stats.distribution['6']) +
            parseInt(concernAiStudents?.stats.distribution['7'])) /
            concernAiStudents?.stats.total_responses * 100).toFixed(1)}% di risposte sui valori alti (5-7),
            evidenziando una preoccupazione maggioritaria.
          </p>
          <p>
            Queste preoccupazioni sono probabilmente fondate e riflettono rischi reali:
          </p>
          <ul style={{ marginLeft: '2rem', lineHeight: '1.8' }}>
            <li><strong>Plagio e disonestà accademica</strong>: uso dell'IA per generare compiti senza comprensione</li>
            <li><strong>Superficialità dell'apprendimento</strong>: delega alla macchina del ragionamento critico</li>
            <li><strong>Dipendenza tecnologica</strong>: incapacità di operare senza supporto dell'IA</li>
            <li><strong>Riduzione delle competenze di base</strong>: scrittura, calcolo, problem solving</li>
            <li><strong>Disuguaglianze</strong>: chi ha accesso a strumenti migliori ottiene vantaggi ingiusti</li>
          </ul>
          <p>
            Tuttavia, la bassa fiducia negli studenti ({trustStudents?.stats.mean}) unita alle preoccupazioni elevate
            ({concernAiStudents?.stats.mean}) potrebbe anche indicare un gap comunicativo: forse gli insegnanti
            vedono comportamenti problematici che gli studenti non riconoscono come tali, oppure manca un dialogo
            strutturato su come usare l'IA in modo etico ed efficace.
          </p>
      </Section>

      <Section id="boxplot" title="Leggere i box plot: cosa ci dicono sulla variabilità" icon={Icons.Chart}>
          <h4>Elementi del box plot</h4>
          <p>
            I grafici a scatola (box plot) visualizzati nella sezione grafici mostrano la distribuzione completa
            delle risposte, non solo la media. Ogni box plot contiene:
          </p>
          <ul style={{ marginLeft: '2rem', lineHeight: '1.8' }}>
            <li><strong>Q1 (primo quartile)</strong>: il 25% delle risposte sta sotto questo valore</li>
            <li><strong>Q3 (terzo quartile)</strong>: il 75% delle risposte sta sotto questo valore</li>
            <li><strong>Mediana (linea tratteggiata spessa nel box)</strong>: il valore centrale, divide a metà le risposte</li>
            <li><strong>Media (punto rosso)</strong>: la media aritmetica, influenzata dai valori estremi</li>
            <li><strong>Baffi (whiskers)</strong>: estensione fino ai valori minimi e massimi</li>
          </ul>

          <h4>Cosa rivela l'altezza del box?</h4>
          <p>
            L'<strong>altezza del box</strong> (distanza Q3-Q1) indica la <em>dispersione</em> delle risposte:
          </p>
          <ul style={{ marginLeft: '2rem', lineHeight: '1.8' }}>
            <li><strong>Box stretto</strong>: consenso elevato, risposte concentrate</li>
            <li><strong>Box alto</strong>: opinioni molto diverse, alta variabilità</li>
          </ul>
          <p>
            Per esempio, se la formazione sull'IA ha un box molto alto, significa che mentre alcuni la trovano
            adeguata, altri la trovano completamente inadeguata - non c'è consenso. Se invece la fiducia
            nell'integrazione dell'IA ha un box stretto con mediana alta, significa che la maggioranza concorda
            sul fatto di essere abbastanza fiduciosa.
          </p>

          <h4>Media vs mediana: quando divergono</h4>
          <p>
            Quando il <strong>punto rosso (media) è lontano dalla linea tratteggiata (mediana)</strong>, significa
            che ci sono valori estremi che "tirano" la media in una direzione:
          </p>
          <ul style={{ marginLeft: '2rem', lineHeight: '1.8' }}>
            <li>Media &gt; Mediana: ci sono alcuni valori molto alti che alzano la media</li>
            <li>Media &lt; Mediana: ci sono alcuni valori molto bassi che abbassano la media</li>
          </ul>
          <p>
            In questi casi, la <strong>mediana è più rappresentativa</strong> del "valore tipico" della popolazione,
            perché non è influenzata dagli outlier.
          </p>
      </Section>

      <Section id="sintesi" title="Sintesi e implicazioni" icon={Icons.Lightbulb}>
          <h4>Il quadro emergente</h4>
          <p>
            L'analisi delle risposte Likert dipinge un sistema educativo in transizione disordinata:
          </p>
          <ul style={{ marginLeft: '2rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
            <li><strong>Competenze sbilanciate</strong>: pratica senza teoria, uso senza comprensione</li>
            <li><strong>Formazione inadeguata</strong>: percepita come tale da entrambi i gruppi</li>
            <li><strong>Gap di fiducia</strong>: studenti ottimisti, insegnanti preoccupati e sfiduciati</li>
            <li><strong>Previsioni asimmetriche</strong>: cambiamento previsto per il sistema ma non per sé</li>
            <li><strong>Alta dispersione</strong>: poche opinioni condivise, molte divisioni</li>
          </ul>

          <h4>Cosa fare?</h4>
          <p>
            I dati suggeriscono <strong>tre direzioni prioritarie</strong>:
          </p>
          <ol style={{ marginLeft: '2rem', lineHeight: '1.8' }}>
            <li>
              <strong>Formazione teorico-pratica integrata</strong>: colmare il gap tra uso e comprensione,
              fornendo fondamenti teorici accessibili e casi d'uso pratici autentici
            </li>
            <li>
              <strong>Alfabetizzazione critica</strong>: non solo "come usare l'IA" ma "quando, perché,
              con quali limiti", sviluppando pensiero critico specifico per l'IA
            </li>
            <li>
              <strong>Supporto alla comunità docente</strong>: fornire agli insegnanti non solo formazione
              ma anche comunità di pratica, risorse didattiche pronte, e spazi di sperimentazione sicura
            </li>
          </ol>
          <p>
            Senza interventi strutturati, il rischio è che il divario tra chi usa l'IA acriticamente
            e chi ne comprende potenzialità e limiti si allarghi, creando nuove forme di disuguaglianza
            educativa e culturale.
          </p>
      </Section>
    </DocumentLayout>
  )
}

export default LikertInterpretation

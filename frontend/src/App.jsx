import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Dashboard from './components/Dashboard'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'

function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [importing, setImporting] = useState(false)

  const loadData = useCallback(async (retries = 3) => {
    setLoading(true)

    for (let i = 0; i < retries; i++) {
      try {
        const [students, teachers, comparison, tools] = await Promise.all([
          axios.get(`${API_URL}/api/students`),
          axios.get(`${API_URL}/api/teachers`),
          axios.get(`${API_URL}/api/comparison`),
          axios.get(`${API_URL}/api/tools`)
        ])

        setData({
          students: students.data,
          teachers: teachers.data,
          comparison: comparison.data,
          tools: tools.data
        })
        setLoading(false)
        return
      } catch (err) {
        if (i === retries - 1) {
          setError(`Errore dopo ${retries} tentativi: ${err.message}`)
          setLoading(false)
        } else {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
        }
      }
    }
  }, [])

  const importData = useCallback(async () => {
    setImporting(true)
    try {
      await axios.post(`${API_URL}/api/import`)
      await loadData()
    } catch (err) {
      setError('Errore durante l\'importazione: ' + err.message)
    } finally {
      setImporting(false)
    }
  }, [loadData])

  const checkHealth = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/health`)
      if (response.data.student_responses === 0 && response.data.teacher_responses === 0) {
        // Nessun dato, importiamo automaticamente
        await importData()
      } else {
        await loadData()
      }
    } catch (err) {
      setError('Impossibile connettersi al backend: ' + err.message)
      setLoading(false)
    }
  }, [importData, loadData])

  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  if (loading || importing) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{importing ? 'Importazione dati in corso...' : 'Caricamento...'}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Errore</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Riprova</button>
      </div>
    )
  }

  return (
    <div className="App">
      <Dashboard data={data} onRefresh={loadData} />
    </div>
  )
}

export default App

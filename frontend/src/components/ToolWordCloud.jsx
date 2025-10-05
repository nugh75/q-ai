import { useEffect, useRef, useState } from 'react'

const COLORS = [
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0891b2'
]

function ToolWordCloud({ data, backgroundColor = '#f0f9ff' }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [words, setWords] = useState([])

  useEffect(() => {
    if (!data || data.length === 0) return

    const counts = data.map(item => item.count)
    const minCount = Math.min(...counts)
    const maxCount = Math.max(...counts)

    // Algoritmo word cloud semplificato ma efficace
    const width = 1000
    const height = 600
    const centerX = width / 2
    const centerY = height / 2

    // Calcola dimensione font basata sulla frequenza
    const getFontSize = (count) => {
      const min = 20
      const max = 88
      if (minCount === maxCount) return (min + max) / 2
      return min + ((count - minCount) / (maxCount - minCount)) * (max - min)
    }

    // Stima dimensioni testo
    const measureText = (text, fontSize) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      ctx.font = `bold ${fontSize}px Arial, sans-serif`
      const metrics = ctx.measureText(text)
      return {
        width: metrics.width,
        height: fontSize * 1.2
      }
    }

    // Ordina per frequenza decrescente
    const sortedData = [...data].sort((a, b) => b.count - a.count)
    const placed = []

    // Controlla collisione
    const hasCollision = (x, y, w, h) => {
      const margin = 6
      for (const p of placed) {
        if (!(x + w + margin < p.x || 
              x - margin > p.x + p.width ||
              y + h + margin < p.y || 
              y - margin > p.y + p.height)) {
          return true
        }
      }
      return false
    }

    // Spirale di Archimede per posizionamento
    sortedData.forEach((item, idx) => {
      const fontSize = getFontSize(item.count)
      const { width: textWidth, height: textHeight } = measureText(item.name, fontSize)
      
      let positioned = false
      let angle = 0
      let radius = 0
      const angleStep = 0.3
      const radiusStep = 5
      const maxAttempts = 8000
      const safeMargin = 30

      for (let attempt = 0; attempt < maxAttempts && !positioned; attempt++) {
        angle += angleStep
        radius = radiusStep * Math.sqrt(angle)
        
        const x = centerX + radius * Math.cos(angle) - textWidth / 2
        const y = centerY + radius * Math.sin(angle) * 0.75 - textHeight / 2

        if (x >= safeMargin && x + textWidth <= width - safeMargin && 
            y >= safeMargin && y + textHeight <= height - safeMargin) {
          if (!hasCollision(x, y, textWidth, textHeight)) {
            placed.push({
              text: item.name,
              count: item.count,
              x,
              y,
              width: textWidth,
              height: textHeight,
              fontSize,
              color: COLORS[idx % COLORS.length],
              rotation: (Math.random() > 0.7) ? (Math.random() > 0.5 ? -15 : 15) : 0
            })
            positioned = true
          }
        }
      }
    })

    setWords(placed)
    console.log(`Word Cloud: Positioned ${placed.length}/${data.length} words`)

  }, [data])

  if (!data || data.length === 0) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: '#94a3b8',
        border: '1px dashed #cbd5e1',
        borderRadius: '12px'
      }}>
        Nessun dato disponibile per la word cloud.
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1000px',
        height: '600px',
        margin: '0 auto',
        borderRadius: '24px',
        background: backgroundColor,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        overflow: 'hidden'
      }}
    >
      {words.map((word, idx) => (
        <div
          key={`${word.text}-${idx}`}
          style={{
            position: 'absolute',
            left: `${word.x}px`,
            top: `${word.y}px`,
            fontSize: `${word.fontSize}px`,
            fontWeight: word.fontSize > 50 ? 800 : word.fontSize > 35 ? 700 : 600,
            color: word.color,
            fontFamily: 'Arial, Helvetica, sans-serif',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            cursor: 'default',
            userSelect: 'none',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            transform: `rotate(${word.rotation}deg)`,
            transition: 'transform 0.2s ease',
          }}
          title={`${word.text}: ${word.count} citazioni`}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = `rotate(${word.rotation}deg) scale(1.08)`
            e.currentTarget.style.textShadow = '0 4px 12px rgba(0, 0, 0, 0.25)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = `rotate(${word.rotation}deg) scale(1)`
            e.currentTarget.style.textShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          {word.text}
        </div>
      ))}
    </div>
  )
}

export default ToolWordCloud

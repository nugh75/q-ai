import { useState, useEffect, useRef } from 'react'
import './Dashboard.css'

function DocumentLayout({ children, title, subtitle }) {
  const [activeSection, setActiveSection] = useState('')
  const contentRef = useRef(null)

  useEffect(() => {
    // Extract sections from children
    const handleScroll = () => {
      if (!contentRef.current) return

      const sections = contentRef.current.querySelectorAll('[data-section]')
      let currentSection = ''

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect()
        if (rect.top <= 150 && rect.bottom >= 150) {
          currentSection = section.getAttribute('data-section')
        }
      })

      if (currentSection) {
        setActiveSection(currentSection)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Extract sections from children
  const sections = []
  if (children) {
    const childrenArray = Array.isArray(children) ? children : [children]
    childrenArray.forEach((child) => {
      if (child?.props?.['data-section']) {
        sections.push({
          id: child.props['data-section'],
          title: child.props['data-section-title'] || child.props['data-section']
        })
      }
    })
  }

  const scrollToSection = (sectionId) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`)
    if (element) {
      const yOffset = -80
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <div style={{
      display: 'flex',
      gap: '2rem',
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      {/* Menu laterale */}
      {sections.length > 0 && (
        <aside style={{
          width: '280px',
          flexShrink: 0,
          position: 'sticky',
          top: '2rem',
          alignSelf: 'flex-start',
          maxHeight: 'calc(100vh - 4rem)',
          overflowY: 'auto'
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <h3 style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1rem'
            }}>
              Indice
            </h3>
            <nav>
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    marginBottom: '0.25rem',
                    background: activeSection === section.id ? '#f5f3ff' : 'transparent',
                    border: 'none',
                    borderLeft: activeSection === section.id ? '3px solid #8b5cf6' : '3px solid transparent',
                    color: activeSection === section.id ? '#8b5cf6' : '#64748b',
                    fontSize: '0.9rem',
                    fontWeight: activeSection === section.id ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.background = '#f8fafc'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {index + 1}. {section.title}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      )}

      {/* Contenuto principale */}
      <main
        ref={contentRef}
        style={{
          flex: 1,
          minWidth: 0,
          maxWidth: sections.length > 0 ? '900px' : '1200px'
        }}
      >
        {title && (
          <header style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: '#1e293b' }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#64748b' }}>
                {subtitle}
              </p>
            )}
          </header>
        )}
        {children}
      </main>
    </div>
  )
}

// Componente Section helper
export function Section({ id, title, children, icon: Icon }) {
  return (
    <section
      data-section={id}
      data-section-title={title}
      style={{ marginBottom: '3rem' }}
    >
      {title && (
        <h3 style={{
          fontSize: '1.3rem',
          marginBottom: '1rem',
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {Icon && <Icon className="w-6 h-6" />}
          {title}
        </h3>
      )}
      <div style={{
        fontSize: '0.95rem',
        lineHeight: '1.8',
        color: '#475569'
      }}>
        {children}
      </div>
    </section>
  )
}

export default DocumentLayout

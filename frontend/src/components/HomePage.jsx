import { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Icons } from './Icons';

const HomePage = ({ showHeader = true }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchHomepageContent();
  }, []);

  const fetchHomepageContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:8118/api/homepage');
      setContent(response.data.content);
    } catch (err) {
      console.error('Errore caricamento homepage:', err);
      setError('Impossibile caricare il contenuto della homepage');
    } finally {
      setLoading(false);
    }
  };

  const getMarkdownHTML = () => {
    if (!content) return '';
    const rawHTML = marked.parse(content);
    return DOMPurify.sanitize(rawHTML);
  };

  const handleEdit = () => {
    setEditedContent(content);
    setIsEditing(true);
    setSaveMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent('');
    setSaveMessage(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);
      
      const response = await axios.post('http://localhost:8118/api/homepage', {
        content: editedContent,
        password: 'Lagom129.'
      });

      if (response.data.success) {
        setContent(editedContent);
        setIsEditing(false);
        setSaveMessage({ success: true, text: 'Salvato con successo!' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      console.error('Errore salvataggio:', err);
      setSaveMessage({ 
        success: false, 
        text: 'Errore durante il salvataggio: ' + (err.response?.data?.detail || err.message)
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Caricamento...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={showHeader ? styles.container : styles.containerNoHeader}>
      {isAuthenticated && !isEditing && (
        <div style={styles.editBar}>
          <button style={styles.editButton} onClick={handleEdit}>
            <Icons.Edit className="w-4 h-4" />
            Modifica Contenuto
          </button>
        </div>
      )}

      {saveMessage && (
        <div style={{
          ...styles.saveMessage,
          backgroundColor: saveMessage.success ? '#d1fae5' : '#fee2e2',
          color: saveMessage.success ? '#065f46' : '#991b1b'
        }}>
          {saveMessage.success ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <Icons.Check className="w-5 h-5" />
              {saveMessage.text}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <Icons.Warning className="w-5 h-5" />
              {saveMessage.text}
            </div>
          )}
        </div>
      )}

      {isEditing ? (
        <div style={styles.editor}>
          <div style={styles.editorHeader}>
            <h3 style={styles.editorTitle}>Modifica Homepage</h3>
            <div style={styles.editorButtons}>
              <button 
                style={styles.cancelButton} 
                onClick={handleCancel}
                disabled={saving}
              >
                Annulla
              </button>
              <button 
                style={styles.saveButton} 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvataggio...' : (
                  <>
                    <Icons.Save className="w-4 h-4" />
                    Salva
                  </>
                )}
              </button>
            </div>
          </div>
          <textarea
            style={styles.textarea}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="Scrivi qui il contenuto in formato Markdown..."
          />
          <div style={styles.preview}>
            <h4 style={styles.previewTitle}>Anteprima:</h4>
            <div 
              style={styles.content}
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(editedContent || '')) }}
            />
          </div>
        </div>
      ) : (
        <div 
          style={styles.content}
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: getMarkdownHTML() }}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '40px 20px',
  },
  containerNoHeader: {
    minHeight: 'auto',
    padding: '20px',
  },
  editBar: {
    maxWidth: '900px',
    margin: '0 auto 20px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  editButton: {
    padding: '10px 20px',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  saveMessage: {
    maxWidth: '900px',
    margin: '0 auto 20px',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'center',
  },
  editor: {
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  editorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '2px solid #e2e8f0',
  },
  editorTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  editorButtons: {
    display: 'flex',
    gap: '10px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#64748b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  textarea: {
    width: '100%',
    minHeight: '400px',
    padding: '20px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    lineHeight: '1.6',
    resize: 'vertical',
    boxSizing: 'border-box',
    outline: 'none',
  },
  preview: {
    marginTop: '30px',
    paddingTop: '30px',
    borderTop: '2px solid #e2e8f0',
  },
  previewTitle: {
    margin: '0 0 20px 0',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#475569',
  },
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: 'white',
    padding: '60px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    lineHeight: '1.7',
    fontSize: '1.063rem',
    color: '#475569',
  },
  loading: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#64748b',
    padding: '60px 20px',
  },
  error: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#ef4444',
    padding: '60px 20px',
    backgroundColor: '#fee',
    borderRadius: '8px',
    maxWidth: '600px',
    margin: '0 auto',
  },
};

// Aggiungi stili CSS inline per il contenuto Markdown
const markdownStyles = `
  .markdown-content h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 1.5rem;
    border-bottom: 3px solid #3b82f6;
    padding-bottom: 0.5rem;
  }
  
  .markdown-content h2 {
    font-size: 1.875rem;
    font-weight: 600;
    color: #334155;
    margin-top: 2.5rem;
    margin-bottom: 1rem;
  }
  
  .markdown-content h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #475569;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
  }
  
  .markdown-content p {
    margin-bottom: 1rem;
    line-height: 1.75;
  }
  
  .markdown-content ul, .markdown-content ol {
    margin-bottom: 1.5rem;
    padding-left: 2rem;
  }
  
  .markdown-content li {
    margin-bottom: 0.5rem;
  }
  
  .markdown-content strong {
    font-weight: 600;
    color: #1e293b;
  }
  
  .markdown-content em {
    font-style: italic;
    color: #64748b;
  }
  
  .markdown-content hr {
    border: none;
    border-top: 2px solid #e2e8f0;
    margin: 2rem 0;
  }
`;

// Aggiungi gli stili al documento
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = markdownStyles;
  if (!document.head.querySelector('style[data-markdown-styles]')) {
    styleEl.setAttribute('data-markdown-styles', 'true');
    document.head.appendChild(styleEl);
  }
}

export default HomePage;

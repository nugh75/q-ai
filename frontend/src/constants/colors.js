// Schema colori fisso per tutte le visualizzazioni
export const CATEGORY_COLORS = {
  students: '#3b82f6',              // Blu - Studenti
  teachers_all: '#8b5cf6',          // Viola/Purple - Insegnanti Totali
  teachers_active: '#10b981',       // Verde/Emerald - Insegnanti in Servizio
  teachers_training: '#f59e0b',     // Arancione/Amber - Insegnanti Non in Servizio
};

// Colori più scuri per hover/bordi
export const CATEGORY_COLORS_DARK = {
  students: '#1e40af',              // Studenti (dark)
  teachers_all: '#6d28d9',          // Insegnanti Totali (dark)
  teachers_active: '#059669',       // Insegnanti in Servizio (dark)
  teachers_training: '#d97706',     // Insegnanti Non in Servizio (dark)
};

// Etichette per le categorie
export const CATEGORY_LABELS = {
  students: 'Studenti',
  teachers_all: 'Insegnanti Totali',
  teachers_active: 'Insegnanti in Servizio',  // Attualmente insegnano
  teachers_training: 'Insegnanti Non in Servizio',  // Non insegnano attualmente
};

// Mapping per backend API
export const TEACHER_FILTER_PARAMS = {
  teachers_all: { include_non_teaching: true },
  teachers_active: { include_non_teaching: false },
  teachers_training: { only_non_teaching: true },
};

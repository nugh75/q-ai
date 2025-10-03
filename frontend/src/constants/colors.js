// Schema colori fisso per tutte le visualizzazioni
export const CATEGORY_COLORS = {
  students: '#3b82f6',              // Blu
  teachers_all: '#8b5cf6',          // Viola/Purple
  teachers_active: '#10b981',       // Verde/Emerald
  teachers_training: '#f59e0b',     // Arancione/Amber
};

// Colori più scuri per hover/bordi
export const CATEGORY_COLORS_DARK = {
  students: '#1e40af',
  teachers_all: '#6d28d9',
  teachers_active: '#059669',
  teachers_training: '#d97706',
};

// Etichette per le categorie
export const CATEGORY_LABELS = {
  students: 'Studenti',
  teachers_all: 'Insegnanti Totali',
  teachers_active: 'Insegnanti Attivi',
  teachers_training: 'Insegnanti in Formazione',
};

// Mapping per backend API
export const TEACHER_FILTER_PARAMS = {
  teachers_all: { include_non_teaching: true },
  teachers_active: { include_non_teaching: false },
  teachers_training: { only_non_teaching: true },
};

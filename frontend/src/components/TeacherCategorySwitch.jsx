import { CATEGORY_COLORS, CATEGORY_LABELS } from '../constants/colors';
import { Icons } from './Icons';

const TeacherCategorySwitch = ({ selectedCategory, onCategoryChange }) => {
  const categories = [
    { value: 'teachers_all', icon: Icons.Overview, count: '(455)' },
    { value: 'teachers_active', icon: Icons.Teacher, count: '(356)' },
    { value: 'teachers_training', icon: Icons.Student, count: '(99)' }
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '16px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: '600',
        color: '#475569',
        marginRight: '12px'
      }}>
        <Icons.Filter className="w-5 h-5" />
        Categoria Insegnanti:
      </div>

      {categories.map(({ value, icon: Icon, count }) => (
        <button
          key={value}
          onClick={() => onCategoryChange(value)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: selectedCategory === value ? `2px solid ${CATEGORY_COLORS[value]}` : '2px solid transparent',
            backgroundColor: selectedCategory === value ? CATEGORY_COLORS[value] : 'white',
            color: selectedCategory === value ? 'white' : '#64748b',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.95em',
            fontWeight: selectedCategory === value ? '600' : 'normal',
            transition: 'all 0.2s',
            boxShadow: selectedCategory === value ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <Icon className="w-4 h-4" />
          {CATEGORY_LABELS[value]}
          <span style={{ fontSize: '0.85em', opacity: 0.8 }}>{count}</span>
        </button>
      ))}
    </div>
  );
};

export default TeacherCategorySwitch;

import { useEffect, useState } from 'react';
import { useWeeklyGoalStore } from '../../store/weeklyGoalStore';
import { Target, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';

export const PastWeeklyGoals = () => {
  const { allGoals, loadAllGoals } = useWeeklyGoalStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAllGoals();
    }
  }, [isOpen, loadAllGoals]);

  // Filter out the current week if needed, but since it asks for "previous weeks", 
  // it might be nice to just show anything that is not the current week's goal
  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const pastGoals = allGoals.filter(goal => goal.week_start !== currentWeekStart && goal.text.trim().length > 0);

  return (
    <div style={{ marginBottom: '2rem' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex-between"
        style={{ 
          width: '100%', 
          padding: '1rem 1.5rem', 
          backgroundColor: 'var(--bg-app)', 
          border: '1px solid var(--border-color)', 
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: '1rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Target size={20} color="var(--accent-secondary)" />
          <span>Past Weekly Intentions</span>
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pastGoals.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
              No past intentions found.
            </div>
          ) : (
            pastGoals.map(goal => {
              const weekStartDate = parseISO(goal.week_start);
              const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
              
              return (
                <div key={goal.id} className="animated-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-secondary)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Week of {format(weekStartDate, 'MMMM d, yyyy')}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {format(weekStartDate, 'MMM d')} - {format(weekEndDate, 'MMM d, yyyy')}
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>
                    {goal.text}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

import { useEffect, useState } from 'react';
import { useWeeklyGoalStore } from '../../store/weeklyGoalStore';
import { Target, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getBiWeeklyPeriod } from '../../utils/dateUtils';

export const PastWeeklyGoals = () => {
  const { allGoals, loadAllGoals } = useWeeklyGoalStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAllGoals();
    }
  }, [isOpen, loadAllGoals]);

  // Filter out the current phase if needed
  const { periodStart: currentPeriodStart } = getBiWeeklyPeriod(new Date());
  const currentPhaseStartStr = format(currentPeriodStart, 'yyyy-MM-dd');
  const pastGoals = allGoals.filter(goal => 
    goal && 
    goal.week_start && 
    goal.week_start !== currentPhaseStartStr && 
    String(goal.text || '').trim().length > 0
  );

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
          <span>Past Phase Intentions</span>
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
              if (!goal.week_start) return null;
              
              const phaseStartDate = parseISO(goal.week_start);
              if (isNaN(phaseStartDate.getTime())) return null; // Prevent crash on invalid date
              
              const { periodEnd: phaseEndDate } = getBiWeeklyPeriod(phaseStartDate);
              
              return (
                <div key={goal.id} className="animated-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-secondary)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Phase of {format(phaseStartDate, 'MMMM d, yyyy')}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {format(phaseStartDate, 'MMM d')} - {format(phaseEndDate, 'MMM d, yyyy')}
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

import { useEffect, useMemo } from 'react';
import { useHabitStore } from '../../store/habitStore';
import { Target } from 'lucide-react';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export const WeeklyHabitGoals = () => {
  const { habits, logs, loadHabits } = useHabitStore();

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const weeklyGoals = useMemo(() => {
    const activeHabitsWithGoals = habits.filter(h => !h.archived && h.weekly_target !== undefined && h.weekly_target > 0);
    if (activeHabitsWithGoals.length === 0) return [];

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    return activeHabitsWithGoals.map(habit => {
      const habitLogs = logs.filter(l => 
        l.habit_id === habit.id && 
        isWithinInterval(new Date(l.date + 'T12:00:00'), { start: weekStart, end: weekEnd })
      );

      let currentProgress = 0;
      if (habit.type === 'count') {
        currentProgress = habitLogs.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
      } else {
        // boolean or timer
        currentProgress = habitLogs.filter(l => Number(l.value) > 0).length;
      }

      const target = habit.weekly_target || 1;
      const percent = Math.min(100, Math.round((currentProgress / target) * 100));

      return {
        habit,
        currentProgress,
        target,
        percent
      };
    });
  }, [habits, logs]);

  if (weeklyGoals.length === 0) {
    return (
      <div className="animated-card" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          <Target size={24} color="var(--text-muted)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Active Weekly Goals</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No weekly goals set yet. Go to the Habits tab and edit a habit to set a weekly target!
        </p>
      </div>
    );
  }

  return (
    <div className="animated-card" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid var(--accent-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
        <Target size={24} color="var(--accent-primary)" />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Active Weekly Goals</h2>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {weeklyGoals.map(({ habit, currentProgress, target, percent }) => (
          <div key={habit.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{habit.name}</span>
              <span style={{ color: percent >= 100 ? 'var(--accent-success)' : 'var(--text-secondary)', fontWeight: percent >= 100 ? 600 : 500 }}>
                {currentProgress} / {target} {habit.type === 'count' ? habit.unit || '' : 'days'}
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  backgroundColor: percent >= 100 ? 'var(--accent-success)' : 'var(--accent-primary)',
                  width: `${percent}%`,
                  transition: 'width 0.4s ease-out'
                }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

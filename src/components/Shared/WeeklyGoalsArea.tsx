import { useEffect, useState, useRef } from 'react';
import { useWeeklyGoalStore } from '../../store/weeklyGoalStore';
import { Target, Save, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { getBiWeeklyPeriod } from '../../utils/dateUtils';

export const WeeklyGoalsArea = ({ currentDate = new Date() }: { currentDate?: Date }) => {
  const { currentGoal, loadGoal, saveGoal } = useWeeklyGoalStore();
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  const [viewDate, setViewDate] = useState<Date>(currentDate);
  useEffect(() => {
    setViewDate(currentDate);
  }, [currentDate]);

  const { periodStart, periodEnd } = getBiWeeklyPeriod(viewDate);

  const handlePrevPhase = () => setViewDate(subDays(periodStart, 1));
  const handleNextPhase = () => setViewDate(addDays(periodEnd, 1));

  const weekStartStr = format(periodStart, 'yyyy-MM-dd');
  const seededWeekRef = useRef<string | null>(null);

  // Use a stable date string for dependencies to prevent infinite render loops
  // if currentDate is a new Date() object on every render
  const dateStr = format(viewDate, 'yyyy-MM-dd');

  useEffect(() => {
    loadGoal(new Date(dateStr + 'T12:00:00'));
  }, [dateStr, loadGoal]);

  useEffect(() => {
    if (seededWeekRef.current !== weekStartStr) {
      if (!currentGoal || currentGoal.week_start === weekStartStr) {
        setText(currentGoal?.text || '');
        seededWeekRef.current = weekStartStr;
      }
    }
  }, [currentGoal, weekStartStr]);

  const handleSave = async (manual = false) => {
    if (text !== currentGoal?.text) {
      setIsSaving(true);
      await saveGoal(viewDate, text);
      setIsSaving(false);
      
      if (manual) {
        setShowSaved(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setShowSaved(false), 2000);
      }
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  return (
    <div className="animated-card" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid var(--accent-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
          <Target size={24} color="var(--accent-primary)" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={handlePrevPhase} title="Previous Phase" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '0.1rem' }}>
                <ChevronLeft size={18} />
              </button>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Phase Intentions</h2>
              <button onClick={handleNextPhase} title="Next Phase" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '0.1rem' }}>
                <ChevronRight size={18} />
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem', textAlign: 'center' }}>
              {format(periodStart, 'MMM d')} - {format(periodEnd, 'MMM d, yyyy')}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isSaving && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saving...</span>}
          {showSaved && <span style={{ fontSize: '0.75rem', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Check size={14} /> Saved</span>}
          <button 
            type="button"
            onClick={() => handleSave(true)}
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Save size={16} /> Save
          </button>
        </div>
      </div>
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        placeholder="Write out your goals, intentions, or focuses for this phase here..."
        rows={5}
        style={{
          width: '100%',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-app)',
          color: 'var(--text-primary)',
          fontSize: '1rem',
          resize: 'vertical',
          fontFamily: 'inherit',
          lineHeight: '1.6'
        }}
      />
    </div>
  );
};

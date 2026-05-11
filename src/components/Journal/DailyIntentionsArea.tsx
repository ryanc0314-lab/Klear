import { useEffect, useState, useRef } from 'react';
import { useDailyIntentionStore } from '../../store/dailyIntentionStore';
import { Target, Save, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';

export const DailyIntentionsArea = ({ currentDate }: { currentDate?: Date }) => {
  const { currentIntention, loadIntention, saveIntention } = useDailyIntentionStore();
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  const [viewDate, setViewDate] = useState<Date>(currentDate || new Date());
  
  useEffect(() => {
    if (currentDate) {
      setViewDate(currentDate);
    }
  }, [currentDate?.getTime()]);

  const handlePrevDay = () => setViewDate(subDays(viewDate, 1));
  const handleNextDay = () => setViewDate(addDays(viewDate, 1));

  const dateStr = format(viewDate, 'yyyy-MM-dd');

  useEffect(() => {
    loadIntention(new Date(dateStr + 'T12:00:00'));
  }, [dateStr, loadIntention]);

  useEffect(() => {
    if (currentIntention && currentIntention.date === dateStr) {
      setText(currentIntention.text || '');
    } else {
      setText('');
    }
  }, [currentIntention, dateStr]);

  const isSavingRef = useRef(false);

  const handleSave = async (manual = false) => {
    if (manual) {
      setShowSaved(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setShowSaved(false), 2000);
    }

    if (text === currentIntention?.text || isSavingRef.current) return;
    
    isSavingRef.current = true;
    setIsSaving(true);
    
    try {
      await saveIntention(viewDate, text);
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  };

  const handleBlur = () => {
    handleSave(false);
  };

  return (
    <div className="animated-card" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid var(--accent-secondary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
          <Target size={24} color="var(--accent-secondary)" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={handlePrevDay} title="Previous Day" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '0.1rem' }}>
                <ChevronLeft size={18} />
              </button>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Daily Intention</h2>
              <button onClick={handleNextDay} title="Next Day" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '0.1rem' }}>
                <ChevronRight size={18} />
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem', textAlign: 'center' }}>
              {format(viewDate, 'EEEE, MMM d, yyyy')}
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
        placeholder="What is your main intention for today?"
        rows={3}
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

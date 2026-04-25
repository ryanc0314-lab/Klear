import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const BacklogView = () => {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    supabase.from('weekly_goals').select('*').eq('week_start', 'BACKLOG').then(({ data, error }) => {
       if (!error && data && data.length > 0) {
         setText(data[0].text);
       }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus('idle');
    try {
      const { data, error: fetchErr } = await supabase.from('weekly_goals').select('*').eq('week_start', 'BACKLOG');
      
      if (fetchErr) throw fetchErr;

      if (data && data.length > 0) {
         const { error } = await supabase.from('weekly_goals').update({ text }).eq('id', data[0].id);
         if (error) throw error;
      } else {
         const { error } = await supabase.from('weekly_goals').insert({ id: uuidv4(), week_start: 'BACKLOG', text });
         if (error) throw error;
      }
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (e) {
      console.error('Failed to save backlog:', e);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
       <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Unassigned Task Backlog</h3>
       <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
         Use this space to jot down untriaged ideas or tasks before they make it into a specific project or day.
       </p>
       <textarea 
         value={text} 
         onChange={e => setText(e.target.value)} 
         placeholder="Type your unstructured backlog here..."
         style={{ 
           width: '100%', 
           height: '400px', 
           padding: '1rem', 
           borderRadius: 'var(--radius-md)', 
           border: '1px solid var(--border-color)', 
           backgroundColor: 'var(--bg-app)', 
           color: 'var(--text-primary)', 
           resize: 'vertical',
           outline: 'none',
           fontSize: '1rem',
           fontFamily: 'inherit'
         }}
       />
       <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', alignItems: 'center', gap: '1rem' }}>
          {status === 'saved' && <span style={{ color: 'var(--accent-success)', fontSize: '0.875rem' }}>Saved!</span>}
          {status === 'error' && <span style={{ color: 'var(--accent-danger)', fontSize: '0.875rem' }}>Error saving!</span>}
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Backlog'}
          </button>
       </div>
    </div>
  );
};

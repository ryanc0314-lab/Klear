import { useEffect, useState, useMemo } from 'react';
import { useJournalStore } from '../../store/journalStore';
import { FileText, Save, Tag, Trash2, Moon, Calendar as CalIcon, Pencil, Check, X } from 'lucide-react';
import { format, isThisWeek, isThisMonth, isThisYear } from 'date-fns';
import { WeeklyGoalsArea } from '../Shared/WeeklyGoalsArea';
import { PastWeeklyGoals } from '../Shared/PastWeeklyGoals';
import { DailyIntentionsArea } from './DailyIntentionsArea';

export const JournalDashboard = () => {
  const { entries, loadEntries, addEntry, updateEntry, deleteEntry } = useJournalStore();
  const [newEntryText, setNewEntryText] = useState('');
  const [mood, setMood] = useState<number>(0);
  const [anxiety, setAnxiety] = useState<number>(0);
  const [tagInput, setTagInput] = useState('');
  
  // Sleep States
  const [sleepQuality, setSleepQuality] = useState<number>(0);
  const [sleepHours, setSleepHours] = useState<number | ''>('');
  const [sleepStart, setSleepStart] = useState('');
  const [sleepEnd, setSleepEnd] = useState('');
  const [sleepNotes, setSleepNotes] = useState('');

  // Edit States
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editEntryText, setEditEntryText] = useState('');
  const [editMood, setEditMood] = useState<number>(0);
  const [editAnxiety, setEditAnxiety] = useState<number>(0);
  const [editTagInput, setEditTagInput] = useState('');
  const [editSleepQuality, setEditSleepQuality] = useState<number>(0);
  const [editSleepHours, setEditSleepHours] = useState<number | ''>('');
  const [editSleepStart, setEditSleepStart] = useState('');
  const [editSleepEnd, setEditSleepEnd] = useState('');
  const [editSleepNotes, setEditSleepNotes] = useState('');
  
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year' | 'all'>('all');

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    if (timeFilter === 'all') return entries;
    return entries.filter(entry => {
       const date = new Date(entry.date);
       if (timeFilter === 'week') return isThisWeek(date, { weekStartsOn: 1 });
       if (timeFilter === 'month') return isThisMonth(date);
       if (timeFilter === 'year') return isThisYear(date);
       return true;
    });
  }, [entries, timeFilter]);

  useEffect(() => {
    if (sleepStart && sleepEnd) {
      const [startHs, startMs] = sleepStart.split(':').map(Number);
      const [endHs, endMs] = sleepEnd.split(':').map(Number);
      
      let startTotal = startHs + startMs / 60;
      let endTotal = endHs + endMs / 60;
      
      // If end time is before start time, assume they slept through midnight
      if (endTotal <= startTotal) {
        endTotal += 24;
      }
      
      // Calculate and round to 1 decimal place (e.g. 7.5 hours)
      const diff = endTotal - startTotal;
      setSleepHours(Number(diff.toFixed(1)));
    }
  }, [sleepStart, sleepEnd]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryText.trim()) return;
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    addEntry(
      newEntryText.trim(), 
      mood === 0 ? undefined : mood, 
      anxiety === 0 ? undefined : anxiety, 
      tags, 
      sleepQuality === 0 ? undefined : sleepQuality, 
      sleepHours === '' ? undefined : Number(sleepHours), 
      sleepStart || undefined, 
      sleepEnd || undefined, 
      sleepNotes.trim() || undefined
    );
    setNewEntryText('');
    setTagInput('');
    setMood(0);
    setAnxiety(0);
    setSleepQuality(0);
    setSleepHours('');
    setSleepStart('');
    setSleepEnd('');
    setSleepNotes('');
  };

  const handleEditStart = (entry: any) => {
    setEditingEntryId(entry.id);
    setEditEntryText(entry.text);
    setEditMood(entry.mood ?? 0);
    setEditAnxiety(entry.anxiety ?? 0);
    setEditTagInput(entry.tags ? entry.tags.join(', ') : '');
    setEditSleepQuality(entry.sleep_quality ?? 0);
    setEditSleepHours(entry.sleep_hours ?? '');
    setEditSleepStart(entry.sleep_start ?? '');
    setEditSleepEnd(entry.sleep_end ?? '');
    setEditSleepNotes(entry.sleep_notes ?? '');
  };

  const handleEditSave = async (id: string) => {
    if (!editEntryText.trim()) return;
    const tags = editTagInput.split(',').map(t => t.trim()).filter(Boolean);
    await updateEntry(id, {
      text: editEntryText.trim(),
      mood: editMood === 0 ? undefined : editMood,
      anxiety: editAnxiety === 0 ? undefined : editAnxiety,
      tags,
      sleep_quality: editSleepQuality === 0 ? undefined : editSleepQuality,
      sleep_hours: editSleepHours === '' ? undefined : Number(editSleepHours),
      sleep_start: editSleepStart || undefined,
      sleep_end: editSleepEnd || undefined,
      sleep_notes: editSleepNotes.trim() || undefined
    });
    setEditingEntryId(null);
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Journal</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Log your thoughts, mood, and daily reflections.</p>
      </div>

      <DailyIntentionsArea />
      <WeeklyGoalsArea />
      <PastWeeklyGoals />

      <div className="animated-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <textarea
            value={newEntryText}
            onChange={(e) => setNewEntryText(e.target.value)}
            placeholder="What's on your mind today?"
            rows={4}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            
            {/* Metadata Card */}
            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <Tag size={18} /> Journal Context
              </div>
              
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Mood</label>
                  <select 
                    value={mood} 
                    onChange={(e) => setMood(Number(e.target.value))}
                    style={{ padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}
                  >
                    <option value={0}>- Skip -</option>
                    <option value={1}>1 - Terrible</option>
                    <option value={2}>2 - Bad</option>
                    <option value={3}>3 - Okay</option>
                    <option value={4}>4 - Good</option>
                    <option value={5}>5 - Awesome</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Anxiety</label>
                  <select 
                    value={anxiety} 
                    onChange={(e) => setAnxiety(Number(e.target.value))}
                    style={{ padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}
                  >
                    <option value={0}>- Skip -</option>
                    <option value={1}>1 - None</option>
                    <option value={2}>2 - Low</option>
                    <option value={3}>3 - Moderate</option>
                    <option value={4}>4 - High</option>
                    <option value={5}>5 - Severe</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Tags</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g. work, exercise, reading (comma separated)"
                  style={{ padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', width: '100%', outline: 'none' }}
                />
              </div>
            </div>

            {/* Sleep Tracking Card */}
            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                <Moon size={18} /> Sleep Details
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Quality</label>
                  <select 
                    value={sleepQuality} 
                    onChange={(e) => setSleepQuality(Number(e.target.value))}
                    style={{ padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}
                  >
                    <option value={0}>- Skip -</option>
                    <option value={1}>1 - Terrible</option>
                    <option value={2}>2 - Bad</option>
                    <option value={3}>3 - Okay</option>
                    <option value={4}>4 - Good</option>
                    <option value={5}>5 - Excellent</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Hours (Est.)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={sleepHours} 
                    onChange={(e) => setSleepHours(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 7.5"
                    style={{ padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>From Time</label>
                  <input 
                    type="time" 
                    value={sleepStart} 
                    onChange={(e) => setSleepStart(e.target.value)}
                    style={{ padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', cursor: 'text' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>To Time</label>
                  <input 
                    type="time" 
                    value={sleepEnd} 
                    onChange={(e) => setSleepEnd(e.target.value)}
                    style={{ padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', cursor: 'text' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Sleep Notes</label>
                <input 
                  type="text" 
                  value={sleepNotes} 
                  onChange={(e) => setSleepNotes(e.target.value)}
                  placeholder="e.g. Restless, woke up frequently"
                  style={{ padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', width: '100%', outline: 'none' }}
                />
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', fontSize: '1.125rem', fontWeight: 'bold' }}>
              <Save size={20} /> Record Journal Entry
            </button>
          </div>
        </form>
      </div>

      <div className="flex-between" style={{ marginBottom: '1.5rem', marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalIcon size={24} color="var(--accent-primary)" /> Past Entries
        </h2>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as any)}
          style={{ padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none', fontWeight: 500 }}
        >
          <option value="all">All Time</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {filteredEntries.map(entry => (
          <div key={entry.id} className="animated-card" style={{ padding: '1.5rem' }}>
            {editingEntryId === entry.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <textarea
                  value={editEntryText}
                  onChange={(e) => setEditEntryText(e.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '1rem', resize: 'vertical', fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '120px' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Mood</label>
                    <select value={editMood} onChange={(e) => setEditMood(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                      <option value={0}>- Skip -</option>
                      {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '120px' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Anxiety</label>
                    <select value={editAnxiety} onChange={(e) => setEditAnxiety(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                      <option value={0}>- Skip -</option>
                      {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 2, minWidth: '200px' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Tags</label>
                    <input type="text" value={editTagInput} onChange={(e) => setEditTagInput(e.target.value)} placeholder="comma separated" style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Sleep Quality</label>
                    <select value={editSleepQuality} onChange={(e) => setEditSleepQuality(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                      <option value={0}>- Skip -</option>
                      {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Hours</label>
                    <input type="number" step="0.5" value={editSleepHours} onChange={(e) => setEditSleepHours(e.target.value === '' ? '' : Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Notes</label>
                    <input type="text" value={editSleepNotes} onChange={(e) => setEditSleepNotes(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                  <button onClick={() => setEditingEntryId(null)} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)' }}>
                    <X size={16} /> Cancel
                  </button>
                  <button onClick={() => handleEditSave(entry.id)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={16} /> Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <FileText size={16} />
                    {format(entry.date, 'EEEE, MMMM d, yyyy - h:mm a')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {entry.mood !== undefined && (
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', backgroundColor: 'var(--bg-card-hover)', fontWeight: 600, fontSize: '0.875rem', color: entry.mood > 3 ? 'var(--accent-success)' : entry.mood < 3 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                        Mood: {entry.mood}/5
                      </span>
                    )}
                    {entry.anxiety !== undefined && (
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', backgroundColor: 'var(--bg-card-hover)', fontWeight: 600, fontSize: '0.875rem', color: entry.anxiety > 3 ? 'var(--accent-danger)' : entry.anxiety < 3 ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
                        Anxiety: {entry.anxiety}/5
                      </span>
                    )}
                    <button onClick={() => handleEditStart(entry)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => deleteEntry(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)', opacity: 0.7, padding: '0.25rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', marginTop: '1rem' }}>{entry.text}</p>
                
                {(entry.sleep_quality || entry.sleep_hours || entry.sleep_notes) && (
                  <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'var(--bg-app)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '0.875rem' }}>
                      <Moon size={16} /> <strong>Sleep Tracker</strong>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {entry.sleep_quality !== undefined && (
                        <span>Quality: <strong style={{color: entry.sleep_quality > 3 ? 'var(--accent-success)' : entry.sleep_quality < 3 ? 'var(--accent-danger)' : 'var(--text-primary)'}}>{entry.sleep_quality}/5</strong></span>
                      )}
                      {entry.sleep_hours !== undefined && (
                        <span>Logged Hours: <strong>{entry.sleep_hours}h</strong></span>
                      )}
                      {entry.sleep_start && entry.sleep_end && (
                        <span>Time: <strong>{entry.sleep_start} - {entry.sleep_end}</strong></span>
                      )}
                    </div>
                    {entry.sleep_notes && <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.25rem' }}>"{entry.sleep_notes}"</div>}
                  </div>
                )}

                {entry.tags && entry.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                    {entry.tags.map((tag, i) => (
                      <span key={i} style={{ padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-app)', color: 'var(--accent-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {filteredEntries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No journal entries found for this time period.
          </div>
        )}
      </div>
    </div>
  );
};

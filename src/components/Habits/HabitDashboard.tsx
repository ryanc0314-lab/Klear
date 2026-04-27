import { useEffect, useState, useMemo } from 'react';
import { useHabitStore } from '../../store/habitStore';
import { Plus, Check, Flame, Trash2, Undo, Circle, CheckCircle2, ChevronDown, ChevronUp, Archive, Calendar, Pencil, X } from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';
import { format, subDays, startOfWeek, addDays, subWeeks, isToday, differenceInDays } from 'date-fns';
import { type Habit, type HabitLog } from '../../db/database';
import { HabitTagEditor, type HabitTag } from './HabitTagEditor';
import { WeeklyGoalsArea } from '../Shared/WeeklyGoalsArea';
import { getBiWeeklyPeriod } from '../../utils/dateUtils';

const HabitCard = ({ habit, logs, selectedDate, setSelectedDate, isArchived, availableTags }: { habit: Habit, logs: HabitLog[], selectedDate: string, setSelectedDate: (d: string) => void, isArchived: boolean, availableTags: HabitTag[] }) => {
  const { archiveHabit, restoreHabit, deleteHabit, logHabit, updateHabit } = useHabitStore();
  const [value, setValue] = useState<string>('');
  const [showArchive, setShowArchive] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const [editTarget, setEditTarget] = useState<number | ''>(habit.target || '');
  const [editUnit, setEditUnit] = useState(habit.unit || '');
  const [editTags, setEditTags] = useState<HabitTag[]>(habit.tags || []);

  const targetLog = logs.find(l => l.date === selectedDate);

  useEffect(() => {
    if (habit.type === 'count' && targetLog) {
      setValue(targetLog.value.toString());
    } else {
      setValue('');
    }
  }, [habit.type, targetLog, selectedDate]);

  const handleLog = () => {
    if (habit.type === 'count' && value) {
      logHabit(habit.id, new Date(selectedDate + 'T12:00:00'), Number(value));
    }
  };

  const handleToggle = () => {
    const newVal = targetLog?.value ? 0 : 1;
    logHabit(habit.id, new Date(selectedDate + 'T12:00:00'), newVal);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    updateHabit(habit.id, {
      name: editName.trim(),
      target: editTarget === '' ? undefined : Number(editTarget),
      unit: editUnit.trim() || undefined,
      tags: editTags
    });
    setIsEditing(false);
  };

  const handleSoftDelete = () => {
    if (window.confirm('Are you sure you want to archive this habit?')) {
      archiveHabit(habit.id);
    }
  };
  
  const handleHardDelete = () => {
    if (window.confirm('Are you sure you want to PERMANENTLY delete this habit AND all its history? This cannot be undone.')) {
      deleteHabit(habit.id);
    }
  };

  // Prepare Line Chart Data
  const lineData = useMemo(() => {
    if (habit.type !== 'count') return [];
    
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const log = logs.find(l => l.date === d);
      data.push({
        x: format(subDays(new Date(), i), 'yyyy-MM-dd'),
        y: log ? log.value : 0
      });
    }
    
    return [{
      id: habit.name,
      color: 'var(--accent-primary)',
      data
    }];
  }, [logs, habit]);

  const { periodStart: currentPeriodStart, periodEnd: currentPeriodEnd } = getBiWeeklyPeriod(new Date(selectedDate + 'T12:00:00'));

  const renderPeriodRow = (periodStart: Date, periodEnd: Date) => {
    const length = differenceInDays(periodEnd, periodStart) + 1;
    const days = Array.from({ length }).map((_, i) => addDays(periodStart, i));
    
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${length}, 1fr)`, gap: '0.5rem', textAlign: 'center' }}>
        {days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayLog = logs.find(l => l.date === dayStr);
          const isCompleted = dayLog && dayLog.value > 0;
          const isSelected = dayStr === selectedDate;
          
          return (
            <div 
              key={dayStr} 
              onClick={() => setSelectedDate(dayStr)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              title={`Switch date to ${format(day, 'MMM dd, yyyy')}`}
            >
              <div 
                style={{ 
                  color: isCompleted ? 'var(--accent-success)' : (isSelected ? 'var(--text-primary)' : 'var(--text-muted)'),
                  transition: 'all 0.2s',
                  transform: isCompleted ? 'scale(1.1)' : 'scale(1)',
                  opacity: isSelected ? 1 : 0.7
                }}
              >
                {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="animated-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', opacity: isArchived ? 0.7 : 1 }}>
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <input 
            type="text" 
            value={editName} 
            onChange={e => setEditName(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
          />
          {habit.type === 'count' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="number" 
                placeholder="Target"
                value={editTarget} 
                onChange={e => setEditTarget(e.target.value ? Number(e.target.value) : '')}
                style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
              />
              <input 
                type="text" 
                placeholder="Unit"
                value={editUnit} 
                onChange={e => setEditUnit(e.target.value)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
          )}
          
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Tags</label>
            <HabitTagEditor tags={editTags} onChange={setEditTags} availableTags={availableTags} />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><X size={16} /> Cancel</button>
            <button onClick={handleSaveEdit} style={{ background: 'none', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Check size={16} /> Save</button>
          </div>
        </div>
      ) : (
        <div className="flex-between">
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{habit.name}</h3>
            {habit.tags && habit.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                {habit.tags.map(tag => (
                  <span key={tag.id} style={{
                    padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: `${tag.color}15`,
                    color: tag.color, fontSize: '0.7rem', border: `1px solid ${tag.color}30`, fontWeight: 600
                  }}>
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
            {habit.type === 'count' && habit.target !== undefined && habit.target > 0 && (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Goal: {habit.target} {habit.unit || ''}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {!isArchived && (
              <>
                <div style={{ display: 'flex', gap: '0.25rem', color: 'var(--accent-secondary)' }}>
                  <Flame size={20} />
                </div>
                <button 
                  onClick={() => setIsEditing(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  title="Edit Habit"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={handleSoftDelete}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  title="Archive Habit"
                >
                  <Archive size={18} />
                </button>
              </>
            )}
            {isArchived && (
              <>
                <button 
                  onClick={() => restoreHabit(habit.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)' }}
                  title="Restore Habit"
                >
                  <Undo size={18} />
                </button>
                <button 
                  onClick={handleHardDelete}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)' }}
                  title="Permanently Delete"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      {!isArchived && !isEditing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {habit.type === 'boolean' ? (
            <button 
              onClick={handleToggle}
              className={`btn ${targetLog?.value ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ flex: 1, gap: '0.5rem', backgroundColor: targetLog?.value ? 'var(--accent-success)' : undefined }}
            >
              {targetLog?.value ? <><Check size={18} /> Done</> : <><Undo size={18} /> Mark Done</>}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <input 
                type="number" 
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Value (${habit.unit || 'count'})...`} 
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)'
                }} 
              />
              <button onClick={handleLog} className="btn btn-primary">Log</button>
            </div>
          )}
        </div>
      )}

      {habit.type === 'count' && !isArchived && (
        <div style={{ height: '150px', marginTop: '1rem' }}>
          <ResponsiveLine
            data={lineData}
            margin={{ top: 10, right: 10, bottom: 60, left: 30 }}
            xScale={{ type: 'time', format: '%Y-%m-%d', precision: 'day' }}
            yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
            xFormat="time:%Y-%m-%d"
            curve="monotoneX"
            axisTop={null}
            axisRight={null}
            axisBottom={{ format: '%b %d', tickSize: 5, tickPadding: 5, tickRotation: -45, tickValues: 'every 3 days' }}
            axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
            enableGridX={false}
            gridYValues={3}
            pointSize={6}
            colors={['var(--accent-primary)']}
            theme={{
              axis: { ticks: { text: { fill: 'var(--text-secondary)', fontSize: 10 } } },
              grid: { line: { stroke: 'var(--border-color)' } }
            }}
          />
        </div>
      )}

      {/* Current Phase Tracker */}
      {!isArchived && (
        <div style={{ marginTop: '1rem', backgroundColor: 'var(--bg-card-hover)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${differenceInDays(currentPeriodEnd, currentPeriodStart) + 1}, 1fr)`, gap: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
            {Array.from({ length: differenceInDays(currentPeriodEnd, currentPeriodStart) + 1 }).map((_, i) => addDays(currentPeriodStart, i)).map(d => (
              <div key={d.toISOString()} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{format(d, 'EEE').toUpperCase()}</div>
            ))}
          </div>
          {renderPeriodRow(currentPeriodStart, currentPeriodEnd)}
        </div>
      )}

      {/* Archive Section */}
      {!isArchived && (
        <div style={{ marginTop: '0.5rem' }}>
          <button 
            onClick={() => setShowArchive(!showArchive)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', padding: '0.5rem 0' }}
          >
            {showArchive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showArchive ? 'Hide Archive' : 'View Previous Phases'}
          </button>
          
          {showArchive && (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
              {[1, 2, 3, 4].map(phasesAgo => {
                let d = new Date(currentPeriodStart);
                for(let i=0; i<phasesAgo; i++) { d = subDays(d, 3); d = getBiWeeklyPeriod(d).periodStart; }
                const { periodStart: prevPeriodStart, periodEnd: prevPeriodEnd } = getBiWeeklyPeriod(d);
                return (
                  <div key={phasesAgo} style={{ opacity: 0.8 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Phase {format(prevPeriodStart, 'MMM dd')} - {format(prevPeriodEnd, 'MMM dd')}
                    </div>
                    {renderPeriodRow(prevPeriodStart, prevPeriodEnd)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const HabitDashboard = () => {
  const { habits, logs, loadHabits, addHabit, clearArchivedHabits } = useHabitStore();
  
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitType, setNewHabitType] = useState<'boolean' | 'count'>('boolean');
  const [newHabitUnit, setNewHabitUnit] = useState('');
  const [newHabitTarget, setNewHabitTarget] = useState<number | ''>('');
  const [newHabitTags, setNewHabitTags] = useState<HabitTag[]>([]);
  const [filterTag, setFilterTag] = useState<string>('all');

  const allUniqueTags = useMemo(() => {
    const map = new Map<string, HabitTag>();
    habits.forEach(h => {
      (h.tags || []).forEach(t => {
        if (!map.has(t.name.toLowerCase())) map.set(t.name.toLowerCase(), t);
      });
    });
    return Array.from(map.values());
  }, [habits]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    addHabit(
      newHabitName.trim(), 
      newHabitType, 
      newHabitTarget === '' ? undefined : newHabitTarget, 
      undefined, // skip weekly_target legacy
      newHabitUnit.trim(),
      newHabitTags
    );
    setNewHabitName('');
    setNewHabitUnit('');
    setNewHabitTarget('');
    setNewHabitTags([]);
  };
  
  const handleClearArchive = () => {
    if (window.confirm('Are you sure you want to permanently erase all archived habits and their historical data?')) {
      clearArchivedHabits();
    }
  };

  const activeHabits = habits.filter(h => !h.archived);
  const archivedHabits = habits.filter(h => !!h.archived);
  
  const displayHabits = (activeTab === 'active' ? activeHabits : archivedHabits)
    .filter(h => filterTag === 'all' ? true : h.tags?.some(t => t.id === filterTag));

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Habits</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track your daily routines and visualize your consistency.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-card)', padding: '0.5rem', borderRadius: 'var(--radius-lg)' }}>
          <button 
            className={`btn ${activeTab === 'active' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('active')}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'active' ? '' : 'transparent', color: activeTab === 'active' ? '' : 'var(--text-secondary)' }}
          >
            Active
          </button>
          <button 
            className={`btn ${activeTab === 'archive' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('archive')}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'archive' ? '' : 'transparent', color: activeTab === 'archive' ? '' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Archive size={16} /> Archive
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--bg-card)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} color="var(--accent-primary)" />
          <span style={{ fontWeight: 600 }}>Viewing Date:</span>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
          />
          {!isToday(new Date(selectedDate + 'T12:00:00')) && (
            <button 
              onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
              style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 1rem', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Jump to Today
            </button>
          )}
        </div>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Filter by Tag:</span>
          <select 
            value={filterTag}
            onChange={e => setFilterTag(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">All Tags</option>
            {allUniqueTags.map(tag => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {activeTab === 'active' && <WeeklyGoalsArea currentDate={new Date(selectedDate + 'T12:00:00')} />}

      {activeTab === 'active' && (
        <div className="animated-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="New habit name..."
              style={{
                flex: 2,
                minWidth: '200px',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
            <select 
              value={newHabitType} 
              onChange={(e) => setNewHabitType(e.target.value as 'boolean' | 'count')}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            >
              <option value="boolean">Yes/No</option>
              <option value="count">Numeric Count</option>
            </select>
            {newHabitType === 'count' && (
              <>
                <input
                  type="number"
                  value={newHabitTarget}
                  onChange={(e) => setNewHabitTarget(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Target (Optional)"
                  min={1}
                  style={{
                    flex: 1,
                    minWidth: '100px',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem'
                  }}
                />
                <input
                  type="text"
                  value={newHabitUnit}
                  onChange={(e) => setNewHabitUnit(e.target.value)}
                  placeholder="Unit (e.g., Pages)"
                  style={{
                    flex: 1,
                    minWidth: '100px',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem'
                  }}
                />
              </>
            )}
            <div style={{ width: '100%', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Initial Tags (Optional)</label>
              <HabitTagEditor tags={newHabitTags} onChange={setNewHabitTags} availableTags={allUniqueTags} />
            </div>
            
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                <Plus size={18} /> Add Habit
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'archive' && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
           <button onClick={handleClearArchive} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff4d4f', border: '1px solid #ff4d4f' }}>
             <Trash2 size={16} /> Delete All Archived Habits
           </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {displayHabits.map(habit => (
          <HabitCard 
            key={habit.id} 
            habit={habit} 
            logs={logs.filter(l => l.habit_id === habit.id)} 
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            isArchived={!!habit.archived}
            availableTags={allUniqueTags}
          />
        ))}
        {(activeTab === 'active' && displayHabits.length === 0) && (
          <div style={{ padding: '3rem', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>
            {filterTag !== 'all' ? 'No active habits found with this tag.' : 'No active habits found. Target a new habit above!'}
          </div>
        )}
        {(activeTab === 'archive' && displayHabits.length === 0) && (
          <div style={{ padding: '3rem', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>Archive is empty.</div>
        )}
      </div>
    </div>
  );
};

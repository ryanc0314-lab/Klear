import { useEffect, useState, useMemo } from 'react';
import { useWorkoutStore } from '../../store/workoutStore';
import { Plus, Dumbbell, Calendar as CalIcon, Trash2, ChevronDown, ChevronUp, Pencil, Check, BarChart3, X, Copy } from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const WorkoutDashboard = () => {
  const { workouts, workoutSets, loadWorkouts, addWorkout, deleteWorkout, updateWorkout, loadWorkoutSets, addWorkoutSet, deleteWorkoutSet, updateWorkoutSet, workoutPlans, loadPlans, savePlan } = useWorkoutStore();
  const [activeTab, setActiveTab] = useState<'log' | 'plan' | 'stats'>('log');
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [newWorkoutDate, setNewWorkoutDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Expanded workout ID
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Edit Workout
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editWorkoutName, setEditWorkoutName] = useState('');
  const [editWorkoutDate, setEditWorkoutDate] = useState('');

  // Edit WorkoutSet
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [copyWorkoutId, setCopyWorkoutId] = useState<string | null>(null);
  const [editSetName, setEditSetName] = useState('');
  const [editSetDetails, setEditSetDetails] = useState<{reps: number|''; weight: number|''; duration: number|''; duration_unit?: 'min'|'sec'; completed?: boolean}[]>([]);
  const [editSetRest, setEditSetRest] = useState<number | ''>('');
  const [editSetNotes, setEditSetNotes] = useState('');

  // New exercise form state
  const [exName, setExName] = useState('');
  const [exSetsList, setExSetsList] = useState<{reps: number|'', weight: number|'', duration: number|'', duration_unit?: 'min'|'sec'}[]>([{ reps: 10, weight: '', duration: '', duration_unit: 'min'}]);
  const [exRest, setExRest] = useState<number | ''>('');
  const [exNotes, setExNotes] = useState('');

  useEffect(() => {
    loadWorkouts();
    loadPlans();
  }, [loadWorkouts, loadPlans]);

  useEffect(() => {
    if (expandedId) {
      loadWorkoutSets(expandedId);
    }
  }, [expandedId, loadWorkoutSets]);

  const handleAddWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkoutName.trim() || !newWorkoutDate) return;
    const dateObj = new Date(newWorkoutDate + 'T12:00:00');
    addWorkout(newWorkoutName.trim(), dateObj);
    setNewWorkoutName('');
    setNewWorkoutDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleCopyToPlan = async (workoutId: string, workoutName: string, targetDayIdx: number) => {
    const { data: rawSetsList } = await supabase.from('workout_sets').select('*').eq('workout_id', workoutId);
    const rawSets = rawSetsList || [];
    const formattedExercises = rawSets.map(s => {
       return {
         name: s.exercise_name,
         targetSets: s.sets || 1,
         targetReps: s.reps || undefined,
         targetWeight: s.weight || undefined,
         targetDuration: s.duration || undefined,
         targetRest: s.rest_time || undefined,
         notes: s.notes || undefined,
         set_details: s.set_details ? s.set_details.map((d: any) => ({
           reps: d.reps || undefined,
           weight: d.weight || undefined,
           duration: d.duration || undefined,
           duration_unit: d.duration_unit || undefined
         })) : undefined
       };
    });

    savePlan(targetDayIdx, workoutName, formattedExercises);
    setCopyWorkoutId(null);
  };

  const startEditWorkout = (w: any) => {
    setEditingWorkoutId(w.id);
    setEditWorkoutName(w.name);
    setEditWorkoutDate(format(w.date, 'yyyy-MM-dd'));
  };

  const saveWorkoutEdit = () => {
    if (!editWorkoutName.trim() || !editingWorkoutId) return;
    updateWorkout(editingWorkoutId, {
      name: editWorkoutName.trim(),
      date: new Date(editWorkoutDate + 'T12:00:00')
    });
    setEditingWorkoutId(null);
  };

  const cancelWorkoutEdit = () => setEditingWorkoutId(null);

  const handleLogPlannedRoutine = async (category: string, exercises: any[]) => {
    if (exercises.length === 0) return;
    const workoutName = category.trim() || 'Planned Routine';
    const newWorkoutId = await addWorkout(workoutName, new Date());
    
    for (const ex of exercises) {
      let sets = ex.targetSets || 1;
      let setDetails: any[] = [];
      let mainReps = ex.targetReps || 0;
      let mainWeight = ex.targetWeight || 0;
      let mainDuration = ex.targetDuration || undefined;

      if (ex.set_details && ex.set_details.length > 0) {
        sets = ex.set_details.length;
        mainReps = ex.set_details[0].reps || 0;
        mainWeight = ex.set_details[0].weight || 0;
        mainDuration = ex.set_details[0].duration || undefined;
        setDetails = ex.set_details.map((d: any) => ({
          reps: d.reps || undefined,
          weight: d.weight || undefined,
          duration: d.duration || undefined,
          duration_unit: d.duration_unit || undefined,
          completed: false
        }));
      } else {
        setDetails = Array.from({ length: sets }).map(() => ({
          reps: ex.targetReps || undefined,
          weight: ex.targetWeight || undefined,
          duration: ex.targetDuration || undefined,
          duration_unit: ex.targetDurationUnit || undefined,
          completed: false
        }));
      }

      await addWorkoutSet(newWorkoutId, {
        exercise_name: ex.name,
        sets,
        reps: mainReps,
        weight: mainWeight,
        duration: mainDuration,
        rest_time: ex.targetRest || undefined,
        notes: ex.notes || undefined,
        set_details: setDetails
      });
    }

    setActiveTab('log');
    setExpandedId(newWorkoutId);
  };

  const startEditSet = (s: any) => {
    setEditingSetId(s.id);
    setEditSetName(s.exercise_name);
    if (s.set_details && s.set_details.length > 0) {
      setEditSetDetails(s.set_details.map((d: any) => ({
        reps: d.reps || '',
        weight: d.weight || '',
        duration: d.duration || '',
        duration_unit: d.duration_unit || 'min',
        completed: d.completed
      })));
    } else {
      setEditSetDetails([{ reps: s.reps || '', weight: s.weight || '', duration: s.duration || '', duration_unit: s.duration_unit || 'min', completed: false }]);
    }
    setEditSetRest(s.rest_time || '');
    setEditSetNotes(s.notes || '');
  };

  const saveSetEdit = (workoutId: string) => {
    if (!editSetName.trim() || !editingSetId) return;
    updateWorkoutSet(editingSetId, workoutId, {
       exercise_name: editSetName.trim(),
       sets: editSetDetails.length,
       reps: Number(editSetDetails[0]?.reps) || 0,
       weight: Number(editSetDetails[0]?.weight) || 0,
       duration: Number(editSetDetails[0]?.duration) || undefined,
       rest_time: Number(editSetRest) || undefined,
       notes: editSetNotes.trim() || undefined,
       set_details: editSetDetails.map(d => ({
         reps: Number(d.reps) || undefined,
         weight: Number(d.weight) || undefined,
         duration: Number(d.duration) || undefined,
         duration_unit: d.duration_unit || undefined,
         completed: d.completed
       }))
    });
    setEditingSetId(null);
  };

  const cancelSetEdit = () => setEditingSetId(null);

  const toggleSetCompletion = (set: any, workoutId: string, idx: number) => {
    let newDetails: any[] = [];
    if (set.set_details && set.set_details.length > 0) {
      newDetails = [...set.set_details];
    } else {
      newDetails = Array.from({ length: set.sets > 0 ? set.sets : 1 }).map(() => ({
          reps: set.reps,
          weight: set.weight,
          duration: set.duration,
          duration_unit: set.duration_unit,
          completed: false
      }));
    }
    
    if (!newDetails[idx]) return;
    newDetails[idx] = { ...newDetails[idx], completed: !newDetails[idx].completed };
    updateWorkoutSet(set.id, workoutId, { set_details: newDetails });
  };

  const handleAddExercise = (workoutId: string) => {
    if (!exName.trim()) return;
    addWorkoutSet(workoutId, {
      exercise_name: exName.trim(),
      sets: exSetsList.length,
      reps: Number(exSetsList[0].reps) || 0,
      weight: Number(exSetsList[0].weight) || 0,
      duration: Number(exSetsList[0].duration) || undefined,
      rest_time: Number(exRest) || undefined,
      notes: exNotes.trim() || undefined,
      set_details: exSetsList.map(s => ({
        reps: Number(s.reps) || undefined,
        weight: Number(s.weight) || undefined,
        duration: Number(s.duration) || undefined,
        duration_unit: s.duration_unit || undefined,
        completed: false
      }))
    });
    setExName('');
    setExSetsList([{ reps: 10, weight: '', duration: '', duration_unit: 'min' }]);
    setExRest('');
    setExNotes('');
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Workouts</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Log routines, plan schedules, and track history.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-card)', padding: '0.5rem', borderRadius: 'var(--radius-lg)' }}>
          <button 
            className={`btn ${activeTab === 'log' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('log')}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'log' ? '' : 'transparent', color: activeTab === 'log' ? '' : 'var(--text-secondary)' }}
          >
            Log
          </button>
          <button 
            className={`btn ${activeTab === 'plan' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('plan')}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'plan' ? '' : 'transparent', color: activeTab === 'plan' ? '' : 'var(--text-secondary)' }}
          >
            Planner
          </button>
          <button 
            className={`btn ${activeTab === 'stats' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('stats')}
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: activeTab === 'stats' ? '' : 'transparent', color: activeTab === 'stats' ? '' : 'var(--text-secondary)' }}
          >
            <BarChart3 size={16} /> Stats
          </button>
        </div>
      </div>

      {activeTab === 'log' && (
        <>
          <div className="animated-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <form onSubmit={handleAddWorkout} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="text" value={newWorkoutName} onChange={(e) => setNewWorkoutName(e.target.value)} placeholder="e.g. Push Day, 5K Run..." style={{ flex: 1, minWidth: '200px', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '1rem' }} />
              <input type="date" value={newWorkoutDate} onChange={(e) => setNewWorkoutDate(e.target.value)} style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '1rem' }} />
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} /> Log Session
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {workouts?.map(workout => (
              <div key={workout.id} className="animated-card" style={{ padding: '1.5rem' }}>
                {editingWorkoutId === workout.id ? (
                  <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input type="text" value={editWorkoutName} onChange={e => setEditWorkoutName(e.target.value)} style={{ flex: 1, minWidth: '200px', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }} />
                    <input type="date" value={editWorkoutDate} onChange={e => setEditWorkoutDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }} />
                    <button onClick={saveWorkoutEdit} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Save</button>
                    <button onClick={cancelWorkoutEdit} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>Cancel</button>
                  </div>
                ) : (
                  <div className="flex-between">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                        <Dumbbell size={20} color="var(--accent-primary)" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{workout.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                          <CalIcon size={14} /> {format(workout.date, 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
                      <button onClick={() => setCopyWorkoutId(copyWorkoutId === workout.id ? null : workout.id)} style={{ padding: '0.5rem', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Copy to Plan...">
                        <Copy size={20} />
                      </button>
                      {copyWorkoutId === workout.id && (
                        <div style={{ position: 'absolute', top: '100%', right: '50%', zIndex: 10, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.25rem 0.5rem', fontWeight: 600 }}>Copy to Plan...</div>
                          {DAYS_OF_WEEK.map((day, idx) => (
                            <button key={day} onClick={() => handleCopyToPlan(workout.id, workout.name, idx)} style={{ padding: '0.25rem 0.5rem', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}>
                              {day}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <button onClick={() => startEditWorkout(workout)} style={{ padding: '0.5rem', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <Pencil size={20} />
                      </button>
                      <button onClick={() => setExpandedId(expandedId === workout.id ? null : workout.id)} style={{ padding: '0.5rem', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        {expandedId === workout.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      <button onClick={() => deleteWorkout(workout.id)} style={{ padding: '0.5rem', color: '#ff4d4f', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                )}

                {expandedId === workout.id && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      {workoutSets[workout.id]?.map(set => (
                        <div key={set.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', flexDirection: 'column', gap: '0.25rem' }}>
                          {editingSetId === set.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              <input type="text" placeholder="Exercise Name" value={editSetName} onChange={e => setEditSetName(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }} />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                                {editSetDetails.map((setInfo, idx) => (
                                   <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                     <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', minWidth: '40px' }}>Set {idx + 1}</span>
                                     <input type="number" placeholder="Reps" value={setInfo.reps} onChange={e => {
                                       const newL = [...editSetDetails];
                                       newL[idx].reps = e.target.value ? Number(e.target.value) : '';
                                       setEditSetDetails(newL);
                                     }} style={{ flex: 1, minWidth: '60px', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }} title="Reps" />
                                     <input type="number" placeholder="Lbs" value={setInfo.weight} onChange={e => {
                                       const newL = [...editSetDetails];
                                       newL[idx].weight = e.target.value ? Number(e.target.value) : '';
                                       setEditSetDetails(newL);
                                     }} style={{ flex: 1, minWidth: '60px', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }} title="Lbs" />
                                     <div style={{ display: 'flex', flex: 1.5, minWidth: '110px' }}>
                                       <input type="number" placeholder="Dur" value={setInfo.duration} onChange={e => {
                                         const newL = [...editSetDetails];
                                         newL[idx].duration = e.target.value ? Number(e.target.value) : '';
                                         setEditSetDetails(newL);
                                       }} style={{ flex: 1, minWidth: 0, padding: '0.5rem', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', border: '1px solid var(--border-color)', borderRight: 'none', background: 'var(--bg-app)', color: 'var(--text-primary)' }} title="Duration" />
                                       <select value={setInfo.duration_unit || 'min'} onChange={e => {
                                         const newL = [...editSetDetails];
                                         newL[idx] = { ...newL[idx], duration_unit: e.target.value as 'min'|'sec' };
                                         setEditSetDetails(newL);
                                       }} style={{ width: '50px', padding: '0.5rem 0.25rem', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                         <option value="min">m</option><option value="sec">s</option>
                                       </select>
                                     </div>
                                     <button onClick={() => {
                                       if (editSetDetails.length > 1) {
                                         setEditSetDetails(editSetDetails.filter((_, i) => i !== idx));
                                       }
                                     }} style={{ padding: '0.25rem', color: editSetDetails.length > 1 ? '#ff4d4f' : 'transparent', background: 'transparent', border: 'none', cursor: editSetDetails.length > 1 ? 'pointer' : 'default', pointerEvents: editSetDetails.length > 1 ? 'auto' : 'none' }}>
                                       <X size={16} />
                                     </button>
                                   </div>
                                ))}
                                <button onClick={() => {
                                   const last = editSetDetails[editSetDetails.length - 1];
                                   setEditSetDetails([...editSetDetails, { ...last }]);
                                }} style={{ alignSelf: 'center', padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '0.25rem' }}>+ Add Set</button>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="number" placeholder="Rest (sec)" value={editSetRest} onChange={e => setEditSetRest(e.target.value ? Number(e.target.value) : '')} style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }} title="Rest Time (sec)" />
                                <input type="text" placeholder="Notes" value={editSetNotes} onChange={e => setEditSetNotes(e.target.value)} style={{ flex: 2, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button onClick={cancelSetEdit} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>Cancel</button>
                                <button onClick={() => saveSetEdit(workout.id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Save</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: '1rem' }}>{set.exercise_name}</strong>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button onClick={() => startEditSet(set)} style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                    <Pencil size={16} />
                                  </button>
                                  <button onClick={() => deleteWorkoutSet(set.id, workout.id)} style={{ color: '#ff4d4f', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                              {(() => {
                                const details = (set.set_details && set.set_details.length > 0) 
                                  ? set.set_details 
                                  : Array.from({ length: set.sets > 0 ? set.sets : 1 }).map(() => ({
                                      reps: set.reps,
                                      weight: set.weight,
                                      duration: set.duration,
                                      duration_unit: set.duration_unit,
                                      completed: false
                                    }));
                                
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', backgroundColor: 'rgba(0,0,0,0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                                    {details.map((detail, idx) => (
                                      <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', opacity: detail.completed ? 0.6 : 1 }}>
                                        <span style={{ fontWeight: 600, minWidth: '40px', color: 'var(--text-primary)' }}>Set {idx + 1}</span>
                                        {detail.reps ? <span>{detail.reps} reps</span> : null}
                                        {detail.weight ? <span>{detail.weight} lbs</span> : null}
                                        {detail.duration ? <span>{detail.duration} {detail.duration_unit || 'min'}s</span> : null}
                                        <div style={{ flex: 1 }} />
                                        <button 
                                          onClick={() => toggleSetCompletion(set, workout.id, idx)}
                                          style={{
                                            padding: '0.25rem 0.5rem', 
                                            borderRadius: 'var(--radius-sm)',
                                            border: `1px solid ${detail.completed ? 'var(--accent-success)' : 'var(--border-color)'}`,
                                            background: detail.completed ? 'var(--accent-success)' : 'transparent',
                                            color: detail.completed ? 'white' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem'
                                          }}>
                                          {detail.completed ? <><Check size={14} /> Done</> : 'Mark Done'}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                              <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                {set.rest_time ? <span>⏳ {set.rest_time}s Rest</span> : null}
                                {set.notes && <span style={{ fontStyle: 'italic' }}>{set.notes}</span>}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {(!workoutSets[workout.id] || workoutSets[workout.id].length === 0) && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No exercises logged yet.</p>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Log Exercise</h4>
                      <input type="text" placeholder="Exercise Name" value={exName} onChange={e => setExName(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }} />
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'rgba(0,0,0,0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        {exSetsList.map((setInfo, idx) => (
                           <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                             <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', minWidth: '40px' }}>Set {idx + 1}</span>
                             <input type="number" placeholder="Reps" value={setInfo.reps} onChange={e => {
                               const newL = [...exSetsList];
                               newL[idx].reps = e.target.value ? Number(e.target.value) : '';
                               setExSetsList(newL);
                             }} style={{ flex: 1, minWidth: '60px', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }} title="Reps" />
                             
                             <input type="number" placeholder="Lbs" value={setInfo.weight} onChange={e => {
                               const newL = [...exSetsList];
                               newL[idx].weight = e.target.value ? Number(e.target.value) : '';
                               setExSetsList(newL);
                             }} style={{ flex: 1, minWidth: '60px', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }} title="Lbs" />
                             
                             <div style={{ display: 'flex', flex: 1.5, minWidth: '110px' }}>
                               <input type="number" placeholder="Dur" value={setInfo.duration} onChange={e => {
                                 const newL = [...exSetsList];
                                 newL[idx].duration = e.target.value ? Number(e.target.value) : '';
                                 setExSetsList(newL);
                               }} style={{ flex: 1, minWidth: 0, padding: '0.5rem', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', border: '1px solid var(--border-color)', borderRight: 'none', background: 'var(--bg-app)', color: 'var(--text-primary)' }} title="Duration" />
                               <select value={setInfo.duration_unit || 'min'} onChange={e => {
                                 const newL = [...exSetsList];
                                 newL[idx] = { ...newL[idx], duration_unit: e.target.value as 'min'|'sec' };
                                 setExSetsList(newL);
                               }} style={{ width: '50px', padding: '0.5rem 0.25rem', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                 <option value="min">m</option><option value="sec">s</option>
                               </select>
                             </div>
                             
                             <button onClick={() => {
                               if (exSetsList.length > 1) {
                                 setExSetsList(exSetsList.filter((_, i) => i !== idx));
                               }
                             }} style={{ padding: '0.25rem', color: exSetsList.length > 1 ? '#ff4d4f' : 'transparent', background: 'transparent', border: 'none', cursor: exSetsList.length > 1 ? 'pointer' : 'default', pointerEvents: exSetsList.length > 1 ? 'auto' : 'none' }}>
                               <X size={16} />
                             </button>
                           </div>
                        ))}
                        <button onClick={() => {
                           const last = exSetsList[exSetsList.length - 1];
                           setExSetsList([...exSetsList, { ...last }]);
                        }} style={{ alignSelf: 'center', padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '0.25rem' }}>+ Add Set</button>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="number" placeholder="Rest (sec)" value={exRest} onChange={e => setExRest(e.target.value ? Number(e.target.value) : '')} style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }} title="Rest Time (sec)" />
                        <input type="text" placeholder="Notes (e.g. felt easy)" value={exNotes} onChange={e => setExNotes(e.target.value)} style={{ flex: 2, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }} />
                      </div>

                      <button onClick={() => handleAddExercise(workout.id)} className="btn btn-primary" style={{ padding: '0.75rem', justifyContent: 'center' }}>
                        Add to Log
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'plan' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {DAYS_OF_WEEK.map((day, index) => {
            const plan = workoutPlans.find(p => p.day_of_week === index);
            return <PlannerCard key={day} dayOfWeek={index} dayName={day} plan={plan} onSave={savePlan} onLogRoutine={handleLogPlannedRoutine} />;
          })}
        </div>
      )}

      {activeTab === 'stats' && <StatsTab />}
    </div>
  );
};

// ==========================================
// Subcomponents
// ==========================================

const StatsTab = () => {
  const [allSets, setAllSets] = useState<any[]>([]);
  const [selectedEx, setSelectedEx] = useState('');

  useEffect(() => {
    supabase.from('workout_sets').select('*').then(({ data: sets }) => {
      supabase.from('workouts').select('*').then(({ data: workouts }) => {
        if (!sets || !workouts) return;
        const wMap = new Map(workouts.map(w => [w.id, w.date]));
        const joined = sets.map(s => ({ ...s, date: wMap.get(s.workout_id) })).filter(s => s.date);
        joined.sort((a,b) => a.date!.getTime() - b.date!.getTime());
        setAllSets(joined);
      });
    });
  }, []);

  const exercises = Array.from(new Set(allSets.map(s => s.exercise_name))).sort();

  const activeMetricData = useMemo(() => {
    if (!selectedEx) return { weightLine: [], repsLine: [], durationLine: [] };
    const sets = allSets.filter(s => s.exercise_name === selectedEx);
    
    const byDate = new Map();
    sets.forEach(s => {
       const dStr = format(s.date, 'MMM dd');
       if (!byDate.has(dStr)) byDate.set(dStr, { weight: [], reps: [], duration: [] });
       
       if (s.set_details && s.set_details.length > 0) {
         s.set_details.forEach((d: any) => {
           if (d.weight) byDate.get(dStr).weight.push(d.weight);
           if (d.reps) byDate.get(dStr).reps.push(d.reps);
           if (d.duration) byDate.get(dStr).duration.push(d.duration);
         });
       } else {
         if (s.weight) byDate.get(dStr).weight.push(s.weight);
         if (s.reps && s.sets) byDate.get(dStr).reps.push(s.reps * s.sets);
         else if (s.reps) byDate.get(dStr).reps.push(s.reps);
         if (s.duration) byDate.get(dStr).duration.push(s.duration);
       }
    });
    
    const weightData: any[] = [];
    const repsData: any[] = [];
    const durationData: any[] = [];
    Array.from(byDate.entries()).forEach(([d, metrics]) => {
       if (metrics.weight.length) weightData.push({ x: d, y: Math.max(...metrics.weight) });
       if (metrics.reps.length) repsData.push({ x: d, y: metrics.reps.reduce((a:any,b:any)=>a+b, 0) });
       if (metrics.duration.length) durationData.push({ x: d, y: metrics.duration.reduce((a:any,b:any)=>a+b, 0) });
    });
    
    const weightLine = [
      { id: 'Max Weight', color: 'var(--accent-primary)', data: weightData },
    ].filter(s => s.data.length > 0);

    const durationLine = [
      { id: 'Total Duration', color: 'var(--accent-warning)', data: durationData }
    ].filter(s => s.data.length > 0);

    const repsLine = [
      { id: 'Total Reps/Vol', color: 'var(--accent-success)', data: repsData },
    ].filter(s => s.data.length > 0);

    return { weightLine, durationLine, repsLine };
  }, [selectedEx, allSets]);

  return (
    <div className="animated-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Exercise Progress History</h3>
      
      <select 
        value={selectedEx} 
        onChange={e => setSelectedEx(e.target.value)}
        style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', marginBottom: '2rem', maxWidth: '300px' }}
      >
        <option value="">Select an exercise...</option>
        {exercises.map(e => <option key={e} value={e}>{e}</option>)}
      </select>

      {selectedEx && (activeMetricData.weightLine.length > 0 || activeMetricData.repsLine.length > 0 || activeMetricData.durationLine.length > 0) ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          {activeMetricData.weightLine.length > 0 && (
            <div style={{ height: '350px' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Max Weight Logic</h4>
              {activeMetricData.weightLine[0].data.length > 1 ? (
                <ResponsiveLine
                  data={activeMetricData.weightLine}
                  margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                  xScale={{ type: 'time', format: '%Y-%m-%d', precision: 'day' }}
                  yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                  xFormat="time:%Y-%m-%d"
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{ format: '%b %d', tickSize: 5, tickPadding: 5, tickRotation: -45, tickValues: 'every 7 days' }}
                  axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
                  pointSize={8}
                  pointColor={{ theme: 'background' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  pointLabelYOffset={-12}
                  useMesh={true}
                  colors={['var(--accent-primary)']}
                  enableArea={true}
                  areaOpacity={0.1}
                  theme={{ axis: { ticks: { text: { fill: 'var(--text-secondary)' } } }, grid: { line: { stroke: 'var(--border-color)' } }, crosshair: { line: { stroke: 'var(--accent-primary)' } } }}
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Log at least 2 sessions to chart progression.</div>
              )}
            </div>
          )}
          {activeMetricData.repsLine.length > 0 && (
            <div style={{ height: '350px' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Repetition Progression</h4>
              {activeMetricData.repsLine[0].data.length > 1 ? (
                <ResponsiveLine
                  data={activeMetricData.repsLine}
                  margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                  xScale={{ type: 'time', format: '%Y-%m-%d', precision: 'day' }}
                  yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                  xFormat="time:%Y-%m-%d"
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{ format: '%b %d', tickSize: 5, tickPadding: 5, tickRotation: -45, tickValues: 'every 7 days' }}
                  axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
                  pointSize={8}
                  pointColor={{ theme: 'background' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  pointLabelYOffset={-12}
                  useMesh={true}
                  colors={['var(--accent-success)']}
                  enableArea={true}
                  areaOpacity={0.1}
                  theme={{ axis: { ticks: { text: { fill: 'var(--text-secondary)' } } }, grid: { line: { stroke: 'var(--border-color)' } }, crosshair: { line: { stroke: 'var(--accent-success)' } } }}
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Log at least 2 sessions to chart volume.</div>
              )}
            </div>
          )}
          {activeMetricData.durationLine.length > 0 && (
            <div style={{ height: '350px' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Active Duration Logic</h4>
              {activeMetricData.durationLine[0].data.length > 1 ? (
                <ResponsiveLine
                  data={activeMetricData.durationLine}
                  margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                  xScale={{ type: 'time', format: '%Y-%m-%d', precision: 'day' }}
                  yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                  xFormat="time:%Y-%m-%d"
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{ format: '%b %d', tickSize: 5, tickPadding: 5, tickRotation: -45, tickValues: 'every 7 days' }}
                  axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
                  pointSize={8}
                  pointColor={{ theme: 'background' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  pointLabelYOffset={-12}
                  useMesh={true}
                  colors={['var(--accent-warning)']}
                  enableArea={true}
                  areaOpacity={0.1}
                  theme={{ axis: { ticks: { text: { fill: 'var(--text-secondary)' } } }, grid: { line: { stroke: 'var(--border-color)' } }, crosshair: { line: { stroke: 'var(--accent-warning)' } } }}
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Log at least 2 sessions to chart duration splits.</div>
              )}
            </div>
          )}
        </div>
      ) : selectedEx ? (
        <p style={{ color: 'var(--text-muted)' }}>No quantifiable data found for this exercise to chart.</p>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          Please select an exercise to view its statistical history.
        </div>
      )}
    </div>
  );
};

const PlannerCard = ({ dayOfWeek, dayName, plan, onSave, onLogRoutine }: any) => {
  const [category, setCategory] = useState(plan?.category || '');
  const [exercises, setExercises] = useState<any[]>(plan?.exercises || []);
  const [isEditing, setIsEditing] = useState(false);
  const [showCopyDropdown, setShowCopyDropdown] = useState(false);

  const [editingExIndex, setEditingExIndex] = useState<number | null>(null);
  const [exName, setExName] = useState('');
  const [exSetsList, setExSetsList] = useState<{reps: number|'', weight: number|'', duration: number|'', duration_unit?: 'min'|'sec'}[]>([{ reps: 10, weight: '', duration: '', duration_unit: 'min'}]);
  const [exRest, setExRest] = useState<number | ''>('');
  const [exNotes, setExNotes] = useState('');

  useEffect(() => {
    if (!isEditing) {
      setCategory(plan?.category || '');
      setExercises(plan?.exercises || []);
    }
  }, [plan, isEditing]);

  const updatePlan = (newCategory: string, newExercises: any[]) => {
    onSave(dayOfWeek, newCategory, newExercises);
  };

  const copyToDay = (targetDayOfWeek: number) => {
    onSave(targetDayOfWeek, category, exercises);
    setShowCopyDropdown(false);
  };

  const handleDone = () => {
    updatePlan(category, exercises);
    setIsEditing(false);
    setEditingExIndex(null);
  };

  const startEditEx = (index: number) => {
    const ex = exercises[index];
    setExName(ex.name || '');
    if (ex.set_details && ex.set_details.length > 0) {
      setExSetsList(ex.set_details.map((d: any) => ({
        reps: d.reps || '',
        weight: d.weight || '',
        duration: d.duration || '',
        duration_unit: d.duration_unit || 'min'
      })));
    } else {
      let defaultSets = ex.targetSets || 1;
      let newSetsList = [];
      for(let i = 0; i < defaultSets; i++) {
        newSetsList.push({ reps: ex.targetReps || '', weight: ex.targetWeight || '', duration: ex.targetDuration || '', duration_unit: ex.targetDurationUnit || 'min' });
      }
      setExSetsList(newSetsList);
    }
    setExRest(ex.targetRest || '');
    setExNotes(ex.notes || '');
    setEditingExIndex(index);
  };

  const saveOrAddEx = () => {
    if (!exName.trim()) return;
    
    const newExObject = { 
      name: exName, 
      targetSets: exSetsList.length, 
      targetReps: Number(exSetsList[0]?.reps) || undefined,
      targetDuration: Number(exSetsList[0]?.duration) || undefined,
      targetDurationUnit: exSetsList[0]?.duration_unit || undefined,
      targetWeight: Number(exSetsList[0]?.weight) || undefined,
      targetRest: Number(exRest) || undefined,
      notes: exNotes.trim() || undefined,
      set_details: exSetsList.map(s => ({
        reps: Number(s.reps) || undefined,
        weight: Number(s.weight) || undefined,
        duration: Number(s.duration) || undefined,
        duration_unit: s.duration_unit || undefined
      }))
    };

    let nextExercises;
    if (editingExIndex !== null) {
      nextExercises = [...exercises];
      nextExercises[editingExIndex] = newExObject;
      setExercises(nextExercises);
      setEditingExIndex(null);
    } else {
      nextExercises = [...exercises, newExObject];
      setExercises(nextExercises);
    }
    
    updatePlan(category, nextExercises);
    
    setExName('');
    setExNotes('');
    setExSetsList([{ reps: 10, weight: '', duration: '' }]);
    setExRest('');
  };

  const cancelEditEx = () => {
    setEditingExIndex(null);
    setExName('');
    setExNotes('');
    setExSetsList([{ reps: 10, weight: '', duration: '', duration_unit: 'min' }]);
    setExRest('');
  };

  const removeEx = (index: number) => {
    const newEx = [...exercises];
    newEx.splice(index, 1);
    setExercises(newEx);
    updatePlan(category, newEx);
    if (editingExIndex === index) cancelEditEx();
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newEx = [...exercises];
    const temp = newEx[index - 1];
    newEx[index - 1] = newEx[index];
    newEx[index] = temp;
    setExercises(newEx);
    updatePlan(category, newEx);
    if (editingExIndex === index) setEditingExIndex(index - 1);
    else if (editingExIndex === index - 1) setEditingExIndex(index);
  };

  const moveDown = (index: number) => {
    if (index === exercises.length - 1) return;
    const newEx = [...exercises];
    const temp = newEx[index + 1];
    newEx[index + 1] = newEx[index];
    newEx[index] = temp;
    setExercises(newEx);
    updatePlan(category, newEx);
    if (editingExIndex === index) setEditingExIndex(index + 1);
    else if (editingExIndex === index + 1) setEditingExIndex(index);
  };

  return (
    <div className="animated-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{dayName}</h3>
        {!isEditing ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => { if (exercises.length > 0) onLogRoutine(category, exercises); }} style={{ color: 'var(--accent-success)', background: 'none', border: 'none', cursor: exercises.length > 0 ? 'pointer' : 'default', fontSize: '0.875rem', opacity: exercises.length > 0 ? 1 : 0.5 }}>Log Routine</button>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowCopyDropdown(!showCopyDropdown)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>Copy To...</button>
              {showCopyDropdown && (
                <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 10, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '120px' }}>
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => idx !== dayOfWeek && (
                    <button key={day} onClick={() => copyToDay(idx)} style={{ padding: '0.25rem 0.5rem', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}>
                      {day}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setIsEditing(true)} style={{ color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>Edit Plan</button>
          </div>
        ) : (
          <button onClick={handleDone} style={{ color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Check size={16} /> Done</button>
        )}
      </div>

      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" placeholder="Category (e.g. Push Day, Rest)" value={category} onChange={e => setCategory(e.target.value)} onBlur={() => updatePlan(category, exercises)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', width: '100%' }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {exercises.map((ex, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: editingExIndex === i ? 'rgba(74, 144, 226, 0.1)' : 'var(--bg-app)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', flexDirection: 'column', gap: '0.25rem', border: editingExIndex === i ? '1px solid var(--accent-primary)' : '1px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                      <button onClick={() => moveUp(i)} disabled={i === 0} style={{ padding: 0, background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1, color: 'var(--text-secondary)' }}>
                        <ChevronUp size={14} />
                      </button>
                      <button onClick={() => moveDown(i)} disabled={i === exercises.length - 1} style={{ padding: 0, background: 'none', border: 'none', cursor: i === exercises.length - 1 ? 'default' : 'pointer', opacity: i === exercises.length - 1 ? 0.3 : 1, color: 'var(--text-secondary)' }}>
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    <span><strong>{ex.name}</strong></span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => startEditEx(i)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}><Pencil size={14} /></button>
                    <button onClick={() => removeEx(i)} style={{ color: '#ff4d4f', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div style={{ marginLeft: '1.5rem', marginTop: '0.25rem' }}>
                  {ex.set_details && ex.set_details.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {ex.set_details.map((sd: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                           <span style={{ fontWeight: 600 }}>Set {idx + 1}:</span>
                           {sd.reps ? <span>{sd.reps} reps</span> : null}
                           {sd.weight ? <span>{sd.weight} lbs</span> : null}
                           {sd.duration ? <span>{sd.duration} {sd.duration_unit || 'min'}s</span> : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {ex.targetSets && ex.targetReps ? <span>{ex.targetSets} sets × {ex.targetReps} reps</span> : null}
                      {ex.targetDuration ? <span>⏱ {ex.targetDuration}{ex.targetDurationUnit === 'sec' ? 's' : 'm'}</span> : null}
                      {ex.targetWeight ? <span>⚖️ {ex.targetWeight} lbs</span> : null}
                    </div>
                  )}
                  {ex.targetRest ? <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>⏳ {ex.targetRest}s Rest</div> : null}
                </div>
                {ex.notes && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem', marginLeft: '1.5rem' }}>{ex.notes}</div>}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-card-hover)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: editingExIndex !== null ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 600 }}>
                {editingExIndex !== null ? 'Edit Exercise' : 'Add Exercise'}
              </span>
              {editingExIndex !== null && (
                <button onClick={cancelEditEx} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
              )}
            </div>
            
            <input type="text" placeholder="Exercise Name" value={exName} onChange={e => setExName(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'rgba(0,0,0,0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              {exSetsList.map((setInfo, idx) => (
                 <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                   <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', minWidth: '40px' }}>Set {idx + 1}</span>
                   <input type="number" placeholder="Reps" value={setInfo.reps} onChange={e => {
                     const newL = [...exSetsList];
                     newL[idx].reps = e.target.value ? Number(e.target.value) : '';
                     setExSetsList(newL);
                   }} style={{ flex: 1, minWidth: '60px', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }} title="Reps" />
                   
                   <input type="number" placeholder="Lbs" value={setInfo.weight} onChange={e => {
                     const newL = [...exSetsList];
                     newL[idx].weight = e.target.value ? Number(e.target.value) : '';
                     setExSetsList(newL);
                   }} style={{ flex: 1, minWidth: '60px', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }} title="Lbs" />
                   
                   <div style={{ display: 'flex', flex: 1.5, minWidth: '110px' }}>
                     <input type="number" placeholder="Dur" value={setInfo.duration} onChange={e => {
                       const newL = [...exSetsList];
                       newL[idx].duration = e.target.value ? Number(e.target.value) : '';
                       setExSetsList(newL);
                     }} style={{ flex: 1, minWidth: 0, padding: '0.5rem', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', border: '1px solid var(--border-color)', borderRight: 'none', background: 'var(--bg-app)', color: 'var(--text-primary)' }} title="Duration" />
                     <select value={setInfo.duration_unit || 'min'} onChange={e => {
                       const newL = [...exSetsList];
                       newL[idx] = { ...newL[idx], duration_unit: e.target.value as 'min'|'sec' };
                       setExSetsList(newL);
                     }} style={{ width: '50px', padding: '0.5rem 0.25rem', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                       <option value="min">m</option><option value="sec">s</option>
                     </select>
                   </div>
                   
                   <button onClick={() => {
                     if (exSetsList.length > 1) {
                       setExSetsList(exSetsList.filter((_, i) => i !== idx));
                     }
                   }} style={{ padding: '0.25rem', color: exSetsList.length > 1 ? '#ff4d4f' : 'transparent', background: 'transparent', border: 'none', cursor: exSetsList.length > 1 ? 'pointer' : 'default', pointerEvents: exSetsList.length > 1 ? 'auto' : 'none' }}>
                     <X size={16} />
                   </button>
                 </div>
              ))}
              <button onClick={() => {
                 const last = exSetsList[exSetsList.length - 1];
                 setExSetsList([...exSetsList, { ...last }]);
              }} style={{ alignSelf: 'center', padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '0.25rem' }}>+ Add Set</button>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="number" placeholder="Rest between sets (sec)" value={exRest} onChange={e => setExRest(e.target.value ? Number(e.target.value) : '')} style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }} title="Rest Time (sec)" />
            </div>
            
            <input type="text" placeholder="Notes (e.g. slow eccentric)" value={exNotes} onChange={e => setExNotes(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }} />
            
            <button onClick={saveOrAddEx} style={{ background: 'var(--accent-primary)', color: 'var(--text-primary)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0.5rem', cursor: 'pointer', marginTop: '0.25rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem' }}>
              {editingExIndex !== null ? <Check size={16} /> : <Plus size={16} />} 
              {editingExIndex !== null ? 'Save Exercise' : 'Add to Plan'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          {category ? <p style={{ color: 'var(--accent-primary)', fontWeight: 500, marginBottom: '1rem' }}>{category}</p> : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>Rest Day</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {exercises.length > 0 ? exercises.map((ex, i) => (
              <div key={i} style={{ padding: '0.5rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{ex.name}</div>
                {ex.set_details && ex.set_details.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    {ex.set_details.map((sd: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                         <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Set {idx + 1}:</span>
                         {sd.reps ? <span>{sd.reps} reps</span> : null}
                         {sd.weight ? <span>{sd.weight} lbs</span> : null}
                         {sd.duration ? <span>{sd.duration} mins</span> : null}
                      </div>
                    ))}
                    {ex.targetRest ? <span style={{ marginTop: '0.25rem' }}>⏳ {ex.targetRest}s rest between sets</span> : null}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {ex.targetSets && ex.targetReps ? <span>{ex.targetSets} sets × {ex.targetReps}</span> : null}
                    {ex.targetDuration ? <span>⏱ {ex.targetDuration}{ex.targetDurationUnit === 'sec' ? 's' : 'm'}</span> : null}
                    {ex.targetWeight ? <span>⚖️ {ex.targetWeight}lbs</span> : null}
                    {ex.targetRest ? <span>⏳ {ex.targetRest}s</span> : null}
                  </div>
                )}
                {ex.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>{ex.notes}</div>}
              </div>
            )) : <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No exercises planned.</span>}
          </div>
        </div>
      )}
    </div>
  );
};

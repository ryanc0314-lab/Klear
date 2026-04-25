import { useEffect, useState, useMemo } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useProjectStore } from '../../store/projectStore';
import { useTimeBlockStore } from '../../store/timeBlockStore';
import { type TimeBlock } from '../../db/database';
import { CheckCircle2, Circle, Plus, Trash2, Folder, Flag, Filter, Pencil, Check, X, Repeat, Tag as TagIcon, Archive, Calendar, AlertTriangle, Clock, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BacklogView } from './BacklogView';
import { format, isToday, isTomorrow, isThisWeek, isThisMonth, isBefore, startOfToday, addDays, addWeeks } from 'date-fns';

const DAYS_OF_WEEK = [
  { label: 'Su', value: 0 }, { label: 'Mo', value: 1 }, { label: 'Tu', value: 2 },
  { label: 'We', value: 3 }, { label: 'Th', value: 4 }, { label: 'Fr', value: 5 }, { label: 'Sa', value: 6 }
];

const DailyPlannerView = ({ tasks, timeBlocks, onEdit, onAddBlock }: { tasks: any[], timeBlocks: TimeBlock[], onEdit: (task: any) => void, onAddBlock: () => void }) => {
  const unscheduled = tasks.filter(t => !t.block_id);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {unscheduled.length > 0 && (
         <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}><TagIcon size={16}/> Unscheduled Priority</h4>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
               {unscheduled.map(task => (
                  <button key={task.id} onClick={() => onEdit(task)} className="btn-secondary" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 600 }}>{task.title}</span>
                  </button>
               ))}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>Click to edit and assign a time block.</p>
         </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Today's Timeline</h3>
         <button className="btn btn-primary" onClick={onAddBlock} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Plus size={16} /> Add Time Block
         </button>
      </div>
      
      <div style={{ position: 'relative', height: `${24 * 60}px`, marginTop: '0', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
         {hours.map(hour => (
            <div key={hour} style={{ position: 'absolute', top: `${hour * 60}px`, left: 0, right: 0, height: '60px', borderTop: hour === 0 ? 'none' : '1px solid var(--border-color)', display: 'flex' }}>
               <div style={{ width: '70px', padding: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'right', borderRight: '1px solid var(--border-color)', background: 'var(--bg-app)' }}>
                 {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
               </div>
            </div>
         ))}
         
         {timeBlocks.map(block => {
            const [sh, sm] = block.start_time.split(':').map(Number);
            const [eh, em] = block.end_time.split(':').map(Number);
            const top = sh * 60 + sm;
            const height = Math.max((eh * 60 + em) - top, 20);
            
            const blockTasks = tasks.filter(t => t.block_id === block.id);

            return (
               <div key={block.id} style={{ position: 'absolute', top: `${top}px`, left: '80px', right: '10px', height: `${height}px`, background: block.color, color: '#fff', borderRadius: 'var(--radius-sm)', padding: '0.5rem', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{block.title} <span style={{ opacity: 0.8, fontWeight: 400, marginLeft: '0.5rem' }}>{block.start_time} - {block.end_time}</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {blockTasks.length > 0 ? blockTasks.map(t => (
                      <div key={t.id} onClick={(e) => { e.stopPropagation(); onEdit(t); }} style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {t.title}
                      </div>
                    )) : (
                      <div style={{ fontSize: '0.75rem', opacity: 0.7, fontStyle: 'italic' }}>No tasks assigned</div>
                    )}
                  </div>
               </div>
            )
         })}
      </div>
    </div>
  );
};

const SortableTaskCard = ({ id, isCompleted, isEditing, onMoveUp, onMoveDown, hideArrows, children }: { id: string, isCompleted: boolean, isEditing: boolean, onMoveUp?: () => void, onMoveDown?: () => void, hideArrows?: boolean, children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : (isCompleted ? 0.7 : 1),
    position: isDragging ? 'relative' : 'static',
    zIndex: isDragging ? 999 : 'auto'
  };

  return (
    <div ref={setNodeRef} style={style} className="animated-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', width: '100%', padding: '1rem' }}>
        {!isEditing && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
            {!hideArrows && onMoveUp && (
               <button onClick={onMoveUp} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '0.125rem' }} title="Move Up">
                  <ChevronUp size={16} />
               </button>
            )}
            <button {...attributes} {...listeners} style={{ background: 'none', border: 'none', cursor: 'grab', color: 'var(--text-muted)', display: 'flex', padding: 0 }} title="Drag to reorder">
               <GripVertical size={16} />
            </button>
            {!hideArrows && onMoveDown && (
               <button onClick={onMoveDown} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '0.125rem' }} title="Move Down">
                  <ChevronDown size={16} />
               </button>
            )}
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const TaskDashboard = () => {
  const { tasks, loadTasks, addTask, toggleTask, incrementTask, decrementTask, addDurationToTask, deleteTask, updateTask, clearCompleted, reorderTasks } = useTaskStore();
  const { projects, loadProjects } = useProjectStore();
  const { timeBlocks, loadTimeBlocks, addTimeBlock } = useTimeBlockStore();
  
  const [activeTab, setActiveTab] = useState<'active' | 'archive' | 'overdue' | 'planner' | 'backlog'>('active');

  // Time Block creation state
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockStart, setNewBlockStart] = useState('09:00');
  const [newBlockEnd, setNewBlockEnd] = useState('11:00');
  const [newBlockColor, setNewBlockColor] = useState('#3498db');

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [targetCount, setTargetCount] = useState<number | ''>(1);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<'Low'|'Medium'|'High'|''>('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [newTaskRepeat, setNewTaskRepeat] = useState<'none'|'daily'|'weekly'|'biweekly'|'monthly'>('none');
  const [newTaskTags, setNewTaskTags] = useState<string>('');
  const [newTaskRepeatDays, setNewTaskRepeatDays] = useState<number[]>([]);
  const [targetDuration, setTargetDuration] = useState<number | ''>('');
  const [newTaskBlockId, setNewTaskBlockId] = useState<string>('');

  // Filtering state
  const [filterPriority, setFilterPriority] = useState<'Low'|'Medium'|'High'|'All'>('All');
  const [filterDueDate, setFilterDueDate] = useState<'All'|'Today'|'Tomorrow'|'ThisWeek'|'ThisMonth'>('All');
  const [filterTag, setFilterTag] = useState<string>('All');

  // Subtask state
  const [addingSubtaskId, setAddingSubtaskId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskProjectId, setEditTaskProjectId] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<'Low'|'Medium'|'High'|''>('');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [editTaskTargetCount, setEditTaskTargetCount] = useState<number | ''>(1);
  const [editTaskRepeat, setEditTaskRepeat] = useState<'none'|'daily'|'weekly'|'biweekly'|'monthly'>('none');
  const [editTaskTags, setEditTaskTags] = useState('');
  const [editTaskRepeatDays, setEditTaskRepeatDays] = useState<number[]>([]);
  const [editTaskTargetDuration, setEditTaskTargetDuration] = useState<number | ''>('');
  const [editTaskBlockId, setEditTaskBlockId] = useState<string>('');

  useEffect(() => {
    loadTasks();
    loadProjects();
    loadTimeBlocks();
  }, [loadTasks, loadProjects, loadTimeBlocks]);

  const todaysBlocks = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return timeBlocks.filter(b => b.date === todayStr);
  }, [timeBlocks]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach(t => t.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [tasks]);

  const toggleRepeatDay = (day: number, isEdit: boolean) => {
    if (isEdit) {
      setEditTaskRepeatDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    } else {
      setNewTaskRepeatDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    let parsedDate: Date | undefined;
    if (newTaskDueDate) {
      parsedDate = new Date(newTaskDueDate + 'T12:00:00');
    }
    
    const tagsArray = newTaskTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    addTask(
      newTaskTitle.trim(), 
      selectedProjectId || undefined, 
      undefined, 
      (selectedPriority as 'Low'|'Medium'|'High') || undefined, 
      parsedDate, 
      targetCount === '' ? 1 : targetCount, 
      newTaskRepeat,
      tagsArray,
      newTaskRepeat === 'weekly' ? newTaskRepeatDays : [],
      Number(targetDuration) || undefined,
      newTaskBlockId || undefined
    );
    
    setNewTaskTitle('');
    setTargetCount(1);
    setSelectedProjectId('');
    setSelectedPriority('');
    setNewTaskDueDate(format(new Date(), 'yyyy-MM-dd'));
    setNewTaskRepeat('none');
    setNewTaskTags('');
    setNewTaskRepeatDays([]);
    setTargetDuration('');
    setNewTaskBlockId('');
  };

  const handleAddSubtask = async (parentId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    
    await addTask(
      newSubtaskTitle.trim(),
      undefined, // project_id
      parentId,  // parent_id
      undefined, // priority
      undefined, // due_date
      1          // target counts
    );
    setNewSubtaskTitle('');
    setAddingSubtaskId(null);
  };

  const handleEditTaskStart = (task: any) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskProjectId(task.project_id || '');
    setEditTaskPriority(task.priority || '');
    setEditTaskDueDate(task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '');
    setEditTaskTargetCount(task.target_count || 1);
    setEditTaskRepeat(task.repeat || 'none');
    setEditTaskTags(task.tags ? task.tags.join(', ') : '');
    setEditTaskRepeatDays(task.repeat_days || []);
    setEditTaskTargetDuration(task.target_duration || '');
    setEditTaskBlockId(task.block_id || '');
  };

  const handleEditTaskSave = async (id: string) => {
    if (!editTaskTitle.trim()) return;
    
    let parsedDate: Date | undefined;
    if (editTaskDueDate) {
      parsedDate = new Date(editTaskDueDate + 'T12:00:00');
    }
    
    const tagsArray = editTaskTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    await updateTask(id, { 
      title: editTaskTitle.trim(),
      project_id: editTaskProjectId || undefined,
      priority: (editTaskPriority as 'Low'|'Medium'|'High') || undefined,
      due_date: parsedDate,
      target_count: editTaskTargetCount === '' ? 1 : editTaskTargetCount,
      repeat: editTaskRepeat === 'none' ? undefined : editTaskRepeat,
      tags: tagsArray,
      repeat_days: editTaskRepeat === 'weekly' ? editTaskRepeatDays : undefined,
      target_duration: Number(editTaskTargetDuration) || undefined,
      block_id: editTaskBlockId || undefined
    });
    setEditingTaskId(null);
  };

  const filteredTasks = tasks
    .filter(t => !t.parent_id)
    .filter(t => {
      if (activeTab === 'archive') return t.completed;
      if (activeTab === 'overdue') {
        if (t.completed || !t.due_date) return false;
        return isBefore(new Date(t.due_date), startOfToday());
      }
      if (activeTab === 'planner') {
        if (t.completed) return false;
        if (!t.due_date) return false;
        return isToday(new Date(t.due_date)) || isBefore(new Date(t.due_date), startOfToday());
      }
      return !t.completed;
    })
    .filter(t => filterPriority === 'All' ? true : t.priority === filterPriority)
    .filter(t => filterTag === 'All' ? true : t.tags?.includes(filterTag))
    .filter(t => {
      if (filterDueDate === 'All' || !t.due_date) return true;
      const date = new Date(t.due_date);
      if (filterDueDate === 'Today') return isToday(date);
      if (filterDueDate === 'Tomorrow') return isTomorrow(date);
      if (filterDueDate === 'ThisWeek') return isThisWeek(date);
      if (filterDueDate === 'ThisMonth') return isThisMonth(date);
      return true;
    })
    .sort((a, b) => {
      if (activeTab === 'planner') {
         if (a.block_id && b.block_id) return a.block_id.localeCompare(b.block_id);
         if (!a.block_id && b.block_id) return -1;
         if (a.block_id && !b.block_id) return 1;
      }
      
      // Sort by due date (earliest first)
      if (a.due_date && b.due_date) {
         const diff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
         if (diff !== 0) return diff;
      } else if (a.due_date) return -1;
      else if (b.due_date) return 1;
      
      // Then sort by priority
      const priorityWeights = { High: 3, Medium: 2, Low: 1, undefined: 0 };
      const weightA = priorityWeights[a.priority as keyof typeof priorityWeights] || 0;
      const weightB = priorityWeights[b.priority as keyof typeof priorityWeights] || 0;
      if (weightA !== weightB) return weightB - weightA;
      
      // Fallback to manual drag and drop sorting
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      if (a.order !== undefined && b.order === undefined) return -1;
      if (a.order === undefined && b.order !== undefined) return 1;
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      const oldIndex = filteredTasks.findIndex(t => t.id === active.id);
      const newIndex = filteredTasks.findIndex(t => t.id === over.id);
      const moved = arrayMove(filteredTasks, oldIndex, newIndex);
      const updates = moved.map((t, index) => ({ id: t.id, order: index }));
      reorderTasks(updates);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newTasks = [...filteredTasks];
      const temp = newTasks[index];
      newTasks[index] = newTasks[index - 1];
      newTasks[index - 1] = temp;
      reorderTasks(newTasks.map((t, i) => ({ id: t.id, order: i })));
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < filteredTasks.length - 1) {
      const newTasks = [...filteredTasks];
      const temp = newTasks[index];
      newTasks[index] = newTasks[index + 1];
      newTasks[index + 1] = temp;
      reorderTasks(newTasks.map((t, i) => ({ id: t.id, order: i })));
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Tasks & Projects</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage and filter your daily action items.</p>
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
            className={`btn ${activeTab === 'backlog' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('backlog')}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'backlog' ? '' : 'transparent', color: activeTab === 'backlog' ? '' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Folder size={16} /> Backlog
          </button>
          <button 
            className={`btn ${activeTab === 'archive' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('archive')}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'archive' ? '' : 'transparent', color: activeTab === 'archive' ? '' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Archive size={16} /> Archive
          </button>
          <button 
            className={`btn ${activeTab === 'overdue' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('overdue')}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'overdue' ? '' : 'transparent', color: activeTab === 'overdue' ? '' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <AlertTriangle size={16} /> Overdue
          </button>
          <button 
            className={`btn ${activeTab === 'planner' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('planner')}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'planner' ? '' : 'transparent', color: activeTab === 'planner' ? '' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Clock size={16} /> Daily Planner
          </button>
        </div>
      </div>

      {activeTab === 'active' && (
        <>
          <div className="animated-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Filter size={16} /> Filters:</span>
            
            <select value={filterDueDate} onChange={e => setFilterDueDate(e.target.value as any)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
              <option value="All">Any Time</option>
              <option value="Today">Due Today</option>
              <option value="Tomorrow">Due Tomorrow</option>
              <option value="ThisWeek">Due This Week</option>
              <option value="ThisMonth">Due This Month</option>
            </select>

            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as any)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select value={filterTag} onChange={e => setFilterTag(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
              <option value="All">All Tags</option>
              {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
            </select>
            
            {(filterDueDate !== 'All' || filterPriority !== 'All' || filterTag !== 'All') && (
              <button 
                onClick={() => { setFilterDueDate('All'); setFilterPriority('All'); setFilterTag('All'); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="animated-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="What needs to be done?" style={{ flex: 1, minWidth: '200px', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '1rem' }} />
                <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
                  <option value="">No Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }} title="Due Date" />
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button type="button" onClick={() => setNewTaskDueDate(format(new Date(), 'yyyy-MM-dd'))} style={{ padding: '0.5rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', cursor: 'pointer' }}>Today</button>
                    <button type="button" onClick={() => setNewTaskDueDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'))} style={{ padding: '0.5rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', cursor: 'pointer' }}>Tomorrow</button>
                    <button type="button" onClick={() => setNewTaskDueDate(format(addWeeks(new Date(), 1), 'yyyy-MM-dd'))} style={{ padding: '0.5rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', cursor: 'pointer' }}>Next Week</button>
                    <button type="button" onClick={() => setNewTaskDueDate('')} style={{ padding: '0.5rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Clear</button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={selectedPriority} onChange={e => setSelectedPriority(e.target.value as any)} style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
                  <option value="">Priority...</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <select value={newTaskRepeat} onChange={e => setNewTaskRepeat(e.target.value as any)} style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                
                {newTaskRepeat === 'weekly' && (
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {DAYS_OF_WEEK.map(d => (
                      <button 
                        key={d.value} type="button" 
                        onClick={() => toggleRepeatDay(d.value, false)}
                        style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: newTaskRepeatDays.includes(d.value) ? 'var(--accent-primary)' : 'var(--bg-app)', color: newTaskRepeatDays.includes(d.value) ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', padding: '0 0.5rem', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Goal:</span>
                  <input type="number" value={targetCount} onChange={(e) => setTargetCount(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))} min={1} style={{ width: '60px', padding: '0.75rem 0 0.75rem 0.5rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }} title="Target count" />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', padding: '0 0.5rem', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Mins:</span>
                  <input type="number" value={targetDuration} onChange={(e) => setTargetDuration(e.target.value ? Math.max(1, Number(e.target.value)) : '')} min={1} style={{ width: '60px', padding: '0.75rem 0 0.75rem 0.5rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }} title="Target duration in minutes" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', padding: '0 0.5rem', border: '1px solid var(--border-color)' }}>
                  <select value={newTaskBlockId} onChange={e => setNewTaskBlockId(e.target.value)} style={{ padding: '0.75rem 0', border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}>
                     <option value="">No Block</option>
                     {todaysBlocks.map(b => <option key={b.id} value={b.id}>{b.title} ({b.start_time}-{b.end_time})</option>)}
                  </select>
                </div>
                
                <input type="text" value={newTaskTags} onChange={(e) => setNewTaskTags(e.target.value)} placeholder="Tags (comma separated)" style={{ flex: 1, minWidth: '150px', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }} />

                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={18} /> Add Task
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {activeTab === 'archive' && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
           <button onClick={clearCompleted} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff4d4f', border: '1px solid #ff4d4f' }}>
             <Trash2 size={16} /> Delete All Archived Tasks
           </button>
        </div>
      )}

      {activeTab === 'backlog' && (
         <BacklogView />
      )}

      {showBlockModal && (
         <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Create Time Block</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
               <input type="text" value={newBlockTitle} onChange={e => setNewBlockTitle(e.target.value)} placeholder="Block title (e.g. Deep Work)" style={{ flex: 1, minWidth: '200px', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }} />
               <input type="time" value={newBlockStart} onChange={e => setNewBlockStart(e.target.value)} style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }} />
               <input type="time" value={newBlockEnd} onChange={e => setNewBlockEnd(e.target.value)} style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }} />
               <input type="color" value={newBlockColor} onChange={e => setNewBlockColor(e.target.value)} style={{ padding: '0.25rem', height: '42px', width: '42px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', cursor: 'pointer' }} />
               <button onClick={async () => {
                  if (newBlockTitle) {
                     await addTimeBlock(format(new Date(), 'yyyy-MM-dd'), newBlockTitle, newBlockStart, newBlockEnd, newBlockColor);
                     setShowBlockModal(false);
                     setNewBlockTitle('');
                  }
               }} className="btn btn-primary">Save Block</button>
               <button onClick={() => setShowBlockModal(false)} className="btn">Cancel</button>
            </div>
         </div>
      )}

      {activeTab !== 'backlog' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            {activeTab === 'active' ? 'No tasks match your criteria. Create one above!' : activeTab === 'archive' ? 'No archived tasks.' : activeTab === 'planner' ? 'No tasks planned for today.' : 'No overdue tasks. Great job!'}
          </div>
        ) : activeTab === 'planner' ? (
           <DailyPlannerView tasks={filteredTasks} timeBlocks={todaysBlocks} onEdit={handleEditTaskStart} onAddBlock={() => setShowBlockModal(true)} />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {filteredTasks.map((task, index) => {
                const subtasks = tasks.filter(t => t.parent_id === task.id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                
                return (
                <SortableTaskCard 
                  key={task.id} 
                  id={task.id} 
                  isCompleted={task.completed} 
                  isEditing={editingTaskId === task.id}
                  hideArrows={activeTab !== 'active'}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                >
                  {editingTaskId === task.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input type="text" value={editTaskTitle} onChange={(e) => setEditTaskTitle(e.target.value)} style={{ flex: 1, minWidth: '200px', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }} />
                    <select value={editTaskProjectId} onChange={e => setEditTaskProjectId(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
                      <option value="">No Project</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="date" value={editTaskDueDate} onChange={(e) => setEditTaskDueDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }} />
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button type="button" onClick={() => setEditTaskDueDate(format(new Date(), 'yyyy-MM-dd'))} style={{ padding: '0.5rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', cursor: 'pointer' }}>Today</button>
                        <button type="button" onClick={() => setEditTaskDueDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'))} style={{ padding: '0.5rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', cursor: 'pointer' }}>Tomorrow</button>
                        <button type="button" onClick={() => setEditTaskDueDate('')} style={{ padding: '0.5rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Clear</button>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select value={editTaskPriority} onChange={e => setEditTaskPriority(e.target.value as any)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
                      <option value="">Priority...</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                    <select value={editTaskRepeat} onChange={e => setEditTaskRepeat(e.target.value as any)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
                      <option value="none">Does not repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>

                    {editTaskRepeat === 'weekly' && (
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {DAYS_OF_WEEK.map(d => (
                          <button 
                            key={d.value} type="button" 
                            onClick={() => toggleRepeatDay(d.value, true)}
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: editTaskRepeatDays.includes(d.value) ? 'var(--accent-primary)' : 'var(--bg-app)', color: editTaskRepeatDays.includes(d.value) ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', padding: '0 0.5rem', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Goal:</span>
                      <input type="number" value={editTaskTargetCount} onChange={(e) => setEditTaskTargetCount(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))} min={1} style={{ width: '50px', padding: '0.5rem 0 0.5rem 0.5rem', border: 'none', background: 'transparent', color: 'var(--text-primary)' }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', padding: '0 0.5rem', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Mins:</span>
                      <input type="number" value={editTaskTargetDuration} onChange={(e) => setEditTaskTargetDuration(e.target.value ? Math.max(1, Number(e.target.value)) : '')} min={1} style={{ width: '50px', padding: '0.5rem 0 0.5rem 0.5rem', border: 'none', background: 'transparent', color: 'var(--text-primary)' }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', padding: '0 0.5rem', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Block:</span>
                      <select value={editTaskBlockId} onChange={e => setEditTaskBlockId(e.target.value)} style={{ padding: '0.5rem 0', border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}>
                         <option value="">None</option>
                         {todaysBlocks.map(b => <option key={b.id} value={b.id}>{b.title} ({b.start_time}-{b.end_time})</option>)}
                      </select>
                    </div>
                    
                    <input type="text" value={editTaskTags} onChange={(e) => setEditTaskTags(e.target.value)} placeholder="Tags (comma separated)" style={{ flex: 1, minWidth: '150px', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                      <button onClick={() => handleEditTaskSave(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-success)' }}><Check size={20} /></button>
                      <button onClick={() => setEditingTaskId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <button 
                      onClick={() => toggleTask(task.id, !task.completed)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.completed ? 'var(--accent-success)' : 'var(--text-secondary)' }}
                    >
                      {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: 500, 
                        textDecoration: task.completed ? 'line-through' : 'none',
                        color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                        marginBottom: '0.25rem'
                      }}>
                        {task.title}
                      </h3>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {task.project_id && (() => {
                          const proj = projects.find(p => p.id === task.project_id);
                          return proj ? (
                            <span style={{ fontSize: '0.75rem', color: proj.color || 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Folder size={12} /> {proj.title}
                            </span>
                          ) : null;
                        })()}
                        {task.priority && (
                          <span style={{ 
                            fontSize: '0.75rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.25rem',
                            color: task.priority === 'High' ? 'var(--accent-danger)' : task.priority === 'Medium' ? 'var(--accent-warning)' : 'var(--accent-success)'
                          }}>
                            <Flag size={12} /> {task.priority}
                          </span>
                        )}
                        {task.repeat && task.repeat !== 'none' && (
                          <span style={{ 
                            fontSize: '0.75rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.25rem',
                            color: 'var(--text-secondary)'
                          }}>
                            <Repeat size={12} /> {task.repeat.charAt(0).toUpperCase() + task.repeat.slice(1)}
                            {task.repeat === 'weekly' && task.repeat_days && task.repeat_days.length > 0 && ` (${task.repeat_days.map(d => DAYS_OF_WEEK.find(dw => dw.value === d)?.label).join(', ')})`}
                          </span>
                        )}
                        {task.due_date && (
                          <span style={{ fontSize: '0.75rem', color: isToday(new Date(task.due_date)) ? 'var(--accent-warning)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                             <Calendar size={12} /> Due {format(new Date(task.due_date), 'MMM d, yyyy')}
                          </span>
                        )}
                        {task.block_id && todaysBlocks.find(b => b.id === task.block_id) && (
                          <span style={{ fontSize: '0.75rem', color: todaysBlocks.find(b => b.id === task.block_id)?.color, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} /> {todaysBlocks.find(b => b.id === task.block_id)?.title}
                          </span>
                        )}
                      </div>
                      
                      {task.tags && task.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                          {task.tags.map(tag => (
                            <span 
                              key={tag}
                              onClick={() => { setActiveTab('active'); setFilterTag(tag); }}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-secondary)', borderRadius: '999px', fontSize: '0.75rem', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                            >
                              <TagIcon size={10} /> {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    {task.target_count !== undefined && task.target_count > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-app)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        <button onClick={() => decrementTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0 0.25rem' }}>-</button>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: '30px', textAlign: 'center' }}>
                          {task.current_count || 0}/{task.target_count}
                        </span>
                        <button onClick={() => incrementTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0 0.25rem' }} disabled={task.completed}>+</button>
                      </div>
                    )}
                    
                    {task.target_duration !== undefined && task.target_duration > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-app)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        <button onClick={() => addDurationToTask(task.id, 5)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0 0.25rem' }} title="+5 mins" disabled={task.completed}>+5m</button>
                        <button onClick={() => addDurationToTask(task.id, 15)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0 0.25rem' }} title="+15 mins" disabled={task.completed}>+15m</button>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: '40px', textAlign: 'center' }}>
                          {task.current_duration || 0}/{task.target_duration}m
                        </span>
                      </div>
                    )}
                    <button 
                      onClick={() => setAddingSubtaskId(task.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--accent-primary)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      title="Add Subtask"
                    >
                      <Plus size={20} />
                    </button>
                    <button 
                      onClick={() => handleEditTaskStart(task)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Pencil size={20} />
                    </button>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)', opacity: 0.7 }}
                      onMouseOver={e => e.currentTarget.style.opacity = '1'}
                      onMouseOut={e => e.currentTarget.style.opacity = '0.7'}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  </div>
                  
                  {/* Subtasks Section */}
                  {(subtasks.length > 0 || addingSubtaskId === task.id) && (
                    <div style={{ marginLeft: '2.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '1rem' }}>
                      {subtasks.map(subtask => (
                        <div key={subtask.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: subtask.completed ? 0.7 : 1, padding: '0.25rem 0' }}>
                          <button 
                            onClick={() => toggleTask(subtask.id, !subtask.completed)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: subtask.completed ? 'var(--accent-success)' : 'var(--text-secondary)', display: 'flex' }}
                          >
                            {subtask.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                          </button>
                          <div style={{ flex: 1, textDecoration: subtask.completed ? 'line-through' : 'none', color: subtask.completed ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {subtask.title}
                          </div>
                          <button 
                            onClick={() => deleteTask(subtask.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            onMouseOver={e => e.currentTarget.style.color = 'var(--accent-danger)'}
                            onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      
                      {addingSubtaskId === task.id && (
                        <form onSubmit={(e) => handleAddSubtask(task.id, e)} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            value={newSubtaskTitle} 
                            onChange={e => setNewSubtaskTitle(e.target.value)} 
                            autoFocus 
                            placeholder="Subtask description..." 
                            style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }} 
                          />
                          <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}>Add</button>
                          <button type="button" onClick={() => { setAddingSubtaskId(null); setNewSubtaskTitle(''); }} className="btn" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}>Cancel</button>
                        </form>
                      )}
                    </div>
                  )}
                </>
              )}
            </SortableTaskCard>
            );
          })}
            </SortableContext>
          </DndContext>
        )}
      </div>
      )}
    </div>
  );
};

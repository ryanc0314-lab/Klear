import { useEffect, useState, useMemo } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useTaskStore } from '../../store/taskStore';
import { Folder, Plus, Trash2, CheckCircle2, Circle, Calendar, Pencil, Check, X, Filter, Flag, Repeat, Tag as TagIcon } from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, isThisMonth } from 'date-fns';

const DAYS_OF_WEEK = [
  { label: 'Su', value: 0 }, { label: 'Mo', value: 1 }, { label: 'Tu', value: 2 },
  { label: 'We', value: 3 }, { label: 'Th', value: 4 }, { label: 'Fr', value: 5 }, { label: 'Sa', value: 6 }
];

export const ProjectDashboard = () => {
  const { projects, loadProjects, addProject, deleteProject, updateProject } = useProjectStore();
  const { tasks, loadTasks, toggleTask, updateTask, incrementTask, decrementTask, addDurationToTask, deleteTask, addTask } = useTaskStore();
  
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDueDate, setNewProjectDueDate] = useState('');

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectTitle, setEditProjectTitle] = useState('');
  const [editProjectDueDate, setEditProjectDueDate] = useState('');

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');

  // Subtask state
  const [addingSubtaskId, setAddingSubtaskId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const [addingTaskToProjectId, setAddingTaskToProjectId] = useState<string | null>(null);
  const [newProjectTaskTitle, setNewProjectTaskTitle] = useState('');
  const [newProjectTaskDueDate, setNewProjectTaskDueDate] = useState('');
  const [newProjectTaskPriority, setNewProjectTaskPriority] = useState<'Low'|'Medium'|'High'|''>('');
  const [newProjectTaskTags, setNewProjectTaskTags] = useState('');

  // Filtering state
  const [filterPriority, setFilterPriority] = useState<'Low'|'Medium'|'High'|'All'>('All');
  const [filterDueDate, setFilterDueDate] = useState<'All'|'Today'|'Tomorrow'|'ThisWeek'|'ThisMonth'>('All');
  const [filterTag, setFilterTag] = useState<string>('All');
  const [filterCompleted, setFilterCompleted] = useState<'All'|'Active'|'Completed'>('Active');

  useEffect(() => {
    loadProjects();
    loadTasks();
  }, [loadProjects, loadTasks]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach(t => t.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [tasks]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    
    let parsedDate: Date | undefined;
    if (newProjectDueDate) {
      parsedDate = new Date(newProjectDueDate + 'T12:00:00');
    }
    
    addProject(newProjectTitle.trim(), undefined, undefined, parsedDate);
    setNewProjectTitle('');
    setNewProjectDueDate('');
  };

  const handleEditProjectStart = (project: any) => {
    setEditingProjectId(project.id);
    setEditProjectTitle(project.title);
    setEditProjectDueDate(project.due_date ? format(new Date(project.due_date), 'yyyy-MM-dd') : '');
  };

  const handleEditProjectSave = async (id: string) => {
    if (!editProjectTitle.trim()) return;
    
    let parsedDate: Date | undefined;
    if (editProjectDueDate) {
      parsedDate = new Date(editProjectDueDate + 'T12:00:00');
    }
    
    await updateProject(id, { title: editProjectTitle.trim(), due_date: parsedDate });
    setEditingProjectId(null);
  };

  const handleEditTaskStart = (task: any) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDueDate(task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '');
  };

  const handleEditTaskSave = async (id: string) => {
    if (!editTaskTitle.trim()) return;
    let parsedDate: Date | undefined;
    if (editTaskDueDate) {
      parsedDate = new Date(editTaskDueDate + 'T12:00:00');
    }
    await updateTask(id, { title: editTaskTitle.trim(), due_date: parsedDate });
    setEditingTaskId(null);
  };

  const handleAddSubtask = async (parentId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    
    await useTaskStore.getState().addTask(
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

  const handleAddProjectTask = async (projectId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newProjectTaskTitle.trim()) return;
    
    let parsedDate: Date | undefined;
    if (newProjectTaskDueDate) {
      parsedDate = new Date(newProjectTaskDueDate + 'T12:00:00');
    }
    const tagsArray = newProjectTaskTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    await addTask(
      newProjectTaskTitle.trim(),
      projectId, // project_id
      undefined, // parent_id
      (newProjectTaskPriority as 'Low'|'Medium'|'High') || undefined, // priority
      parsedDate, // due_date
      1,          // target counts
      'none',
      tagsArray
    );
    setNewProjectTaskTitle('');
    setNewProjectTaskDueDate('');
    setNewProjectTaskPriority('');
    setNewProjectTaskTags('');
    setAddingTaskToProjectId(null);
  };

  const filteredTasks = tasks
    .filter(t => filterCompleted === 'All' ? true : filterCompleted === 'Active' ? !t.completed : t.completed)
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

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Projects</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Organize your tasks into projects.</p>
      </div>

      <div className="animated-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            placeholder="New project name..."
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          <input
            type="date"
            value={newProjectDueDate}
            onChange={(e) => setNewProjectDueDate(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Add Project
          </button>
        </form>
      </div>

      <div className="animated-card" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Filter size={16} /> Filters:</span>
        
        <select value={filterCompleted} onChange={e => setFilterCompleted(e.target.value as any)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
          <option value="Active">Active Tasks</option>
          <option value="Completed">Completed Tasks</option>
          <option value="All">All Tasks</option>
        </select>

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
        
        {(filterDueDate !== 'All' || filterPriority !== 'All' || filterTag !== 'All' || filterCompleted !== 'Active') && (
          <button 
            onClick={() => { setFilterDueDate('All'); setFilterPriority('All'); setFilterTag('All'); setFilterCompleted('Active'); }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No projects yet. Create one above!
          </div>
        ) : (
          projects.map(project => {
            const projectTasks = filteredTasks.filter(t => t.project_id === project.id && !t.parent_id);
            const allProjectTasks = tasks.filter(t => t.project_id === project.id);
            const completedCount = allProjectTasks.filter(t => t.completed).length;
            
            // If we have filters active, and no tasks match in this project, optionally hide the project entirely?
            // Let's hide it if filteredTasks has no matches for it BUT we have *some* filters on (except just 'Active')
            const hasFilters = filterDueDate !== 'All' || filterPriority !== 'All' || filterTag !== 'All';
            if (hasFilters && projectTasks.length === 0) return null;

            return (
              <div key={project.id} className="animated-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Folder size={24} color={project.color || 'var(--accent-primary)'} />
                    <div>
                      {editingProjectId === project.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <input 
                            type="text" 
                            value={editProjectTitle} 
                            onChange={e => setEditProjectTitle(e.target.value)}
                            style={{ padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                          />
                          <input 
                            type="date" 
                            value={editProjectDueDate} 
                            onChange={e => setEditProjectDueDate(e.target.value)}
                            style={{ padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                          />
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {project.title}
                            </h3>
                            {project.due_date && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Calendar size={12} /> {format(new Date(project.due_date), 'EEE, MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {allProjectTasks.length} {allProjectTasks.length === 1 ? 'task' : 'tasks'}
                            {allProjectTasks.length > 0 && ` • ${completedCount} completed`}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {editingProjectId === project.id ? (
                      <>
                        <button onClick={() => handleEditProjectSave(project.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-success)' }}><Check size={20} /></button>
                        <button onClick={() => setEditingProjectId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleEditProjectStart(project)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                          onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
                          onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="Edit Project"
                        >
                          <Pencil size={20} />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this project? Tasks will be orphaned.')) {
                              deleteProject(project.id);
                            }
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                          onMouseOver={e => e.currentTarget.style.color = 'var(--accent-danger)'}
                          onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="Delete Project"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {projectTasks.length > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {projectTasks.map(task => {
                      const subtasks = tasks.filter(t => t.parent_id === task.id).sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
                      return (
                      <div key={task.id} style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: task.completed ? 0.7 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                          <button 
                            onClick={() => toggleTask(task.id, !task.completed)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.completed ? 'var(--accent-success)' : 'var(--text-secondary)', display: 'flex' }}
                          >
                            {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                          </button>
                          
                          {editingTaskId === task.id ? (
                            <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                              <input 
                                type="text" 
                                value={editTaskTitle} 
                                onChange={e => setEditTaskTitle(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleEditTaskSave(task.id);
                                  if (e.key === 'Escape') setEditingTaskId(null);
                                }}
                                autoFocus
                                style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }}
                              />
                              <input 
                                type="date" 
                                value={editTaskDueDate} 
                                onChange={e => setEditTaskDueDate(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleEditTaskSave(task.id);
                                  if (e.key === 'Escape') setEditingTaskId(null);
                                }}
                                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }}
                              />
                            </div>
                          ) : (
                            <div style={{ flex: 1 }}>
                               <h3 style={{ 
                                 fontSize: '1rem', 
                                 fontWeight: 500, 
                                 textDecoration: task.completed ? 'line-through' : 'none',
                                 color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                                 marginBottom: '0.25rem'
                               }}>
                                 {task.title}
                               </h3>
                               
                               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                               </div>
                               
                               {task.tags && task.tags.length > 0 && (
                                 <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                   {task.tags.map(tag => (
                                     <span 
                                       key={tag}
                                       style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-secondary)', borderRadius: '999px', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}
                                     >
                                       <TagIcon size={10} /> {tag}
                                     </span>
                                   ))}
                                 </div>
                               )}
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                          
                          {editingTaskId === task.id ? (
                            <>
                              <button onClick={() => handleEditTaskSave(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-success)' }}><Check size={20} /></button>
                              <button onClick={() => setEditingTaskId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                            </>
                          ) : (
                            <>
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
                            </>
                          )}
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
                      </div>
                    );})}
                  </div>
                )}

                {/* Add Task to Project Button/Form */}
                {addingTaskToProjectId === project.id ? (
                  <form onSubmit={(e) => handleAddProjectTask(project.id, e)} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', backgroundColor: 'var(--bg-app)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <input 
                      type="text" 
                      value={newProjectTaskTitle} 
                      onChange={e => setNewProjectTaskTitle(e.target.value)} 
                      autoFocus 
                      placeholder="What needs to be done?" 
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }} 
                    />
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                       <input type="date" value={newProjectTaskDueDate} onChange={(e) => setNewProjectTaskDueDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }} title="Due Date" />
                       <select value={newProjectTaskPriority} onChange={e => setNewProjectTaskPriority(e.target.value as any)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                         <option value="">Priority...</option>
                         <option value="High">High</option>
                         <option value="Medium">Medium</option>
                         <option value="Low">Low</option>
                       </select>
                       <input type="text" value={newProjectTaskTags} onChange={(e) => setNewProjectTaskTags(e.target.value)} placeholder="Tags (comma separated)" style={{ flex: 1, minWidth: '150px', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                       <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1rem', fontSize: '0.875rem' }}>Add Task</button>
                       <button type="button" onClick={() => { setAddingTaskToProjectId(null); setNewProjectTaskTitle(''); setNewProjectTaskDueDate(''); setNewProjectTaskPriority(''); setNewProjectTaskTags(''); }} className="btn" style={{ padding: '0.6rem 1rem', fontSize: '0.875rem' }}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <button 
                    onClick={() => setAddingTaskToProjectId(project.id)}
                    className="btn"
                    style={{ marginTop: '0.5rem', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}
                  >
                    <Plus size={18} /> Add Task
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

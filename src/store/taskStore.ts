import { create } from 'zustand';
import type { Task } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addWeeks, addMonths, startOfDay } from 'date-fns';
import { supabase } from '../lib/supabase';

const calculateNextRepeatDay = (currentDate: Date, daysOfWeek: number[]): Date => {
  const currentDay = currentDate.getDay(); // 0 is Sunday
  const sortedDays = [...daysOfWeek].sort((a,b)=>a-b);
  const nextDay = sortedDays.find(d => d > currentDay);
  
  if (nextDay !== undefined) {
    return addDays(currentDate, nextDay - currentDay);
  } else {
    return addDays(currentDate, 7 - currentDay + sortedDays[0]);
  }
};

const createNextRepeatingTask = async (task: Task): Promise<Task | undefined> => {
  if (!task.repeat || task.repeat === 'none') return;
  
  let nextDate = new Date();
  if (task.due_date) {
    nextDate = new Date(task.due_date);
  }
  
  if (task.repeat === 'daily') nextDate = addDays(nextDate, 1);
  else if (task.repeat === 'weekly') {
    if (task.repeat_days && task.repeat_days.length > 0) {
      nextDate = calculateNextRepeatDay(nextDate, task.repeat_days);
    } else {
      nextDate = addWeeks(nextDate, 1);
    }
  }
  else if (task.repeat === 'biweekly') nextDate = addWeeks(nextDate, 2);
  else if (task.repeat === 'monthly') nextDate = addMonths(nextDate, 1);
  
  const newTask: Task = {
    ...task,
    id: uuidv4(),
    completed: false,
    current_count: 0,
    current_duration: 0,
    due_date: startOfDay(nextDate),
    created_at: new Date()
  };
  
  const { error } = await supabase.from('tasks').insert(newTask);
  if (error) console.error("Error creating repeating task: ", error);

  return newTask;
};

interface TaskState {
  tasks: Task[];
  loadTasks: () => Promise<void>;
  addTask: (
    title: string, 
    projectId?: string, 
    parentId?: string, 
    priority?: 'Low' | 'Medium' | 'High', 
    dueDate?: Date, 
    targetCount?: number, 
    repeat?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly',
    tags?: string[],
    repeatDays?: number[],
    targetDuration?: number,
    blockId?: string
  ) => Promise<void>;
  toggleTask: (id: string, completed: boolean) => Promise<void>;
  incrementTask: (id: string) => Promise<void>;
  decrementTask: (id: string) => Promise<void>;
  addDurationToTask: (id: string, duration: number) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  reorderTasks: (updates: { id: string, order: number }[]) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  loadTasks: async () => {
    const { data: tasks, error } = await supabase.from('tasks').select('*');
    if (error) {
      console.error("Error loading tasks:", error);
      return;
    }
    set({ tasks: tasks || [] });
  },
  addTask: async (title, projectId, parentId, priority, dueDate, targetCount = 1, repeat = 'none', tags = [], repeatDays = [], targetDuration, blockId) => {
    const newTask: Task = {
      id: uuidv4(),
      title,
      project_id: projectId,
      parent_id: parentId,
      priority,
      completed: false,
      due_date: dueDate ? startOfDay(dueDate) : undefined,
      created_at: new Date(),
      target_count: targetCount,
      current_count: 0,
      target_duration: targetDuration,
      current_duration: 0,
      repeat: repeat === 'none' ? undefined : repeat,
      tags: tags.length > 0 ? tags : undefined,
      repeat_days: repeatDays.length > 0 ? repeatDays : undefined,
      block_id: blockId || undefined,
      order: Date.now() // default to a high sort order initially
    };
    
    const { error } = await supabase.from('tasks').insert(newTask);
    if (!error) {
      set((state) => ({ tasks: [...state.tasks, newTask] }));
    } else {
      console.error("Error adding task:", error);
    }
  },
  toggleTask: async (id, completed) => {
    const task = useTaskStore.getState().tasks.find(t => t.id === id);
    if (!task) return;
    const target = task.target_count || 1;
    const newCurrent = completed ? target : 0;
    
    await supabase.from('tasks').update({ completed, current_count: newCurrent }).eq('id', id);
    
    let newTask: Task | undefined;
    if (completed && task.repeat && task.repeat !== 'none' && !task.completed) {
      newTask = await createNextRepeatingTask(task);
    }
    
    set((state) => {
      const updatedTasks = state.tasks.map(t => t.id === id ? { ...t, completed, current_count: newCurrent } : t);
      return { tasks: newTask ? [...updatedTasks, newTask] : updatedTasks };
    });
  },
  incrementTask: async (id) => {
    const task = useTaskStore.getState().tasks.find(t => t.id === id);
    if (!task || task.completed) return;
    
    const newCurrent = (task.current_count || 0) + 1;
    const target = task.target_count || 1;
    const isCompleted = newCurrent >= target;
    
    await supabase.from('tasks').update({ current_count: newCurrent, completed: isCompleted }).eq('id', id);
    
    let newTask: Task | undefined;
    if (isCompleted && task.repeat && task.repeat !== 'none' && !task.completed) {
      newTask = await createNextRepeatingTask(task);
    }
    
    set((state) => {
      const updatedTasks = state.tasks.map(t => t.id === id ? { ...t, current_count: newCurrent, completed: isCompleted } : t);
      return { tasks: newTask ? [...updatedTasks, newTask] : updatedTasks };
    });
  },
  decrementTask: async (id) => {
    const task = useTaskStore.getState().tasks.find(t => t.id === id);
    if (!task) return;
    
    const newCurrent = Math.max(0, (task.current_count || 0) - 1);
    await supabase.from('tasks').update({ current_count: newCurrent, completed: false }).eq('id', id);
    
    set((state) => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, current_count: newCurrent, completed: false } : t)
    }));
  },
  addDurationToTask: async (id, duration) => {
    const task = useTaskStore.getState().tasks.find(t => t.id === id);
    if (!task || task.completed || !task.target_duration) return;
    
    const newCurrent = (task.current_duration || 0) + duration;
    const target = task.target_duration;
    const isCompleted = newCurrent >= target;
    
    const updates: Partial<Task> = { current_duration: newCurrent, completed: isCompleted };
    if (isCompleted && task.target_count) {
      updates.current_count = task.target_count;
    }
    
    await supabase.from('tasks').update(updates).eq('id', id);
    
    let newTask: Task | undefined;
    if (isCompleted && task.repeat && task.repeat !== 'none' && !task.completed) {
      newTask = await createNextRepeatingTask(task);
    }
    
    set((state) => {
      const updatedTasks = state.tasks.map(t => t.id === id ? { ...t, ...updates } : t);
      return { tasks: newTask ? [...updatedTasks, newTask] : updatedTasks };
    });
  },
  updateTask: async (id, updates) => {
    if (updates.due_date) {
      updates.due_date = startOfDay(updates.due_date);
    }
    await supabase.from('tasks').update(updates).eq('id', id);
    set((state) => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  },
  deleteTask: async (id) => {
    await supabase.from('tasks').delete().eq('id', id);
    await supabase.from('tasks').delete().eq('parent_id', id);
    
    set((state) => ({
      tasks: state.tasks.filter(t => t.id !== id && t.parent_id !== id)
    }));
  },
  clearCompleted: async () => {
    const state = useTaskStore.getState();
    const completedIds = state.tasks.filter(t => t.completed).map(t => t.id);
    
    if (completedIds.length > 0) {
      await supabase.from('tasks').delete().in('id', completedIds);
      set({ tasks: state.tasks.filter(t => !t.completed) });
    }
  },
  reorderTasks: async (updates) => {
    // Supabase doesn't have a built-in bulk update, so we'll do it sequentially or via map
    await Promise.all(updates.map(u => supabase.from('tasks').update({ order: u.order }).eq('id', u.id)));
    
    set(state => {
      const updatedTasks = state.tasks.map(t => {
        const update = updates.find(u => u.id === t.id);
        if (update) {
          return { ...t, order: update.order };
        }
        return t;
      });
      return { tasks: updatedTasks };
    });
  }
}));

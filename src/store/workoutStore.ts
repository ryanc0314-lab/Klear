import { create } from 'zustand';
import type { Workout, WorkoutSet, WorkoutPlan, PlannedExercise } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

interface WorkoutState {
  workouts: Workout[];
  workoutSets: Record<string, WorkoutSet[]>;
  workoutPlans: WorkoutPlan[];
  
  loadWorkouts: () => Promise<void>;
  addWorkout: (name: string, date: Date, notes?: string) => Promise<string>;
  deleteWorkout: (id: string) => Promise<void>;
  updateWorkout: (id: string, data: Partial<Workout>) => Promise<void>;
  
  loadWorkoutSets: (workoutId: string) => Promise<void>;
  addWorkoutSet: (workoutId: string, data: Omit<WorkoutSet, 'id' | 'workout_id'>) => Promise<void>;
  deleteWorkoutSet: (setId: string, workoutId: string) => Promise<void>;
  updateWorkoutSet: (setId: string, workoutId: string, data: Partial<WorkoutSet>) => Promise<void>;
  
  loadPlans: () => Promise<void>;
  savePlan: (dayOfWeek: number, category: string, exercises: PlannedExercise[]) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: [],
  workoutSets: {},
  workoutPlans: [],
  
  loadWorkouts: async () => {
    const { data: workouts, error } = await supabase.from('workouts').select('*').order('date', { ascending: false });
    if (error) {
      console.error("Error loading workouts:", error);
      return;
    }
    
    // Map date strings back to Date objects
    const mappedWorkouts = (workouts || []).map(w => ({
      ...w,
      date: new Date(w.date)
    }));
    
    set({ workouts: mappedWorkouts });
  },
  
  addWorkout: async (name, date, notes) => {
    const newWorkout: Workout = {
      id: uuidv4(),
      name,
      date,
      notes
    };
    
    const payload = { ...newWorkout, date: newWorkout.date.toISOString(), images: [] }; // Strip blobs for DB insert
    await supabase.from('workouts').insert(payload);
    
    get().loadWorkouts();
    return newWorkout.id;
  },
  
  deleteWorkout: async (id) => {
    // Foreign key deletes sets automatically if configured, otherwise explicitly delete
    await supabase.from('workout_sets').delete().eq('workout_id', id);
    await supabase.from('workouts').delete().eq('id', id);
    
    get().loadWorkouts();
  },
  
  updateWorkout: async (id, data) => {
    const payload: any = { ...data };
    if (data.date) payload.date = data.date.toISOString();
    if (data.images) payload.images = []; // Ignore images for raw database sync
    
    await supabase.from('workouts').update(payload).eq('id', id);
    get().loadWorkouts();
  },
  
  loadWorkoutSets: async (workoutId) => {
    const { data: sets, error } = await supabase.from('workout_sets').select('*').eq('workout_id', workoutId);
    if (error) {
      console.error(`Error loading sets for workout ${workoutId}:`, error);
      return;
    }
    set((state) => ({
      workoutSets: { ...state.workoutSets, [workoutId]: sets || [] }
    }));
  },
  
  addWorkoutSet: async (workoutId, data) => {
    const newSet: WorkoutSet = {
      id: uuidv4(),
      workout_id: workoutId,
      ...data
    };
    await supabase.from('workout_sets').insert(newSet);
    get().loadWorkoutSets(workoutId);
  },
  
  deleteWorkoutSet: async (setId, workoutId) => {
    await supabase.from('workout_sets').delete().eq('id', setId);
    get().loadWorkoutSets(workoutId);
  },
  
  updateWorkoutSet: async (setId, workoutId, data) => {
    await supabase.from('workout_sets').update(data).eq('id', setId);
    get().loadWorkoutSets(workoutId);
  },
  
  loadPlans: async () => {
    const { data: plans } = await supabase.from('workout_plans').select('*');
    if (plans) {
      set({ workoutPlans: plans });
    }
  },
  
  savePlan: async (dayOfWeek, category, exercises) => {
    const { data: existingList } = await supabase.from('workout_plans').select('*').eq('day_of_week', dayOfWeek);
    const existing = existingList?.[0];
    
    if (existing) {
      await supabase.from('workout_plans').update({ category, exercises }).eq('id', existing.id);
    } else {
      await supabase.from('workout_plans').insert({
        id: uuidv4(),
        day_of_week: dayOfWeek,
        category,
        exercises
      });
    }
    get().loadPlans();
  }
}));

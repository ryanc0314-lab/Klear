import { create } from 'zustand';
import type { Habit, HabitLog } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  loadHabits: () => Promise<void>;
  addHabit: (name: string, type: Habit['type'], target?: number, weekly_target?: number, unit?: string, tags?: { id: string; name: string; color: string }[]) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  restoreHabit: (id: string) => Promise<void>;
  clearArchivedHabits: () => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  logHabit: (habitId: string, _date: Date, value: number, notes?: string) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set) => ({
  habits: [],
  logs: [],
  loadHabits: async () => {
    const { data: habits } = await supabase.from('habits').select('*');
    const { data: logs } = await supabase.from('habit_logs').select('*');
    set({ habits: habits || [], logs: logs || [] });
  },
  addHabit: async (name, type, target, weekly_target, unit, tags = []) => {
    const newHabit: Habit = {
      id: uuidv4(),
      name,
      type,
      target,
      weekly_target,
      unit,
      tags,
      created_at: new Date()
    };
    
    // Convert Date to ISO string before pushing to Supabase
    const payload = { ...newHabit, created_at: newHabit.created_at.toISOString() };
    await supabase.from('habits').insert(payload);
    
    useHabitStore.getState().loadHabits();
  },
  updateHabit: async (id, updates) => {
    await supabase.from('habits').update(updates).eq('id', id);
    useHabitStore.getState().loadHabits();
  },
  archiveHabit: async (id) => {
    await supabase.from('habits').update({ archived: true }).eq('id', id);
    useHabitStore.getState().loadHabits();
  },
  restoreHabit: async (id) => {
    await supabase.from('habits').update({ archived: false }).eq('id', id);
    useHabitStore.getState().loadHabits();
  },
  clearArchivedHabits: async () => {
    // Delete all archived habits (foreign key constraint will cascade and delete logs)
    await supabase.from('habits').delete().eq('archived', true);
    useHabitStore.getState().loadHabits();
  },
  deleteHabit: async (id) => {
    // Delete habit (foreign key constraint deletes associated logs automatically)
    await supabase.from('habits').delete().eq('id', id);
    useHabitStore.getState().loadHabits();
  },
  logHabit: async (habitId, date, value, notes) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check if log already exists for date
    const { data: existingLogs } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('date', dateStr);

    const existing = existingLogs?.[0];

    if (existing) {
      await supabase.from('habit_logs').update({ value, notes }).eq('id', existing.id);
    } else {
      await supabase.from('habit_logs').insert({
        id: uuidv4(),
        habit_id: habitId,
        date: dateStr,
        value,
        notes
      });
    }
    useHabitStore.getState().loadHabits();
  }
}));

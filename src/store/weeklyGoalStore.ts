import { create } from 'zustand';
import type { WeeklyGoal } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { getBiWeeklyPeriod } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';

interface WeeklyGoalState {
  currentGoal: WeeklyGoal | null;
  allGoals: WeeklyGoal[];
  loadGoal: (date: Date) => Promise<void>;
  loadAllGoals: () => Promise<void>;
  saveGoal: (date: Date, text: string) => Promise<void>;
}

export const useWeeklyGoalStore = create<WeeklyGoalState>((set, get) => ({
  currentGoal: null,
  allGoals: [],
  loadGoal: async (date) => {
    const { periodStart } = getBiWeeklyPeriod(date);
    const weekStart = format(periodStart, 'yyyy-MM-dd');
    const { data: existingList, error } = await supabase.from('weekly_goals').select('*').eq('week_start', weekStart);
    
    if (error) {
      console.error('Error loading weekly goal:', error);
      return;
    }
    
    set({ currentGoal: existingList?.[0] || null });
  },
  saveGoal: async (date, text) => {
    const { periodStart } = getBiWeeklyPeriod(date);
    const weekStart = format(periodStart, 'yyyy-MM-dd');
    const { currentGoal } = get();

    if (currentGoal && currentGoal.week_start === weekStart) {
      // If we already have the goal loaded in state, update that specific one
      await supabase.from('weekly_goals').update({ text }).eq('id', currentGoal.id);
      set({ currentGoal: { ...currentGoal, text } });
    } else {
      // Look it up otherwise
      const { data: existingList } = await supabase.from('weekly_goals').select('*').eq('week_start', weekStart);
      const existing = existingList?.[0];
      
      if (existing) {
        await supabase.from('weekly_goals').update({ text }).eq('id', existing.id);
        set({ currentGoal: { ...existing, text } });
      } else {
        const newGoal: WeeklyGoal = {
          id: uuidv4(),
          week_start: weekStart,
          text
        };
        await supabase.from('weekly_goals').insert(newGoal);
        set({ currentGoal: newGoal });
      }
    }
  },
  loadAllGoals: async () => {
    const { data, error } = await supabase.from('weekly_goals').select('*').order('week_start', { ascending: false });
    if (error) {
      console.error('Error loading all weekly goals:', error);
      return;
    }
    set({ allGoals: data || [] });
  }
}));

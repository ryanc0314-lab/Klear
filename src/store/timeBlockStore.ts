import { create } from 'zustand';
import type { TimeBlock } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

interface TimeBlockState {
  timeBlocks: TimeBlock[];
  loadTimeBlocks: () => Promise<void>;
  addTimeBlock: (date: string, title: string, start_time: string, end_time: string, color: string) => Promise<void>;
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => Promise<void>;
  deleteTimeBlock: (id: string) => Promise<void>;
}

export const useTimeBlockStore = create<TimeBlockState>((set) => ({
  timeBlocks: [],
  loadTimeBlocks: async () => {
    const { data: timeBlocks, error } = await supabase.from('time_blocks').select('*');
    if (error) {
      console.error('Error loading time blocks:', error);
      return;
    }
    set({ timeBlocks: timeBlocks || [] });
  },
  addTimeBlock: async (date, title, start_time, end_time, color) => {
    const newBlock: TimeBlock = {
      id: uuidv4(),
      date,
      title,
      start_time,
      end_time,
      color
    };
    await supabase.from('time_blocks').insert(newBlock);
    set((state) => ({ timeBlocks: [...state.timeBlocks, newBlock] }));
  },
  updateTimeBlock: async (id, updates) => {
    await supabase.from('time_blocks').update(updates).eq('id', id);
    set((state) => ({
      timeBlocks: state.timeBlocks.map(tb => tb.id === id ? { ...tb, ...updates } : tb)
    }));
  },
  deleteTimeBlock: async (id) => {
    await supabase.from('time_blocks').delete().eq('id', id);
    set((state) => ({
      timeBlocks: state.timeBlocks.filter(tb => tb.id !== id)
    }));
  }
}));

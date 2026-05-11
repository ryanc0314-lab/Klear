import { create } from 'zustand';
import type { DailyIntention } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

interface DailyIntentionState {
  currentIntention: DailyIntention | null;
  loadIntention: (date: Date) => Promise<void>;
  saveIntention: (date: Date, text: string) => Promise<void>;
}

export const useDailyIntentionStore = create<DailyIntentionState>((set, get) => ({
  currentIntention: null,
  loadIntention: async (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const { data: existingList, error } = await supabase.from('daily_intentions').select('*').eq('date', dateStr);
    
    if (error) {
      console.error('Error loading daily intention:', error);
      return;
    }
    
    set({ currentIntention: existingList?.[0] || null });
  },
  saveIntention: async (date, text) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const { currentIntention } = get();

    if (currentIntention && currentIntention.date === dateStr) {
      // If we already have the intention loaded in state, update that specific one
      await supabase.from('daily_intentions').update({ text }).eq('id', currentIntention.id);
      set({ currentIntention: { ...currentIntention, text } });
    } else {
      // Look it up otherwise
      const { data: existingList } = await supabase.from('daily_intentions').select('*').eq('date', dateStr);
      const existing = existingList?.[0];
      
      if (existing) {
        await supabase.from('daily_intentions').update({ text }).eq('id', existing.id);
        set({ currentIntention: { ...existing, text } });
      } else {
        const newIntention: DailyIntention = {
          id: uuidv4(),
          date: dateStr,
          text
        };
        await supabase.from('daily_intentions').insert(newIntention);
        set({ currentIntention: newIntention });
      }
    }
  }
}));

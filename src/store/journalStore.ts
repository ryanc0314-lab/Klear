import { create } from 'zustand';
import type { JournalEntry } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

interface JournalState {
  entries: JournalEntry[];
  loadEntries: () => Promise<void>;
  addEntry: (text: string, mood?: number, anxiety?: number, tags?: string[], sleepQuality?: number, sleepHours?: number, sleepStart?: string, sleepEnd?: string, sleepNotes?: string) => Promise<void>;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

export const useJournalStore = create<JournalState>((set) => ({
  entries: [],
  loadEntries: async () => {
    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) {
      console.error("Error loading journal entries:", error);
      return;
    }
    
    const mappedEntries = (entries || []).map(e => ({
      ...e,
      date: new Date(e.date)
    }));
    
    set({ entries: mappedEntries });
  },
  addEntry: async (text, mood, anxiety, tags = [], sleepQuality, sleepHours, sleepStart, sleepEnd, sleepNotes) => {
    const newEntry: JournalEntry = {
      id: uuidv4(),
      date: new Date(),
      text,
      mood,
      anxiety,
      tags,
      sleep_quality: sleepQuality,
      sleep_hours: sleepHours,
      sleep_start: sleepStart,
      sleep_end: sleepEnd,
      sleep_notes: sleepNotes
    };
    
    const payload = {
      ...newEntry,
      date: newEntry.date.toISOString()
    };
    
    await supabase.from('journal_entries').insert(payload);
    useJournalStore.getState().loadEntries();
  },
  updateEntry: async (id: string, updates: Partial<JournalEntry>) => {
    const payload: any = { ...updates };
    if (updates.date) payload.date = updates.date.toISOString();
    
    await supabase.from('journal_entries').update(payload).eq('id', id);
    useJournalStore.getState().loadEntries();
  },
  deleteEntry: async (id: string) => {
    await supabase.from('journal_entries').delete().eq('id', id);
    useJournalStore.getState().loadEntries();
  }
}));

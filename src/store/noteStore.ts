import { create } from 'zustand';
import type { Note } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

interface NoteState {
  notes: Note[];
  loadNotes: () => Promise<void>;
  addNote: (title: string, content: string, tags?: string[]) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  loadNotes: async () => {
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error loading notes:", error);
      return;
    }
    
    const mappedNotes = (notes || []).map(n => ({
      ...n,
      created_at: new Date(n.created_at),
      updated_at: n.updated_at ? new Date(n.updated_at) : undefined
    }));
    
    set({ notes: mappedNotes });
  },
  addNote: async (title, content, tags = []) => {
    const newNote: Note = {
      id: uuidv4(),
      title,
      content,
      created_at: new Date(),
      updated_at: new Date(),
      tags
    };
    
    const payload = {
      ...newNote,
      created_at: newNote.created_at.toISOString(),
      updated_at: newNote.updated_at!.toISOString()
    };
    
    const { error } = await supabase.from('notes').insert(payload);
    if (error) {
      console.error("Error creating note:", error);
      alert(`Failed to save note. Please check your database. Error: ${error.message}`);
      return;
    }
    useNoteStore.getState().loadNotes();
  },
  updateNote: async (id: string, updates: Partial<Note>) => {
    const payload: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.created_at) payload.created_at = updates.created_at.toISOString();
    
    const { error } = await supabase.from('notes').update(payload).eq('id', id);
    if (error) {
      console.error("Error updating note:", error);
      alert(`Failed to update note: ${error.message}`);
      return;
    }
    useNoteStore.getState().loadNotes();
  },
  deleteNote: async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) {
      console.error("Error deleting note:", error);
      alert(`Failed to delete note: ${error.message}`);
      return;
    }
    useNoteStore.getState().loadNotes();
  }
}));

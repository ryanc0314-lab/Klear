import { create } from 'zustand';
import type { Project } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

interface ProjectState {
  projects: Project[];
  loadProjects: () => Promise<void>;
  addProject: (title: string, description?: string, color?: string, dueDate?: Date) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  loadProjects: async () => {
    const { data: projects, error } = await supabase.from('projects').select('*');
    if (error) {
      console.error("Error loading projects:", error);
      return;
    }
    
    // Map string dates back to Date objects to satisfy the UI interface expectations
    const mappedProjects = (projects || []).map(p => ({
      ...p,
      created_at: new Date(p.created_at),
      due_date: p.due_date ? new Date(p.due_date) : undefined
    }));
    
    set({ projects: mappedProjects });
  },
  addProject: async (title, description, color, dueDate) => {
    const newProject: Project = {
      id: uuidv4(),
      title,
      description,
      color: color || 'var(--accent-primary)',
      created_at: new Date(),
      due_date: dueDate
    };
    
    // Convert Dates to ISO string for Supabase payload
    const payload = {
      ...newProject,
      created_at: newProject.created_at.toISOString(),
      due_date: newProject.due_date ? newProject.due_date.toISOString() : null
    };
    
    const { error } = await supabase.from('projects').insert(payload);
    if (!error) {
      set((state) => ({ projects: [...state.projects, newProject] }));
    } else {
      console.error("Error adding project:", error);
    }
  },
  updateProject: async (id, updates) => {
    const payload: any = { ...updates };
    if (updates.due_date) payload.due_date = updates.due_date.toISOString();
    
    await supabase.from('projects').update(payload).eq('id', id);
    set((state) => ({
      projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  },
  deleteProject: async (id) => {
    // Unlink tasks that belonged to this project by setting to null in Supabase
    await supabase.from('tasks').update({ project_id: null }).eq('project_id', id);
    
    // Delete project
    await supabase.from('projects').delete().eq('id', id);
    
    set((state) => ({
      projects: state.projects.filter(p => p.id !== id)
    }));
  }
}));

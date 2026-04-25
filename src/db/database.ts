

export interface Task {
  id: string;
  title: string;
  description?: string;
  project_id?: string;
  parent_id?: string;
  priority?: 'Low' | 'Medium' | 'High';
  completed: boolean;
  order?: number;
  due_date?: Date;
  created_at: Date;
  target_count?: number;
  current_count?: number;
  repeat?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  tags?: string[];
  repeat_days?: number[];
  target_duration?: number;
  current_duration?: number;
  block_id?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  color?: string;
  created_at: Date;
  due_date?: Date;
}

export interface Habit {
  id: string;
  name: string;
  type: 'boolean' | 'count' | 'timer';
  target?: number;
  weekly_target?: number;
  unit?: string;
  tags?: { id: string; name: string; color: string }[];
  created_at: Date;
  archived?: boolean;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  value: number; // 0 or 1 for boolean, actual count for others
  notes?: string;
}

export interface Workout {
  id: string;
  date: Date;
  name: string;
  notes?: string;
  images?: Blob[]; // Store photos locally
}

export interface WorkoutSetInfo {
  reps?: number;
  weight?: number;
  duration?: number;
  duration_unit?: 'min' | 'sec';
  completed?: boolean;
}

export interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  duration?: number;
  duration_unit?: 'min' | 'sec';
  rest_time?: number; // mostly in seconds
  notes?: string;
  set_details?: WorkoutSetInfo[];
}

export interface PlannedExercise {
  name: string;
  targetSets?: number;
  targetReps?: number;
  targetDuration?: number;
  targetDurationUnit?: 'min' | 'sec';
  targetWeight?: number;
  targetRest?: number; // seconds
  notes?: string;
  set_details?: {
    reps?: number;
    weight?: number;
    duration?: number;
    duration_unit?: 'min' | 'sec';
  }[];
}

export interface WorkoutPlan {
  id: string;
  day_of_week: number; // 0 (Sun) to 6 (Sat)
  category: string;
  exercises: PlannedExercise[];
}

export interface JournalEntry {
  id: string;
  date: Date;
  text: string;
  mood?: number; // 1-5 scale
  anxiety?: number; // 1-5 scale
  sleep_quality?: number; // 1-5 scale
  sleep_hours?: number;
  sleep_start?: string;
  sleep_end?: string;
  sleep_notes?: string;
  tags: string[];
}

export interface TimeBlock {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  color: string;
}

export interface WeeklyGoal {
  id: string;
  week_start: string; // YYYY-MM-DD
  text: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: Date;
  updated_at?: Date;
  tags?: string[];
}


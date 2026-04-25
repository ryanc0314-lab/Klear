import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';

// Placeholder Pages
import { TaskDashboard } from './components/Tasks/TaskDashboard';
import { HabitDashboard } from './components/Habits/HabitDashboard';
import { WorkoutDashboard } from './components/Workouts/WorkoutDashboard';
import { JournalDashboard } from './components/Journal/JournalDashboard';
import { LifeDashboard } from './components/Dashboard/LifeDashboard';
import { ProjectDashboard } from './components/Projects/ProjectDashboard';
import { StatsDashboard } from './components/Stats/StatsDashboard';
import { NotesDashboard } from './components/Notes/NotesDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LifeDashboard />} />
          <Route path="projects" element={<ProjectDashboard />} />
          <Route path="tasks" element={<TaskDashboard />} />
          <Route path="habits" element={<HabitDashboard />} />
          <Route path="workouts" element={<WorkoutDashboard />} />
          <Route path="journal" element={<JournalDashboard />} />
          <Route path="stats" element={<StatsDashboard />} />
          <Route path="notes" element={<NotesDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

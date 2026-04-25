import { ResponsiveLine } from '@nivo/line';
import { format, subDays } from 'date-fns';
import { useJournalStore } from '../../store/journalStore';
import { useTaskStore } from '../../store/taskStore';
import { useWorkoutStore } from '../../store/workoutStore';
import { useHabitStore } from '../../store/habitStore';
import { useEffect, useMemo } from 'react';
import { CheckCircle2, Dumbbell, Flame } from 'lucide-react';

export const LifeDashboard = () => {
  const { entries, loadEntries } = useJournalStore();
  const { tasks, loadTasks } = useTaskStore();
  const { workouts, loadWorkouts } = useWorkoutStore();
  const { logs, loadHabits } = useHabitStore();

  useEffect(() => {
    loadEntries();
    loadTasks();
    loadWorkouts();
    loadHabits();
  }, [loadEntries, loadTasks, loadWorkouts, loadHabits]);

  const now = new Date();

  // 1. Accomplishments Summary
  const recentTasks = useMemo(() => tasks.filter(t => t.completed && new Date(t.created_at) >= subDays(now, 30)).length, [tasks, now]);
  const recentWorkouts = useMemo(() => workouts.filter(w => new Date(w.date) >= subDays(now, 30)).length, [workouts, now]);
  const recentHabits = useMemo(() => logs.filter(l => new Date(l.date) >= subDays(now, 30) && l.value > 0).length, [logs, now]);

  // 2. Line Chart Data (Mood)
  const moodLineData = useMemo(() => {
    const moodData = [];
    for (let i = 13; i >= 0; i--) {
      const dDate = subDays(now, i);
      const dayEntries = entries.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === format(dDate, 'yyyy-MM-dd'));
      let avgMood = null;
      if (dayEntries.length > 0) {
        const moods = dayEntries.map(e => e.mood).filter(m => m !== undefined) as number[];
        if (moods.length) avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
      }
      if (avgMood !== null) moodData.push({ x: format(dDate, 'yyyy-MM-dd'), y: avgMood });
    }
    return [{ id: 'Mood', color: 'var(--accent-primary)', data: moodData }];
  }, [entries, now]);

  // 3. Line Chart Data (Anxiety)
  const anxietyLineData = useMemo(() => {
    const anxietyData = [];
    for (let i = 13; i >= 0; i--) {
      const dDate = subDays(now, i);
      const dayEntries = entries.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === format(dDate, 'yyyy-MM-dd'));
      let avgAnxiety = null;
      if (dayEntries.length > 0) {
        const anxieties = dayEntries.map(e => e.anxiety).filter(a => a !== undefined) as number[];
        if (anxieties.length) avgAnxiety = anxieties.reduce((a, b) => a + b, 0) / anxieties.length;
      }
      if (avgAnxiety !== null) anxietyData.push({ x: format(dDate, 'yyyy-MM-dd'), y: avgAnxiety });
    }
    return [{ id: 'Anxiety', color: 'var(--accent-danger)', data: anxietyData }];
  }, [entries, now]);

  // 4. Line Chart Data (Sleep Quality)
  const sleepQualityData = useMemo(() => {
    const qualityData = [];
    for (let i = 13; i >= 0; i--) {
      const dDate = subDays(now, i);
      const dayEntries = entries.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === format(dDate, 'yyyy-MM-dd'));
      let avgQuality = null;
      if (dayEntries.length > 0) {
        const qualities = dayEntries.map(e => e.sleep_quality).filter(a => a !== undefined) as number[];
        if (qualities.length) avgQuality = qualities.reduce((a, b) => a + b, 0) / qualities.length;
      }
      if (avgQuality !== null) qualityData.push({ x: format(dDate, 'yyyy-MM-dd'), y: avgQuality });
    }
    return [{ id: 'Sleep Quality', color: '#9b59b6', data: qualityData }];
  }, [entries, now]);

  // 5. Line Chart Data (Sleep Hours)
  const sleepHoursData = useMemo(() => {
    const hoursData = [];
    for (let i = 13; i >= 0; i--) {
      const dDate = subDays(now, i);
      const dayEntries = entries.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === format(dDate, 'yyyy-MM-dd'));
      let avgHours = null;
      if (dayEntries.length > 0) {
        const hours = dayEntries.map(e => e.sleep_hours).filter(a => a !== undefined) as number[];
        if (hours.length) avgHours = hours.reduce((a, b) => a + b, 0) / hours.length;
      }
      if (avgHours !== null) hoursData.push({ x: format(dDate, 'yyyy-MM-dd'), y: avgHours });
    }
    return [{ id: 'Sleep Hours', color: 'var(--accent-secondary)', data: hoursData }];
  }, [entries, now]);

  // 6. Line Chart Data (Sleep Timing)
  const sleepTimingData = useMemo(() => {
    const sleepStartData = [];
    const sleepEndData = [];
    for (let i = 13; i >= 0; i--) {
      const dDate = subDays(now, i);
      const dayEntries = entries.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === format(dDate, 'yyyy-MM-dd'));
      
      let avgStart = null;
      let avgEnd = null;
      
      if (dayEntries.length > 0) {
        const starts = dayEntries.map(e => e.sleep_start).filter(a => !!a) as string[];
        const ends = dayEntries.map(e => e.sleep_end).filter(a => !!a) as string[];
        
        if (starts.length) {
          avgStart = starts.reduce((acc, val) => {
            const [h, m] = val.split(':').map(Number);
            let time = h + m / 60;
            if (time < 12) time += 24; 
            return acc + time;
          }, 0) / starts.length;
        }
        
        if (ends.length) {
          avgEnd = ends.reduce((acc, val) => {
            const [h, m] = val.split(':').map(Number);
            return acc + (h + m / 60);
          }, 0) / ends.length;
        }
      }
      
      if (avgStart !== null) sleepStartData.push({ x: format(dDate, 'yyyy-MM-dd'), y: avgStart });
      if (avgEnd !== null) sleepEndData.push({ x: format(dDate, 'yyyy-MM-dd'), y: avgEnd });
    }
    return [
      { id: 'Bedtime', color: '#34495e', data: sleepStartData },
      { id: 'Wake Time', color: '#f1c40f', data: sleepEndData }
    ];
  }, [entries, now]);

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Life Overview</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Your data, synthesized. Spot trends and optimize your routines.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
            <option>Last 14 Days</option>
            <option>Last 30 Days</option>
            <option>This Year</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {/* Accomplishments Summary */}
        <div className="animated-card" style={{ padding: '2rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Accomplishments (Last 30 Days)</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyItems: 'center', margin: 'auto 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', backgroundColor: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)' }}>
              <CheckCircle2 size={32} color="var(--accent-success)" />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{recentTasks}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Tasks Completed</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', backgroundColor: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)' }}>
              <Flame size={32} color="var(--accent-secondary)" />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{recentHabits}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Habit Logs</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', backgroundColor: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)' }}>
              <Dumbbell size={32} color="var(--accent-primary)" />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{recentWorkouts}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Workouts Logged</div>
              </div>
            </div>
          </div>
        </div>

        {/* Line Chart: Mood Trends */}
        <div className="animated-card" style={{ padding: '2rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Mood Trends</h3>
          </div>
          <div style={{ flex: 1 }}>
            {moodLineData[0].data.length > 1 ? (
              <ResponsiveLine
                data={moodLineData}
                margin={{ top: 20, right: 20, bottom: 60, left: 40 }}
                xScale={{ type: 'time', format: '%Y-%m-%d', precision: 'day' }}
                yScale={{ type: 'linear', min: 1, max: 5, stacked: false, reverse: false }}
                xFormat="time:%Y-%m-%d"
                yFormat=" >-.1f"
                curve="monotoneX"
                axisTop={null}
                axisRight={null}
                axisBottom={{ format: '%b %d', tickSize: 5, tickPadding: 5, tickRotation: -45, tickValues: 'every 1 day' }}
                axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0, tickValues: [1, 2, 3, 4, 5] }}
                enableGridX={false}
                pointSize={8}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                enableArea={true}
                areaOpacity={0.1}
                useMesh={true}
                colors={['var(--accent-primary)']}
                theme={{
                  axis: {
                    ticks: { text: { fill: 'var(--text-secondary)' } },
                    domain: { line: { stroke: 'var(--border-color)' } }
                  },
                  grid: { line: { stroke: 'var(--border-color)', strokeDasharray: '4 4' } },
                  crosshair: { line: { stroke: 'var(--accent-primary)' } }
                }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Requires at least 2 days of logs to establish a mood trend.
              </div>
            )}
          </div>
        </div>

        {/* Line Chart: Anxiety Trends */}
        <div className="animated-card" style={{ padding: '2rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Anxiety Trends</h3>
          </div>
          <div style={{ flex: 1 }}>
            {anxietyLineData[0].data.length > 1 ? (
              <ResponsiveLine
                data={anxietyLineData}
                margin={{ top: 20, right: 20, bottom: 60, left: 40 }}
                xScale={{ type: 'time', format: '%Y-%m-%d', precision: 'day' }}
                yScale={{ type: 'linear', min: 1, max: 5, stacked: false, reverse: false }}
                xFormat="time:%Y-%m-%d"
                yFormat=" >-.1f"
                curve="monotoneX"
                axisTop={null}
                axisRight={null}
                axisBottom={{ format: '%b %d', tickSize: 5, tickPadding: 5, tickRotation: -45, tickValues: 'every 1 day' }}
                axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0, tickValues: [1, 2, 3, 4, 5] }}
                enableGridX={false}
                pointSize={8}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                enableArea={true}
                areaOpacity={0.1}
                useMesh={true}
                colors={['var(--accent-danger)']}
                theme={{
                  axis: {
                    ticks: { text: { fill: 'var(--text-secondary)' } },
                    domain: { line: { stroke: 'var(--border-color)' } }
                  },
                  grid: { line: { stroke: 'var(--border-color)', strokeDasharray: '4 4' } },
                  crosshair: { line: { stroke: 'var(--accent-danger)' } }
                }}
              />
            ) : (
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                 Requires at least 2 days of logs to map anxiety levels.
               </div>
            )}
          </div>
        </div>

        {/* Line Chart: Sleep Quality */}
        <div className="animated-card" style={{ padding: '2rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Sleep Quality</h3>
          </div>
          <div style={{ flex: 1 }}>
            {sleepQualityData[0].data.length > 1 ? (
              <ResponsiveLine
                data={sleepQualityData}
                margin={{ top: 20, right: 20, bottom: 60, left: 40 }}
                xScale={{ type: 'time', format: '%Y-%m-%d', precision: 'day' }}
                yScale={{ type: 'linear', min: 1, max: 5, stacked: false, reverse: false }}
                xFormat="time:%Y-%m-%d"
                yFormat=" >-.1f"
                curve="monotoneX"
                axisTop={null}
                axisRight={null}
                axisBottom={{ format: '%b %d', tickSize: 5, tickPadding: 5, tickRotation: -45, tickValues: 'every 1 day' }}
                axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0, tickValues: [1, 2, 3, 4, 5] }}
                enableGridX={false}
                pointSize={8}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                enableArea={true}
                areaOpacity={0.1}
                useMesh={true}
                colors={['#9b59b6']}
                theme={{
                  axis: {
                    ticks: { text: { fill: 'var(--text-secondary)' } },
                    domain: { line: { stroke: 'var(--border-color)' } }
                  },
                  grid: { line: { stroke: 'var(--border-color)', strokeDasharray: '4 4' } },
                  crosshair: { line: { stroke: '#9b59b6' } }
                }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Requires at least 2 sleep entries to analyze tracking history.
              </div>
            )}
          </div>
        </div>

        {/* Line Chart: Sleep Hours */}
        <div className="animated-card" style={{ padding: '2rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Estimated Hours Slept</h3>
          </div>
          <div style={{ flex: 1 }}>
            {sleepHoursData[0].data.length > 1 ? (
              <ResponsiveLine
                data={sleepHoursData}
                margin={{ top: 20, right: 20, bottom: 60, left: 40 }}
                xScale={{ type: 'time', format: '%Y-%m-%d', precision: 'day' }}
                yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                xFormat="time:%Y-%m-%d"
                yFormat=" >-.1f"
                curve="monotoneX"
                axisTop={null}
                axisRight={null}
                axisBottom={{ format: '%b %d', tickSize: 5, tickPadding: 5, tickRotation: -45, tickValues: 'every 1 day' }}
                axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
                enableGridX={false}
                pointSize={8}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                enableArea={true}
                areaOpacity={0.1}
                useMesh={true}
                colors={['var(--accent-secondary)']}
                theme={{
                  axis: {
                    ticks: { text: { fill: 'var(--text-secondary)' } },
                    domain: { line: { stroke: 'var(--border-color)' } }
                  },
                  grid: { line: { stroke: 'var(--border-color)', strokeDasharray: '4 4' } },
                  crosshair: { line: { stroke: 'var(--accent-secondary)' } }
                }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Requires at least 2 entries to establish a timeline.
              </div>
            )}
          </div>
        </div>

        {/* Line Chart: Sleep Schedule (Timing) */}
        <div className="animated-card" style={{ padding: '2rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Sleep Schedule</h3>
          </div>
          <div style={{ flex: 1 }}>
            {(sleepTimingData[0].data.length > 1 || sleepTimingData[1].data.length > 1) ? (
              <ResponsiveLine
                data={sleepTimingData}
                margin={{ top: 20, right: 120, bottom: 60, left: 60 }}
                xScale={{ type: 'time', format: '%Y-%m-%d', precision: 'day' }}
                yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: true }}
                xFormat="time:%Y-%m-%d"
                curve="monotoneX"
                axisTop={null}
                axisRight={null}
                axisBottom={{ format: '%b %d', tickSize: 5, tickPadding: 5, tickRotation: -45, tickValues: 'every 1 day' }}
                axisLeft={{ 
                  tickSize: 5, tickPadding: 5, tickRotation: 0, 
                  format: v => { 
                    let h = Math.floor(v); 
                    let m = Math.round((v - h) * 60); 
                    if (h >= 24) h -= 24; 
                    const ampm = h >= 12 ? 'PM' : 'AM'; 
                    h = h % 12; 
                    if (h === 0) h = 12; 
                    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`; 
                  } 
                }}
                enableGridX={false}
                pointSize={8}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                enableArea={false}
                useMesh={true}
                colors={['#34495e', '#f1c40f']}
                legends={[
                    {
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 100,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'circle',
                        symbolBorderColor: 'rgba(0, 0, 0, .5)',
                        effects: [
                            {
                                on: 'hover',
                                style: {
                                    itemBackground: 'rgba(0, 0, 0, .03)',
                                    itemOpacity: 1
                                }
                            }
                        ]
                    }
                ]}
                theme={{
                  axis: {
                    ticks: { text: { fill: 'var(--text-secondary)' } },
                    domain: { line: { stroke: 'var(--border-color)' } }
                  },
                  grid: { line: { stroke: 'var(--border-color)', strokeDasharray: '4 4' } },
                  crosshair: { line: { stroke: 'var(--accent-primary)' } },
                  legends: { text: { fill: 'var(--text-primary)' } }
                }}
                tooltip={({ point }: any) => {
                  let v = Number(point.data.yFormatted);
                  let h = Math.floor(v); 
                  let m = Math.round((v - h) * 60); 
                  if (h >= 24) h -= 24; 
                  const ampm = h >= 12 ? 'PM' : 'AM'; 
                  h = h % 12; 
                  if (h === 0) h = 12; 
                  const timeStr = `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
                  return (
                      <div style={{ background: 'var(--bg-card)', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                          <strong>{point.serieId || point.seriesId}</strong>: {timeStr}
                      </div>
                  );
                }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Requires at least 2 entries to establish a sleep schedule timeline.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

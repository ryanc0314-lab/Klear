import { useState, useMemo, useEffect } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { format, subDays, isAfter } from 'date-fns';
import { useJournalStore } from '../../store/journalStore';
import { useWorkoutStore } from '../../store/workoutStore';
import { useHabitStore } from '../../store/habitStore';
import { supabase } from '../../lib/supabase';

const MetricChartGroup = ({ data, title, isPercentage = false, timeHorizon }: { data: any[], title: string, isPercentage?: boolean, timeHorizon: number }) => {
  const customTickValues = timeHorizon <= 30 ? 'every 1 day' : timeHorizon <= 365 ? 'every 1 month' : 'every 6 months';

  return (
  <div className="animated-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{title}</h3>
    </div>
    {data.length > 0 ? (
      data.map((series: any) => (
        <div key={series.id} style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '1rem', color: series.color, marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{series.id}</h4>
          <div style={{ flex: 1 }}>
            {series.data.length > 1 ? (
              <ResponsiveLine
                data={[series]}
                margin={{ top: 20, right: 20, bottom: 60, left: 50 }}
                xScale={{ type: 'time', format: '%Y-%m-%d', precision: 'day' }}
                yScale={{ type: 'linear', min: isPercentage ? 0 : 'auto', max: isPercentage ? 100 : 'auto', stacked: false, reverse: false }}
                xFormat="time:%Y-%m-%d"
                yFormat=" >-.1f"
                curve="monotoneX"
                axisTop={null}
                axisRight={null}
                axisBottom={{ format: '%b %d', tickSize: 5, tickPadding: 5, tickRotation: -45, tickValues: customTickValues }}
                axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
                enableGridX={false}
                pointSize={8}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                enableArea={true}
                areaOpacity={0.1}
                useMesh={true}
                colors={[series.color]}
                theme={{
                  axis: {
                    ticks: { text: { fill: 'var(--text-secondary)' } },
                    domain: { line: { stroke: 'var(--border-color)' } }
                  },
                  grid: { line: { stroke: 'var(--border-color)', strokeDasharray: '4 4' } },
                  crosshair: { line: { stroke: 'var(--text-primary)' } }
                }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Logging at least 2 records within the time horizon is required to draw a trendline.
              </div>
            )}
          </div>
        </div>
      ))
    ) : (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: 'var(--text-muted)' }}>
        No robust historical data exists within this time horizon.
      </div>
    )}
  </div>
);
}

const SleepTimingChartGroup = ({ data, timeHorizon }: { data: any[], timeHorizon: number }) => {
  const customTickValues = timeHorizon <= 30 ? 'every 1 day' : timeHorizon <= 365 ? 'every 1 month' : 'every 6 months';
  return (
    <div className="animated-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Sleep Schedule</h3>
      </div>
      {(data.length > 0 && (data[0]?.data.length > 1 || (data[1] && data[1].data.length > 1))) ? (
        <div style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
              <ResponsiveLine
                data={data}
                margin={{ top: 20, right: 120, bottom: 60, left: 60 }}
                xScale={{ type: 'time', format: '%Y-%m-%d', precision: 'day' }}
                yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: true }}
                xFormat="time:%Y-%m-%d"
                curve="monotoneX"
                axisTop={null}
                axisRight={null}
                axisBottom={{ format: '%b %d', tickSize: 5, tickPadding: 5, tickRotation: -45, tickValues: customTickValues }}
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
                        effects: [{ on: 'hover', style: { itemBackground: 'rgba(0, 0, 0, .03)', itemOpacity: 1 } }]
                    }
                ]}
                theme={{
                  axis: { ticks: { text: { fill: 'var(--text-secondary)' } }, domain: { line: { stroke: 'var(--border-color)' } } },
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
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: 'var(--text-muted)' }}>
          No robust historical data exists within this time horizon.
        </div>
      )}
    </div>
  );
};

export const StatsDashboard = () => {
  const [timeHorizon, setTimeHorizon] = useState<number>(30); // days
  
  const { entries, loadEntries } = useJournalStore();
  const { loadWorkouts } = useWorkoutStore();
  const { habits, logs, loadHabits } = useHabitStore();
  
  const [allSets, setAllSets] = useState<any[]>([]);

  useEffect(() => {
    loadEntries();
    loadWorkouts();
    loadHabits();
    
    supabase.from('workout_sets').select('*').then(({ data: sets }) => {
      supabase.from('workouts').select('*').then(({ data: wks }) => {
        if (!sets || !wks) return;
        const wMap = new Map(wks.map(w => [w.id, w.date]));
        const joined = sets.map(s => ({ ...s, date: wMap.get(s.workout_id) })).filter(s => s.date);
        joined.sort((a,b) => a.date!.getTime() - b.date!.getTime());
        setAllSets(joined);
      });
    });
  }, [loadEntries, loadWorkouts, loadHabits]);

  const now = new Date();
  const cutoff = subDays(now, timeHorizon);

  // Filtered Data
  const filteredEntries = useMemo(() => {
    if (timeHorizon === 9999) return entries;
    return entries.filter(e => isAfter(new Date(e.date), cutoff));
  }, [entries, timeHorizon, cutoff]);

  const filteredLogs = useMemo(() => {
    if (timeHorizon === 9999) return logs;
    return logs.filter(l => isAfter(new Date(l.date + 'T12:00:00'), cutoff));
  }, [logs, timeHorizon, cutoff]);

  const filteredSets = useMemo(() => {
    if (timeHorizon === 9999) return allSets;
    return allSets.filter(s => isAfter(new Date(s.date), cutoff));
  }, [allSets, timeHorizon, cutoff]);

  // MOOD & ANXIETY
  const moodAnxietyData = useMemo(() => {
    const dataByDate = new Map<string, { mood: number[], anxiety: number[] }>();
    filteredEntries.forEach(e => {
      const pDate = format(new Date(e.date), 'yyyy-MM-dd');
      if (!dataByDate.has(pDate)) dataByDate.set(pDate, { mood: [], anxiety: [] });
      if (e.mood !== undefined && e.mood > 0) dataByDate.get(pDate)!.mood.push(e.mood);
      if (e.anxiety !== undefined && e.anxiety > 0) dataByDate.get(pDate)!.anxiety.push(e.anxiety);
    });
    
    const moodPts: any[] = [];
    const anxiPts: any[] = [];
    
    Array.from(dataByDate.entries()).sort((a,b) => a[0].localeCompare(b[0])).forEach(([dateStr, metrics]) => {
       if (metrics.mood.length > 0) moodPts.push({ x: dateStr, y: metrics.mood.reduce((a,b)=>a+b,0)/metrics.mood.length });
       if (metrics.anxiety.length > 0) anxiPts.push({ x: dateStr, y: metrics.anxiety.reduce((a,b)=>a+b,0)/metrics.anxiety.length });
    });
    
    return [
      { id: 'Mood', color: 'var(--accent-primary)', data: moodPts },
      { id: 'Anxiety', color: 'var(--accent-danger)', data: anxiPts },
    ].filter(s => s.data.length > 0);
  }, [filteredEntries]);

  // SLEEP
  const sleepData = useMemo(() => {
    const dataByDate = new Map<string, { quality: number[], hours: number[] }>();
    filteredEntries.forEach(e => {
      const pDate = format(new Date(e.date), 'yyyy-MM-dd');
      if (!dataByDate.has(pDate)) dataByDate.set(pDate, { quality: [], hours: [] });
      if (e.sleep_quality !== undefined && e.sleep_quality > 0) dataByDate.get(pDate)!.quality.push(e.sleep_quality);
      if (e.sleep_hours !== undefined && e.sleep_hours > 0) dataByDate.get(pDate)!.hours.push(e.sleep_hours);
    });
    
    const qPts: any[] = [];
    const hPts: any[] = [];
    
    Array.from(dataByDate.entries()).sort((a,b) => a[0].localeCompare(b[0])).forEach(([dateStr, metrics]) => {
       if (metrics.quality.length > 0) qPts.push({ x: dateStr, y: metrics.quality.reduce((a,b)=>a+b,0)/metrics.quality.length });
       if (metrics.hours.length > 0) hPts.push({ x: dateStr, y: metrics.hours.reduce((a,b)=>a+b,0)/metrics.hours.length });
    });
    
    return [
      { id: 'Sleep Quality (1-5)', color: '#9b59b6', data: qPts },
      { id: 'Hours Slept', color: 'var(--accent-secondary)', data: hPts },
    ].filter(s => s.data.length > 0);
  }, [filteredEntries]);

  const sleepTimingData = useMemo(() => {
    const dataByDate = new Map<string, { start: number[], end: number[] }>();
    filteredEntries.forEach(e => {
      const pDate = format(new Date(e.date), 'yyyy-MM-dd');
      if (!dataByDate.has(pDate)) dataByDate.set(pDate, { start: [], end: [] });
      
      if (e.sleep_start) {
        const [h, m] = e.sleep_start.split(':').map(Number);
        let time = h + m / 60;
        if (time < 12) time += 24;
        dataByDate.get(pDate)!.start.push(time);
      }
      if (e.sleep_end) {
        const [h, m] = e.sleep_end.split(':').map(Number);
        dataByDate.get(pDate)!.end.push(h + m / 60);
      }
    });

    const sPts: any[] = [];
    const ePts: any[] = [];

    Array.from(dataByDate.entries()).sort((a,b) => a[0].localeCompare(b[0])).forEach(([dateStr, metrics]) => {
      if (metrics.start.length > 0) sPts.push({ x: dateStr, y: metrics.start.reduce((a,b)=>a+b,0)/metrics.start.length });
      if (metrics.end.length > 0) ePts.push({ x: dateStr, y: metrics.end.reduce((a,b)=>a+b,0)/metrics.end.length });
    });

    return [
      { id: 'Bedtime', color: '#34495e', data: sPts },
      { id: 'Wake Time', color: '#f1c40f', data: ePts },
    ].filter(s => s.data.length > 0);
  }, [filteredEntries]);

  // HABITS (Aggregate completion rate)
  const habitData = useMemo(() => {
    const dataByDate = new Map<string, { total: number, completed: number }>();
    const activeHabitIds = new Set(habits.filter(h => !h.archived).map(h => h.id));
    
    filteredLogs.forEach(l => {
      if (!activeHabitIds.has(l.habit_id)) return;
      const pDate = format(new Date(l.date + 'T12:00:00'), 'yyyy-MM-dd');
      if (!dataByDate.has(pDate)) dataByDate.set(pDate, { total: 0, completed: 0 });
      dataByDate.get(pDate)!.total += 1;
      if (l.value > 0) dataByDate.get(pDate)!.completed += 1;
    });
    
    const hPts: any[] = [];
    Array.from(dataByDate.entries()).sort((a,b) => a[0].localeCompare(b[0])).forEach(([dateStr, metrics]) => {
       const completionRate = (metrics.completed / activeHabitIds.size) * 100;
       hPts.push({ x: dateStr, y: Math.min(100, Math.round(completionRate)) });
    });

    return [
      { id: 'Completion Rate %', color: 'var(--accent-success)', data: hPts }
    ].filter(s => s.data.length > 0);
  }, [filteredLogs, habits]);

  // WORKOUT VOLUME
  const workoutData = useMemo(() => {
    const dataByDate = new Map<string, { totalVolume: number }>();
    filteredSets.forEach(s => {
      const pDate = format(new Date(s.date), 'yyyy-MM-dd');
      if (!dataByDate.has(pDate)) dataByDate.set(pDate, { totalVolume: 0 });
      if (s.weight && s.reps && s.sets) {
        dataByDate.get(pDate)!.totalVolume += (s.weight * s.reps * s.sets);
      }
    });
    
    const wPts: any[] = [];
    Array.from(dataByDate.entries()).sort((a,b) => a[0].localeCompare(b[0])).forEach(([dateStr, metrics]) => {
       wPts.push({ x: dateStr, y: metrics.totalVolume });
    });

    return [
      { id: 'Est. Tonnage (lbs)', color: 'var(--accent-warning)', data: wPts }
    ].filter(s => s.data.length > 0);
  }, [filteredSets]);

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Global Statistics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Deep-dive telemetry across all health and productivity pillars.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select 
            value={timeHorizon}
            onChange={e => setTimeHorizon(Number(e.target.value))}
            style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
          >
            <option value={7}>Looking Back: 1 Week</option>
            <option value={30}>Looking Back: 1 Month</option>
            <option value={365}>Looking Back: 1 Year</option>
            <option value={9999}>All Time</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <MetricChartGroup title="Mood & Anxiety History" data={moodAnxietyData} timeHorizon={timeHorizon} />
        <MetricChartGroup title="Sleep Volume & Quality" data={sleepData} timeHorizon={timeHorizon} />
        <SleepTimingChartGroup data={sleepTimingData} timeHorizon={timeHorizon} />
        <MetricChartGroup title="Habit Streak Trajectory" data={habitData} isPercentage={true} timeHorizon={timeHorizon} />
        <MetricChartGroup title="Workout Macroscopic Tonnage" data={workoutData} timeHorizon={timeHorizon} />
      </div>
    </div>
  );
};

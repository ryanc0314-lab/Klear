import { startOfWeek, endOfWeek, addDays } from 'date-fns';

export const getBiWeeklyPeriod = (date: Date) => {
  const day = date.getDay(); // 0 is Sunday, 1 is Monday... 6 is Saturday
  
  let periodStart: Date;
  let periodEnd: Date;

  if (day >= 1 && day <= 4) { // Mon-Thu
    periodStart = startOfWeek(date, { weekStartsOn: 1 });
    periodEnd = addDays(periodStart, 3); // Thu
  } else { // Fri-Sun
    // If it's Sunday (0), startOfWeek still gives the correct previous Monday if weekStartsOn: 1
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    periodStart = addDays(weekStart, 4); // Fri
    periodEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sun
  }

  return { periodStart, periodEnd };
};

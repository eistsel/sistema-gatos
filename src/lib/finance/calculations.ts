export function calculateNetBalance(income: number, expenses: number): number {
  return income - expenses
}

export function calculateSavingsRate(savings: number, income: number): number {
  if (income === 0) return 0
  return (savings / income) * 100
}

export function calculateDailyAverage(expenses: number, daysElapsed: number): number {
  if (daysElapsed === 0) return 0
  return expenses / daysElapsed
}

export function calculateEndOfMonthProjection(dailyAvg: number, totalDays: number): number {
  return dailyAvg * totalDays
}

export function calculateRealSavingsCapacity(income: number, fixedExpenses: number): number {
  return income - fixedExpenses
}

export function calculateGrowthRate(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / previous) * 100
}

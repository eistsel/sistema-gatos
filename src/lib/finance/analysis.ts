import type { Transaction, Budget } from "@/types/database"
import { getBudgetStatus } from "./rules"

export interface CategoryDiff {
  category: string
  currentAmount: number
  previousAmount: number
  change: number | null
}

export function getCategoryComparison(
  currentTransactions: Transaction[],
  previousTransactions: Transaction[]
): CategoryDiff[] {
  const currentByCat = summarizeByCategory(currentTransactions)
  const previousByCat = summarizeByCategory(previousTransactions)
  const allCategories = [...new Set([...Object.keys(currentByCat), ...Object.keys(previousByCat)])]

  return allCategories.map((category) => {
    const currentAmount = currentByCat[category] ?? 0
    const previousAmount = previousByCat[category] ?? 0
    const change = previousAmount === 0
      ? null
      : ((currentAmount - previousAmount) / previousAmount) * 100
    return { category, currentAmount, previousAmount, change }
  })
}

export function getTopExpenses(transactions: Transaction[], limit = 5): Transaction[] {
  return transactions
    .filter((t) => t.type === "GASTO")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
}

export function summarizeByCategory(transactions: Transaction[]): Record<string, number> {
  const summary: Record<string, number> = {}
  for (const t of transactions) {
    if (t.type === "GASTO") {
      summary[t.category] = (summary[t.category] ?? 0) + t.amount
    }
  }
  return summary
}

export interface SavingsPlan {
  targetAmount: number
  currentAmount: number
  monthlyContribution: number
  monthsNeeded: number
  feasible: boolean
  suggestion: string
}

export function generateSavingsPlan(
  targetAmount: number,
  currentAmount: number,
  monthlyCapacity: number,
  deadlineMonths: number
): SavingsPlan {
  const remaining = targetAmount - currentAmount
  const monthlyContribution = deadlineMonths > 0 ? remaining / deadlineMonths : remaining
  const monthsNeeded = monthlyCapacity > 0 ? Math.ceil(remaining / monthlyCapacity) : Infinity
  const feasible = monthsNeeded <= deadlineMonths

  let suggestion: string
  if (!feasible) {
    suggestion = `Con tu capacidad actual de aporte (${monthlyCapacity.toFixed(2)}/mes), necesitarías ${monthsNeeded} meses. Extiende el plazo o reduce la meta.`
  } else {
    suggestion = `Aportando ${monthlyContribution.toFixed(2)}/mes llegarías a la meta en ${deadlineMonths} meses.`
  }

  return { targetAmount, currentAmount, monthlyContribution, monthsNeeded, feasible, suggestion }
}

export function getBudgetAlerts(budgets: Budget[]): Budget[] {
  return budgets.filter((b) => getBudgetStatus(b.spent_amount, b.limit_amount) !== "ok")
}

export function getCategoryTrend(
  transactions: Transaction[][],
  category: string
): { month: number; amount: number }[] {
  return transactions.map((monthTxs, idx) => ({
    month: idx + 1,
    amount: monthTxs
      .filter((t) => t.type === "GASTO" && t.category === category)
      .reduce((sum, t) => sum + t.amount, 0),
  }))
}

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/finance/helpers"
import { summarizeByCategory } from "@/lib/finance/analysis"
import { getBudgetStatus } from "@/lib/finance/rules"
import type { Transaction, Budget, SavingsGoal } from "@/types/database"
import { AlertTriangle, TrendingUp, PiggyBank, Ban } from "lucide-react"

interface AlertsProps {
  transactions: Transaction[]
  budgets: Budget[]
  goals: SavingsGoal[]
  month: number
  year: number
}

export function FinanceAlerts({ transactions, budgets, goals, month, year }: AlertsProps) {
  const [prevTransactions, setPrevTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const start = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`
    const end = `${prevYear}-${String(prevMonth).padStart(2, "0")}-31`
    supabase.from("transactions").select("*").gte("date", start).lte("date", end).then(({ data }) => {
      if (data) setPrevTransactions(data as Transaction[])
      setLoading(false)
    })
  }, [month, year])

  const expenses = transactions.filter((t) => t.type === "GASTO")
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0)
  const totalIncome = transactions.filter((t) => t.type === "INGRESO").reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpenses
  const byCategory = summarizeByCategory(transactions)
  const prevByCategory = summarizeByCategory(prevTransactions)
  const daysElapsed = new Date().getDate()
  const daysInMonth = new Date(year, month, 0).getDate()
  const dailyAvg = daysElapsed > 0 ? totalExpenses / daysElapsed : 0
  const projectedEndOfMonth = dailyAvg * daysInMonth

  const alerts: { icon: React.ReactNode; color: string; message: string }[] = []

  // Negative balance
  if (balance < 0) {
    alerts.push({
      icon: <Ban className="h-4 w-4" />,
      color: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400",
      message: `Balance negativo: ${formatCurrency(balance)} a mitad de mes. Revisa tus gastos.`,
    })
  }

  // Category increase >30%
  for (const [cat, amount] of Object.entries(byCategory)) {
    const prevAmount = prevByCategory[cat] ?? 0
    if (prevAmount > 0 && amount > prevAmount * 1.3) {
      alerts.push({
        icon: <TrendingUp className="h-4 w-4" />,
        color: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400",
        message: `Gasto en "${cat}" subió más de 30% vs el mes anterior (${formatCurrency(amount)} vs ${formatCurrency(prevAmount)}).`,
      })
      break
    }
  }

  // Budget at risk
  for (const b of budgets) {
    const realSpent = byCategory[b.category] ?? 0
    const status = getBudgetStatus(realSpent, b.limit_amount)
    if (status === "exceeded") {
      alerts.push({
        icon: <AlertTriangle className="h-4 w-4" />,
        color: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400",
        message: `Presupuesto de "${b.category}" excedido: ${formatCurrency(realSpent)} de ${formatCurrency(b.limit_amount)}.`,
      })
    } else if (status === "warning") {
      alerts.push({
        icon: <AlertTriangle className="h-4 w-4" />,
        color: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400",
        message: `Presupuesto de "${b.category}" cerca del límite: ${((realSpent / b.limit_amount) * 100).toFixed(0)}% usado.`,
      })
    }
  }

  // End of month projection
  if (projectedEndOfMonth > totalIncome && totalIncome > 0) {
    alerts.push({
      icon: <TrendingUp className="h-4 w-4" />,
      color: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400",
      message: `Al ritmo actual, gastarías ${formatCurrency(projectedEndOfMonth)} este mes — más de tus ingresos (${formatCurrency(totalIncome)}).`,
    })
  }

  // Goal progress
  for (const g of goals) {
    if (g.monthly_contribution && g.monthly_contribution > 0 && g.current_amount < g.target_amount) {
      alerts.push({
        icon: <PiggyBank className="h-4 w-4" />,
        color: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400",
        message: `Meta "${g.name}" — Tu aporte mensual sugerido es ${formatCurrency(g.monthly_contribution)}. Llevas ${formatCurrency(g.current_amount)} de ${formatCurrency(g.target_amount)}.`,
      })
      break
    }
  }

  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      {alerts.slice(0, 4).map((alert, idx) => (
        <Card key={idx} className={alert.color}>
          <CardContent className="p-3 flex items-center gap-2 text-sm">
            {alert.icon}
            <span>{alert.message}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency, formatPercentage } from "@/lib/finance/helpers"
import { calculateNetBalance, calculateSavingsRate, calculateGrowthRate } from "@/lib/finance/calculations"
import { getTopExpenses, summarizeByCategory } from "@/lib/finance/analysis"
import { getBudgetStatus } from "@/lib/finance/rules"
import type { Transaction, Budget, SavingsGoal, Account } from "@/types/database"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { CategoryIcon } from "@/components/finance/CategoryIcon"
import { FinanceAlerts } from "@/components/finance/Alerts"

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadData()
  }, [currentMonth, currentYear])

  function monthStr() { return String(currentMonth).padStart(2, "0") }

  async function loadData() {
    const supabase = createClient()
    const start = `${currentYear}-${monthStr()}-01`
    const end = `${currentYear}-${monthStr()}-31`

    const [txRes, budRes, goalRes, accRes] = await Promise.all([
      supabase.from("transactions").select("*").gte("date", start).lte("date", end).order("date", { ascending: false }),
      supabase.from("budgets").select("*").eq("month", currentMonth).eq("year", currentYear),
      supabase.from("savings_goals").select("*"),
      supabase.from("accounts").select("*"),
    ])

    if (txRes.data) setTransactions(txRes.data)
    if (budRes.data) setBudgets(budRes.data)
    if (goalRes.data) setGoals(goalRes.data)
    if (accRes.data) setAccounts(accRes.data)
    setLoading(false)
  }

  const expenses = transactions.filter((t) => t.type === "GASTO")
  const incomes = transactions.filter((t) => t.type === "INGRESO")
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0)
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0)
  const balance = calculateNetBalance(totalIncome, totalExpenses)
  const savingsRate = calculateSavingsRate(balance, totalIncome)
  const topExpenses = getTopExpenses(transactions)
  const byCategory = summarizeByCategory(transactions)
  const budgetsAtRisk = budgets.filter((b) => getBudgetStatus(byCategory[b.category] ?? 0, b.limit_amount) !== "ok")
  const netWorth = accounts.filter((a) => a.include_in_net).reduce((s, a) => s + a.balance, 0)

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString("es", { month: "long" })

  function prevMonth() {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear((y) => y - 1) }
    else setCurrentMonth((m) => m - 1)
  }
  function nextMonth() {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear((y) => y + 1) }
    else setCurrentMonth((m) => m + 1)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <div className="flex items-center gap-2 bg-card rounded-lg border border-border px-3 py-1.5 self-start sm:self-auto">
            <button onClick={prevMonth} className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm font-medium text-foreground capitalize">{monthName} {currentYear}</span>
            <button onClick={nextMonth} className="text-muted-foreground hover:text-foreground"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        <FinanceAlerts transactions={transactions} budgets={budgets} goals={goals} month={currentMonth} year={currentYear} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard title="Ingresos" amount={totalIncome} color="text-foreground" change="vs mes anterior" />
          <MetricCard title="Gastos" amount={totalExpenses} color="text-foreground" change="vs mes anterior" />
          <MetricCard title="Balance" amount={balance} color={balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"} change={balance >= 0 ? "Positivo" : "Negativo"} />
          <MetricCard title="Tasa de ahorro" amount={savingsRate} color="text-emerald-600 dark:text-emerald-400" change="Meta: 20%" isPercentage />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-card-foreground">Evolución mensual</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Ingresos</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Gastos</span>
                </div>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "Ene", ingresos: 4000, gastos: 2800 },
                    { name: "Feb", ingresos: 3800, gastos: 3100 },
                    { name: "Mar", ingresos: 4200, gastos: 2700 },
                    { name: "Abr", ingresos: 4100, gastos: 2900 },
                    { name: monthName, ingresos: totalIncome, gastos: totalExpenses },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--card-foreground)" }} />
                    <Bar dataKey="ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gastos" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-card-foreground mb-4">Top 5 gastos</h3>
              <div className="space-y-3">
                {topExpenses.length === 0 && <p className="text-sm text-muted-foreground">Sin gastos este mes</p>}
                {topExpenses.map((t) => {
                  const maxAmount = topExpenses[0]?.amount || 1
                  return (
                    <div key={t.id} className="flex items-center gap-3">
                      <span className="text-muted-foreground"><CategoryIcon category={t.category} /></span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-card-foreground truncate">{t.description}</span>
                          <span className="text-card-foreground font-medium ml-2">{formatCurrency(t.amount)}</span>
                        </div>
                        <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(t.amount / maxAmount) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-card-foreground mb-4">Presupuestos del mes</h3>
              <div className="space-y-4">
                {budgets.length === 0 && <p className="text-sm text-muted-foreground">Sin presupuestos definidos</p>}
                {budgets.slice(0, 4).map((b) => {
                  const realSpent = byCategory[b.category] ?? 0
                  const pct = b.limit_amount > 0 ? (realSpent / b.limit_amount) * 100 : 0
                  const status = getBudgetStatus(realSpent, b.limit_amount)
                  const statusColor = status === "exceeded" ? "bg-red-500" : status === "warning" ? "bg-amber-500" : "bg-emerald-500"
                  const badgeColor = status === "exceeded" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : status === "warning" ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                  return (
                    <div key={b.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-card-foreground"><CategoryIcon category={b.category} /> {b.category}</span>
                        <Badge className={badgeColor} variant="outline">{pct.toFixed(0)}%</Badge>
                      </div>
                      <Progress value={Math.min(pct, 100)} className={`h-2 ${statusColor}`} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(realSpent)}</span>
                        <span>de {formatCurrency(b.limit_amount)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-card-foreground mb-4">Metas de ahorro</h3>
              <div className="space-y-4">
                {goals.length === 0 && <p className="text-sm text-muted-foreground">Sin metas definidas</p>}
                {goals.slice(0, 3).map((g) => {
                  const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
                  return (
                    <div key={g.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-card-foreground">{g.name}</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{pct.toFixed(0)}%</span>
                      </div>
                      <Progress value={Math.min(pct, 100)} className="h-2 bg-emerald-100 dark:bg-emerald-900" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(g.current_amount)}</span>
                        <span>Meta: {formatCurrency(g.target_amount)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-card rounded-xl border border-border p-5 space-y-3">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-card rounded-xl border border-border" />
        <div className="h-72 bg-card rounded-xl border border-border" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-48 bg-card rounded-xl border border-border" />
        <div className="h-48 bg-card rounded-xl border border-border" />
      </div>
    </div>
  )
}

function MetricCard({ title, amount, color, change, isPercentage }: {
  title: string
  amount: number
  color: string
  change: string
  isPercentage?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-5 space-y-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>
          {isPercentage ? formatPercentage(amount) : formatCurrency(amount)}
        </p>
        <p className="text-xs text-muted-foreground">{change}</p>
      </CardContent>
    </Card>
  )
}

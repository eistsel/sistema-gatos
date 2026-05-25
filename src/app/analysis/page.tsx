"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency, formatPercentage } from "@/lib/finance/helpers"
import { calculateNetBalance, calculateSavingsRate, calculateDailyAverage, calculateGrowthRate } from "@/lib/finance/calculations"
import { getTopExpenses, summarizeByCategory, getCategoryComparison, generateSavingsPlan } from "@/lib/finance/analysis"
import { getBudgetStatus } from "@/lib/finance/rules"
import { CATEGORIES, type Transaction, type Budget, type SavingsGoal } from "@/types/database"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts"
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react"
import { CategoryIcon } from "@/components/finance/CategoryIcon"

const COLORS = ["#10B981", "#F59E0B", "#EF4444", "#6366F1", "#EC4899", "#14B8A6", "#F97316", "#8B5CF6", "#06B6D4", "#84CC16", "#E11D48", "#0EA5E9"]

export default function AnalysisPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [prevTransactions, setPrevTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [allYearTxs, setAllYearTxs] = useState<Transaction[][]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  useEffect(() => { loadData() }, [month, year])

  async function loadData() {
    const supabase = createClient()
    const start = `${year}-${String(month).padStart(2, "0")}-01`
    const end = `${year}-${String(month).padStart(2, "0")}-31`
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const prevStart = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`
    const prevEnd = `${prevYear}-${String(prevMonth).padStart(2, "0")}-31`

    const [txRes, prevRes, budRes, goalRes] = await Promise.all([
      supabase.from("transactions").select("*").gte("date", start).lte("date", end),
      supabase.from("transactions").select("*").gte("date", prevStart).lte("date", prevEnd),
      supabase.from("budgets").select("*").eq("month", month).eq("year", year),
      supabase.from("savings_goals").select("*"),
    ])

    if (txRes.data) setTransactions(txRes.data as Transaction[])
    if (prevRes.data) setPrevTransactions(prevRes.data as Transaction[])
    if (budRes.data) setBudgets(budRes.data as Budget[])
    if (goalRes.data) setGoals(goalRes.data as SavingsGoal[])

    // Load monthly breakdown for charts
    const monthlyData: Transaction[][] = []
    for (let m = 1; m <= now.getMonth() + 1; m++) {
      const ms = `${year}-${String(m).padStart(2, "0")}-01`
      const me = `${year}-${String(m).padStart(2, "0")}-31`
      const { data } = await supabase.from("transactions").select("*").gte("date", ms).lte("date", me)
      monthlyData.push((data ?? []) as Transaction[])
    }
    setAllYearTxs(monthlyData)
    setLoading(false)
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const expenses = transactions.filter((t) => t.type === "GASTO")
  const incomes = transactions.filter((t) => t.type === "INGRESO")
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0)
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0)
  const balance = calculateNetBalance(totalIncome, totalExpenses)
  const savingsRate = calculateSavingsRate(balance, totalIncome)
  const daysElapsed = new Date().getDate()
  const dailyAvg = calculateDailyAverage(totalExpenses, daysElapsed)
  const prevExpenses = prevTransactions.filter((t) => t.type === "GASTO").reduce((s, t) => s + t.amount, 0)
  const expenseGrowth = calculateGrowthRate(totalExpenses, prevExpenses)

  const byCategory = summarizeByCategory(transactions)
  const topExpenses = getTopExpenses(transactions, 10)
  const categoryComparison = getCategoryComparison(transactions, prevTransactions)
  const byCategoryPrevious = summarizeByCategory(prevTransactions)

  // Chart data: category breakdown for current month
  const categoryChartData = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => ({
      key: cat,
      name: CATEGORIES.find((c) => c.key === cat)?.label ?? cat,
      value: amount,
    }))

  // Chart data: monthly trend
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"]
  const trendData = allYearTxs.map((txs, idx) => {
    const inc = txs.filter((t) => t.type === "INGRESO").reduce((s, t) => s + t.amount, 0)
    const exp = txs.filter((t) => t.type === "GASTO").reduce((s, t) => s + t.amount, 0)
    return { name: monthNames[idx], ingresos: inc, gastos: exp }
  })

  const monthName = monthNames[month - 1]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Cargando...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Análisis</h1>
          <div className="flex items-center gap-2 bg-card rounded-lg border border-border px-3 py-1.5">
            <button onClick={prevMonth} className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm font-medium text-foreground capitalize">{monthName} {year}</span>
            <button onClick={nextMonth} className="text-muted-foreground hover:text-foreground"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card><CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Ingresos</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalIncome)}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Gastos</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className={`text-lg font-bold ${balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{formatCurrency(balance)}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Tasa de ahorro</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatPercentage(savingsRate)}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Gasto diario prom.</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(dailyAvg)}</p>
          </CardContent></Card>
        </div>

        {/* Monthly trend chart */}
        <Card>
          <CardHeader><CardTitle>Evolución mensual</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="ingresos" fill="#10B981" radius={[4, 4, 0, 0]} name="Ingresos" />
                  <Bar dataKey="gastos" fill="#EF4444" radius={[4, 4, 0, 0]} name="Gastos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category breakdown */}
          <Card>
            <CardHeader><CardTitle>Gastos por categoría</CardTitle></CardHeader>
            <CardContent>
              {categoryChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin gastos este mes</p>
              ) : (
                <div className="space-y-3">
                  {categoryChartData.map((cat, idx) => {
                    const pct = (cat.value / totalExpenses) * 100
                    return (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground"><CategoryIcon category={cat.key} /> {cat.name}</span>
                          <span className="font-medium text-foreground">{formatCurrency(cat.value)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comparison vs previous month */}
          <Card>
            <CardHeader><CardTitle>Comparativa vs mes anterior</CardTitle></CardHeader>
            <CardContent>
              {categoryComparison.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos del mes anterior</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {categoryComparison
                    .filter((c) => c.currentAmount > 0 || c.previousAmount > 0)
                    .sort((a, b) => b.currentAmount - a.currentAmount)
                    .map((c) => {
                      const diff = c.change !== null ? (c.change > 0 ? "↑" : "↓") : "—"
                      const color = c.change !== null && c.change > 30 ? "text-red-500" : c.change !== null && c.change < -10 ? "text-emerald-500" : "text-muted-foreground"
                      return (
                        <div key={c.category} className="flex items-center justify-between text-sm">
                          <span className="text-foreground"><CategoryIcon category={c.category} /> {CATEGORIES.find((c2) => c2.key === c.category)?.label ?? c.category}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">{formatCurrency(c.currentAmount)}</span>
                            <span className={`w-16 text-right font-medium ${color}`}>
                              {c.change !== null ? `${diff} ${Math.abs(c.change).toFixed(0)}%` : "—"}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top expenses */}
        <Card>
          <CardHeader><CardTitle>Top 10 gastos del mes</CardTitle></CardHeader>
          <CardContent>
            {topExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin gastos este mes</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-semibold text-muted-foreground text-xs">#</th>
                      <th className="text-left py-2 px-3 font-semibold text-muted-foreground text-xs">Fecha</th>
                      <th className="text-left py-2 px-3 font-semibold text-muted-foreground text-xs">Descripción</th>
                      <th className="text-left py-2 px-3 font-semibold text-muted-foreground text-xs">Categoría</th>
                      <th className="text-right py-2 px-3 font-semibold text-muted-foreground text-xs">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topExpenses.map((t, idx) => (
                      <tr key={t.id} className="border-b border-border/50">
                        <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                        <td className="py-2 px-3 text-muted-foreground">{t.date}</td>
                        <td className="py-2 px-3 font-medium text-foreground">{t.description}</td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className="text-xs"><CategoryIcon category={t.category} /> {CATEGORIES.find((c) => c.key === t.category)?.label ?? t.category}</Badge>
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-red-600 dark:text-red-400">{formatCurrency(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget status + Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Presupuestos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {budgets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin presupuestos definidos</p>
              ) : budgets.map((b) => {
                const realSpent = byCategory[b.category] ?? 0
                const pct = b.limit_amount > 0 ? (realSpent / b.limit_amount) * 100 : 0
                const status = getBudgetStatus(realSpent, b.limit_amount)
                return (
                  <div key={b.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground"><CategoryIcon category={b.category} /> {CATEGORIES.find((c) => c.key === b.category)?.label ?? b.category}</span>
                      <Badge className={status === "exceeded" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" : status === "warning" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"} variant="outline">
                        {pct.toFixed(0)}%
                      </Badge>
                    </div>
                    <Progress value={Math.min(pct, 100)} className={`h-2 ${status === "exceeded" ? "[&>div]:bg-red-500" : status === "warning" ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(realSpent)}</span>
                      <span>de {formatCurrency(b.limit_amount)}</span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Metas de ahorro</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {goals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin metas definidas</p>
              ) : goals.map((g) => {
                const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
                const monthsLeft = g.deadline ? Math.max(1, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))) : 12
                const plan = generateSavingsPlan(g.target_amount, g.current_amount, g.monthly_contribution ?? 0, monthsLeft)
                return (
                  <div key={g.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{g.name}</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{pct.toFixed(0)}%</span>
                    </div>
                    <Progress value={pct} className="h-2 bg-emerald-100 dark:bg-emerald-900/40 [&>div]:bg-emerald-500" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(g.current_amount)}</span>
                      <span>Meta: {formatCurrency(g.target_amount)}</span>
                    </div>
                    <p className={`text-xs ${plan.feasible ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {plan.feasible ? "✅ Al día" : "⚠️ Atrasado"} — {plan.suggestion}
                    </p>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Monthly snapshot */}
        <Card>
          <CardHeader><CardTitle>Resumen de {monthName}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total ingresos</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">{formatCurrency(totalIncome)}</p>
                {expenseGrowth !== null && (
                  <p className={`text-xs flex items-center gap-1 ${expenseGrowth >= 0 ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400"}`}>
                    {expenseGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    Gastos {expenseGrowth >= 0 ? "subieron" : "bajaron"} {Math.abs(expenseGrowth).toFixed(1)}%
                  </p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground">Días transcurridos</p>
                <p className="font-bold text-foreground text-lg">{daysElapsed}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Proyección fin de mes</p>
                <p className="font-bold text-foreground text-lg">{formatCurrency(dailyAvg * new Date(year, month, 0).getDate())}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Categoría principal</p>
                <p className="font-bold text-foreground text-lg">
                  {categoryChartData[0] ? <><CategoryIcon category={categoryChartData[0].key} /> {categoryChartData[0].name}</> : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

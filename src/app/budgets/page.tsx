"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CategoryIcon } from "@/components/finance/CategoryIcon"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/finance/helpers"
import { getBudgetStatus } from "@/lib/finance/rules"
import { summarizeByCategory } from "@/lib/finance/analysis"
import { CATEGORIES, type Budget, type Transaction } from "@/types/database"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [spentByCategory, setSpentByCategory] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  useEffect(() => { loadData() }, [month, year])

  function handleEdit(b: Budget) {
    setEditingBudget(b)
    setOpen(true)
  }

  function handleNew() {
    setEditingBudget(null)
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar este presupuesto?")) return
    const supabase = createClient()
    const { error } = await supabase.from("budgets").delete().eq("id", id)
    if (!error) { toast.success("Presupuesto eliminado"); loadData() }
    else toast.error("Error al eliminar")
  }

  function handleClose() {
    setOpen(false)
    setEditingBudget(null)
  }

  async function loadData() {
    const supabase = createClient()
    const start = `${year}-${String(month).padStart(2, "0")}-01`
    const end = `${year}-${String(month).padStart(2, "0")}-31`
    const [budRes, txRes] = await Promise.all([
      supabase.from("budgets").select("*").eq("month", month).eq("year", year),
      supabase.from("transactions").select("*").gte("date", start).lte("date", end),
    ])
    if (budRes.data) setBudgets(budRes.data)
    if (txRes.data) setSpentByCategory(summarizeByCategory(txRes.data as Transaction[]))
    setLoading(false)
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "exceeded": return { bar: "bg-red-500", badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", label: "🔴 Excedido" }
      case "warning": return { bar: "bg-amber-500", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", label: "🟡 Cerca del límite" }
      default: return { bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", label: "🟢 Ok" }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Presupuestos</h1>
          <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); setOpen(v) }}>
            <DialogTrigger onClick={handleNew} className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Nuevo presupuesto
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>{editingBudget ? "Editar presupuesto" : "Nuevo presupuesto"}</DialogTitle></DialogHeader>
              <BudgetForm initial={editingBudget} month={month} year={year} onSuccess={() => { loadData(); handleClose() }} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="lg:col-span-2 text-center text-muted-foreground py-8">Cargando...</div>
          ) : budgets.length === 0 ? (
            <div className="lg:col-span-2 text-center text-muted-foreground py-8">Sin presupuestos para este mes</div>
          ) : budgets.map((b) => {
            const realSpent = spentByCategory[b.category] ?? 0
            const pct = b.limit_amount > 0 ? Math.min((realSpent / b.limit_amount) * 100, 100) : 0
            const status = getBudgetStatus(realSpent, b.limit_amount)
            const style = getStatusStyle(status)
            return (
              <Card key={b.id}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground"><CategoryIcon category={b.category} /></span>
                      <h3 className="font-semibold text-foreground">
                        {CATEGORIES.find((c) => c.key === b.category)?.label ?? b.category}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={style.badge} variant="outline">{style.label}</Badge>
                      <button onClick={() => handleEdit(b)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <Progress value={pct} className={`h-2.5 ${style.bar}`} />
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-foreground">{formatCurrency(realSpent)}</p>
                      <p className="text-xs text-muted-foreground">gastado</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">de {formatCurrency(b.limit_amount)}</p>
                      <p className="text-xs text-muted-foreground">{pct.toFixed(0)}% utilizado</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}

const budgetSchema = z.object({
  category: z.string().min(1, "Selecciona una categoría"),
  limitAmount: z.string().min(1, "El límite es requerido").refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Debe ser un número positivo"),
})

function BudgetForm({ initial, month, year, onSuccess }: { initial: Budget | null; month: number; year: number; onSuccess: () => void }) {
  const [category, setCategory] = useState(initial?.category ?? "")
  const [limitAmount, setLimitAmount] = useState(initial ? String(initial.limit_amount) : "")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = budgetSchema.safeParse({ category, limitAmount })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string
        if (!fieldErrors[field]) fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = { category, limit_amount: parseFloat(limitAmount) }

    const { error } = initial
      ? await supabase.from("budgets").update(payload).eq("id", initial.id)
      : await supabase.from("budgets").insert({ ...payload, user_id: user.id, month, year, spent_amount: 0 })
    setSubmitting(false)
    if (!error) { onSuccess(); toast.success(initial ? "Presupuesto actualizado" : "Presupuesto creado") }
    else toast.error("Error al guardar")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Categoría</label>
        <Select value={category} onValueChange={(v) => { setCategory(v ?? ""); setErrors((prev) => ({ ...prev, category: "" })) }}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.filter((c) => !["sueldo", "freelance", "ingreso_pasivo"].includes(c.key)).map((c) => (
              <SelectItem key={c.key} value={c.key}>{c.icon} {c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Límite mensual</label>
        <Input type="number" step="0.01" min="0" placeholder="500.00" value={limitAmount} onChange={(e) => { setLimitAmount(e.target.value); setErrors((prev) => ({ ...prev, limitAmount: "" })) }} />
        {errors.limitAmount && <p className="text-xs text-red-500 mt-1">{errors.limitAmount}</p>}
      </div>
      <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700">
        {submitting ? "Guardando..." : initial ? "Actualizar" : "Crear presupuesto"}
      </Button>
    </form>
  )
}

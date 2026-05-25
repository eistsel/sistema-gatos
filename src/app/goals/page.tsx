"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/finance/helpers"
import { generateSavingsPlan } from "@/lib/finance/analysis"
import type { SavingsGoal } from "@/types/database"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

export default function GoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)

  useEffect(() => { loadData() }, [])

  function handleEdit(g: SavingsGoal) {
    setEditingGoal(g)
    setOpen(true)
  }

  function handleNew() {
    setEditingGoal(null)
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar esta meta?")) return
    const supabase = createClient()
    const { error } = await supabase.from("savings_goals").delete().eq("id", id)
    if (!error) { toast.success("Meta eliminada"); loadData() }
    else toast.error("Error al eliminar")
  }

  function handleClose() {
    setOpen(false)
    setEditingGoal(null)
  }

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase.from("savings_goals").select("*").order("created_at", { ascending: false })
    if (data) setGoals(data)
    setLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Metas de ahorro</h1>
          <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); setOpen(v) }}>
            <DialogTrigger onClick={handleNew} className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Nueva meta
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>{editingGoal ? "Editar meta" : "Nueva meta de ahorro"}</DialogTitle></DialogHeader>
              <GoalForm initial={editingGoal} onSuccess={() => { loadData(); handleClose() }} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Cargando...</div>
          ) : goals.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Sin metas de ahorro. ¡Crea tu primera meta!</div>
          ) : goals.map((g) => {
            const pct = g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0
            const remaining = g.target_amount - g.current_amount
            const monthsLeft = g.deadline ? Math.max(1, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))) : 12
            const plan = generateSavingsPlan(g.target_amount, g.current_amount, g.monthly_contribution ?? 0, monthsLeft)
            return (
              <Card key={g.id}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">{g.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{pct.toFixed(0)}%</span>
                      <button onClick={() => handleEdit(g)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <Progress value={pct} className="h-3 bg-emerald-100 dark:bg-emerald-900/40 [&>div]:bg-emerald-500" />
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-foreground">{formatCurrency(g.current_amount)}</span>
                    <span className="text-muted-foreground">Meta: {formatCurrency(g.target_amount)}</span>
                  </div>
                  <div className="flex gap-6 text-xs text-muted-foreground">
                    {g.deadline && <span>📅 Meta: {new Date(g.deadline).toLocaleDateString("es", { month: "long", year: "numeric" })}</span>}
                    {g.monthly_contribution && <span>💰 Aporte mensual: {formatCurrency(g.monthly_contribution)}</span>}
                    <Badge className={plan.feasible ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"} variant="outline">
                      {plan.feasible ? "✅ Al día" : "⚠️ Atrasado"}
                    </Badge>
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

const goalSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  targetAmount: z.string().min(1, "El monto objetivo es requerido").refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Debe ser un número positivo"),
  currentAmount: z.string().refine((v) => v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), "Debe ser un número válido"),
})

function GoalForm({ initial, onSuccess }: { initial: SavingsGoal | null; onSuccess: () => void }) {
  const [name, setName] = useState(initial?.name ?? "")
  const [targetAmount, setTargetAmount] = useState(initial ? String(initial.target_amount) : "")
  const [currentAmount, setCurrentAmount] = useState(initial ? String(initial.current_amount) : "")
  const [deadline, setDeadline] = useState(initial?.deadline ?? "")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = goalSchema.safeParse({ name, targetAmount, currentAmount })
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

    const target = parseFloat(targetAmount)
    const current = parseFloat(currentAmount || "0")
    const monthsLeft = deadline ? Math.max(1, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))) : 12
    const monthlyContribution = Math.round(((target - current) / monthsLeft) * 100) / 100

    const payload = { name, target_amount: target, current_amount: current, deadline: deadline || null, monthly_contribution: monthlyContribution }

    const { error } = initial
      ? await supabase.from("savings_goals").update(payload).eq("id", initial.id)
      : await supabase.from("savings_goals").insert({ ...payload, user_id: user.id })
    setSubmitting(false)
    if (!error) { onSuccess(); toast.success(initial ? "Meta actualizada" : "Meta creada") }
    else toast.error("Error al guardar")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Nombre de la meta</label>
        <Input placeholder="Viaje a Cusco" value={name} onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: "" })) }} />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Monto objetivo</label>
        <Input type="number" step="0.01" min="0" placeholder="2000.00" value={targetAmount} onChange={(e) => { setTargetAmount(e.target.value); setErrors((prev) => ({ ...prev, targetAmount: "" })) }} />
        {errors.targetAmount && <p className="text-xs text-red-500 mt-1">{errors.targetAmount}</p>}
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Ahorrado hasta ahora</label>
        <Input type="number" step="0.01" min="0" placeholder="0.00" value={currentAmount} onChange={(e) => { setCurrentAmount(e.target.value); setErrors((prev) => ({ ...prev, currentAmount: "" })) }} />
        {errors.currentAmount && <p className="text-xs text-red-500 mt-1">{errors.currentAmount}</p>}
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Fecha límite</label>
        <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>
      <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700">
        {submitting ? "Guardando..." : initial ? "Actualizar" : "Crear meta"}
      </Button>
    </form>
  )
}

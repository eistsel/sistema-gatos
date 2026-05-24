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
import { Plus } from "lucide-react"
import { toast } from "sonner"

export default function GoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => { loadData() }, [])

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
          <h1 className="text-2xl font-bold text-gray-900">Metas de ahorro</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Nueva meta
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Nueva meta de ahorro</DialogTitle></DialogHeader>
              <GoalForm onSuccess={() => { loadData(); setOpen(false) }} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Cargando...</div>
          ) : goals.length === 0 ? (
            <div className="text-center text-gray-400 py-8">Sin metas de ahorro. ¡Crea tu primera meta!</div>
          ) : goals.map((g) => {
            const pct = g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0
            const remaining = g.target_amount - g.current_amount
            const monthsLeft = g.deadline ? Math.max(1, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))) : 12
            const plan = generateSavingsPlan(g.target_amount, g.current_amount, g.monthly_contribution ?? 0, monthsLeft)
            return (
              <Card key={g.id}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">{g.name}</h3>
                    <span className="text-lg font-bold text-emerald-600">{pct.toFixed(0)}%</span>
                  </div>
                  <Progress value={pct} className="h-3 bg-emerald-100 [&>div]:bg-emerald-500" />
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-gray-900">{formatCurrency(g.current_amount)}</span>
                    <span className="text-gray-500">Meta: {formatCurrency(g.target_amount)}</span>
                  </div>
                  <div className="flex gap-6 text-xs text-gray-500">
                    {g.deadline && <span>📅 Meta: {new Date(g.deadline).toLocaleDateString("es", { month: "long", year: "numeric" })}</span>}
                    {g.monthly_contribution && <span>💰 Aporte mensual: {formatCurrency(g.monthly_contribution)}</span>}
                    <Badge className={plan.feasible ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"} variant="outline">
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

function GoalForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [currentAmount, setCurrentAmount] = useState("")
  const [deadline, setDeadline] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !targetAmount) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const target = parseFloat(targetAmount)
    const current = parseFloat(currentAmount || "0")
    const monthsLeft = deadline ? Math.max(1, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))) : 12
    const monthlyContribution = (target - current) / monthsLeft

    const { error } = await supabase.from("savings_goals").insert({
      user_id: user.id,
      name,
      target_amount: target,
      current_amount: current,
      deadline: deadline || null,
      monthly_contribution: Math.round(monthlyContribution * 100) / 100,
    })
    setSubmitting(false)
    if (!error) { onSuccess(); toast.success("Meta creada") }
    else if (error) toast.error("Error al crear meta")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Nombre de la meta</label>
        <Input placeholder="Viaje a Cusco" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Monto objetivo</label>
        <Input type="number" step="0.01" min="0" placeholder="2000.00" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Ahorrado hasta ahora</label>
        <Input type="number" step="0.01" min="0" placeholder="0.00" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
      </div>
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Fecha límite</label>
        <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>
      <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700">
        {submitting ? "Guardando..." : "Crear meta"}
      </Button>
    </form>
  )
}

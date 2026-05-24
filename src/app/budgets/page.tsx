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
import { createClient } from "@/lib/supabase/client"
import { formatCurrency, getCategoryIcon } from "@/lib/finance/helpers"
import { getBudgetStatus } from "@/lib/finance/rules"
import { CATEGORIES, type Budget } from "@/types/database"
import { Plus } from "lucide-react"
import { toast } from "sonner"

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  useEffect(() => { loadData() }, [month, year])

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase.from("budgets").select("*").eq("month", month).eq("year", year)
    if (data) setBudgets(data)
    setLoading(false)
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "exceeded": return { bar: "bg-red-500", badge: "bg-red-100 text-red-700", label: "🔴 Excedido" }
      case "warning": return { bar: "bg-amber-500", badge: "bg-amber-100 text-amber-700", label: "🟡 Cerca del límite" }
      default: return { bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700", label: "🟢 Ok" }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Presupuestos</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Nuevo presupuesto
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Nuevo presupuesto</DialogTitle></DialogHeader>
              <BudgetForm month={month} year={year} onSuccess={() => { loadData(); setOpen(false) }} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 text-center text-gray-500 py-8">Cargando...</div>
          ) : budgets.length === 0 ? (
            <div className="col-span-2 text-center text-gray-400 py-8">Sin presupuestos para este mes</div>
          ) : budgets.map((b) => {
            const pct = b.limit_amount > 0 ? Math.min((b.spent_amount / b.limit_amount) * 100, 100) : 0
            const status = getBudgetStatus(b.spent_amount, b.limit_amount)
            const style = getStatusStyle(status)
            return (
              <Card key={b.id}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCategoryIcon(b.category)}</span>
                      <h3 className="font-semibold text-gray-900">
                        {CATEGORIES.find((c) => c.key === b.category)?.label ?? b.category}
                      </h3>
                    </div>
                    <Badge className={style.badge} variant="outline">{style.label}</Badge>
                  </div>
                  <Progress value={pct} className={`h-2.5 ${style.bar}`} />
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(b.spent_amount)}</p>
                      <p className="text-xs text-gray-500">gastado</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">de {formatCurrency(b.limit_amount)}</p>
                      <p className="text-xs text-gray-400">{pct.toFixed(0)}% utilizado</p>
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

function BudgetForm({ month, year, onSuccess }: { month: number; year: number; onSuccess: () => void }) {
  const [category, setCategory] = useState("")
  const [limitAmount, setLimitAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category || !limitAmount) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("budgets").insert({
      user_id: user.id,
      category,
      month,
      year,
      limit_amount: parseFloat(limitAmount),
      spent_amount: 0,
    })
    setSubmitting(false)
    if (!error) { onSuccess(); toast.success("Presupuesto creado") }
    else if (error) toast.error("Error al crear presupuesto")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Categoría</label>
        <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.filter((c) => !["sueldo", "freelance", "ingreso_pasivo"].includes(c.key)).map((c) => (
              <SelectItem key={c.key} value={c.key}>{c.icon} {c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Límite mensual</label>
        <Input type="number" step="0.01" min="0" placeholder="500.00" value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)} required />
      </div>
      <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700">
        {submitting ? "Guardando..." : "Crear presupuesto"}
      </Button>
    </form>
  )
}

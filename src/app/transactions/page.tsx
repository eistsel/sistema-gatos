"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency, getCategoryIcon } from "@/lib/finance/helpers"
import { CATEGORIES, type Transaction, type TransactionType } from "@/types/database"
import { Plus, Search } from "lucide-react"
import { toast } from "sonner"

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | TransactionType>("all")
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase.from("transactions").select("*").order("date", { ascending: false }).limit(50)
    if (data) setTransactions(data)
    setLoading(false)
  }

  const filtered = transactions.filter((t) => {
    if (filter !== "all" && t.type !== filter) return false
    if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const badgeColors: Record<string, string> = {
    vivienda: "bg-emerald-100 text-emerald-700",
    alimentacion: "bg-amber-100 text-amber-700",
    transporte: "bg-orange-100 text-orange-700",
    salud: "bg-red-100 text-red-700",
    suscripciones: "bg-purple-100 text-purple-700",
    entretenimiento: "bg-pink-100 text-pink-700",
    sueldo: "bg-blue-100 text-blue-700",
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Transacciones</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Nuevo
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nueva transacción</DialogTitle>
              </DialogHeader>
              <TransactionForm onSuccess={() => { loadData(); setOpen(false) }} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>Todos</FilterChip>
          <FilterChip active={filter === "INGRESO"} onClick={() => setFilter("INGRESO")}>Ingresos</FilterChip>
          <FilterChip active={filter === "GASTO"} onClick={() => setFilter("GASTO")}>Gastos</FilterChip>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Cargando...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Sin transacciones</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs">Fecha</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs">Descripción</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs">Categoría</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs">Cuenta</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-500 text-xs">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => (
                      <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-3 px-4 text-gray-500">{t.date}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{t.description}</td>
                        <td className="py-3 px-4">
                          <Badge className={badgeColors[t.category] ?? "bg-gray-100 text-gray-700"} variant="outline">
                            {getCategoryIcon(t.category)} {CATEGORIES.find((c) => c.key === t.category)?.label ?? t.category}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-500">{t.account_id ? "Cuenta" : "-"}</td>
                        <td className={`py-3 px-4 text-right font-medium ${t.type === "INGRESO" ? "text-emerald-600" : "text-red-600"}`}>
                          {t.type === "INGRESO" ? "+" : "-"}{formatCurrency(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  )
}

function TransactionForm({ onSuccess }: { onSuccess: () => void }) {
  const [type, setType] = useState<TransactionType>("GASTO")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !description) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      date: new Date().toISOString().split("T")[0],
      type,
      amount: parseFloat(amount),
      category: category || "otros",
      description,
    })

    if (!error) { onSuccess(); toast.success("Transacción registrada") }
    else if (error) toast.error("Error al registrar")
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <button type="button" onClick={() => setType("GASTO")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${type === "GASTO" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>Gasto</button>
        <button type="button" onClick={() => setType("INGRESO")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${type === "INGRESO" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>Ingreso</button>
      </div>
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Monto</label>
        <Input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Descripción</label>
        <Input placeholder="¿En qué gastaste?" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Categoría</label>
          <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.filter((c) => type === "INGRESO" ? ["sueldo", "freelance", "ingreso_pasivo", "otros"].includes(c.key) : !["sueldo", "freelance", "ingreso_pasivo"].includes(c.key)).map((c) => (
              <SelectItem key={c.key} value={c.key}>{c.icon} {c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700">
        {submitting ? "Guardando..." : "Registrar"}
      </Button>
    </form>
  )
}

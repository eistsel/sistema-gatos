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
import { formatCurrency } from "@/lib/finance/helpers"
import type { Account, AccountType } from "@/types/database"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

const accountTypeLabels: Record<AccountType, string> = {
  ahorro: "Ahorro",
  corriente: "Corriente",
  efectivo: "Efectivo",
  tarjeta_credito: "Tarjeta de crédito",
}

const accountTypeColors: Record<AccountType, string> = {
  ahorro: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  corriente: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  efectivo: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  tarjeta_credito: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  useEffect(() => { loadData() }, [])

  function handleEdit(a: Account) {
    setEditingAccount(a)
    setOpen(true)
  }

  function handleNew() {
    setEditingAccount(null)
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar esta cuenta?")) return
    const supabase = createClient()
    const { error } = await supabase.from("accounts").delete().eq("id", id)
    if (!error) { toast.success("Cuenta eliminada"); loadData() }
    else toast.error("Error al eliminar")
  }

  function handleClose() {
    setOpen(false)
    setEditingAccount(null)
  }

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase.from("accounts").select("*").order("type")
    if (data) setAccounts(data)
    setLoading(false)
  }

  const netAssets = accounts.filter((a) => a.include_in_net && a.type !== "tarjeta_credito").reduce((s, a) => s + a.balance, 0)
  const netDebt = accounts.filter((a) => a.type === "tarjeta_credito").reduce((s, a) => s + a.balance, 0)
  const netWorth = netAssets - netDebt

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Cuentas</h1>
          <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); setOpen(v) }}>
            <DialogTrigger onClick={handleNew} className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Nueva cuenta
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>{editingAccount ? "Editar cuenta" : "Nueva cuenta"}</DialogTitle></DialogHeader>
              <AccountForm initial={editingAccount} onSuccess={() => { loadData(); handleClose() }} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Activos netos</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(netAssets)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Deudas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(netDebt)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Patrimonio neto</p>
              <p className={`text-2xl font-bold ${netWorth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{formatCurrency(netWorth)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Cargando...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Sin cuentas registradas</div>
          ) : accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">{account.name}</h3>
                    <Badge className={accountTypeColors[account.type]} variant="outline">{accountTypeLabels[account.type]}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-lg font-bold ${account.type === "tarjeta_credito" ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                      {account.type === "tarjeta_credito" ? "-" : ""}{formatCurrency(account.balance)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {account.include_in_net ? "Incluido en neto" : "Excluido de neto"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleEdit(account)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(account.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

const accountSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  balance: z.string().refine((v) => v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), "Debe ser un número válido"),
})

function AccountForm({ initial, onSuccess }: { initial: Account | null; onSuccess: () => void }) {
  const [name, setName] = useState(initial?.name ?? "")
  const [type, setType] = useState<AccountType>(initial?.type ?? "corriente")
  const [balance, setBalance] = useState(initial ? String(initial.balance) : "")
  const [includeInNet, setIncludeInNet] = useState(initial?.include_in_net ?? true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = accountSchema.safeParse({ name, balance })
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

    const payload = { name, type, balance: parseFloat(balance || "0"), include_in_net: includeInNet }

    const { error } = initial
      ? await supabase.from("accounts").update(payload).eq("id", initial.id)
      : await supabase.from("accounts").insert({ ...payload, user_id: user.id })
    setSubmitting(false)
    if (!error) { onSuccess(); toast.success(initial ? "Cuenta actualizada" : "Cuenta creada") }
    else toast.error("Error al guardar")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Nombre</label>
        <Input placeholder="BCP Ahorros" value={name} onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: "" })) }} />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Tipo</label>
        <Select value={type} onValueChange={(v) => v && setType(v as AccountType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ahorro">Ahorro</SelectItem>
            <SelectItem value="corriente">Corriente</SelectItem>
            <SelectItem value="efectivo">Efectivo</SelectItem>
            <SelectItem value="tarjeta_credito">Tarjeta de crédito</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Balance inicial</label>
        <Input type="number" step="0.01" placeholder="0.00" value={balance} onChange={(e) => { setBalance(e.target.value); setErrors((prev) => ({ ...prev, balance: "" })) }} />
        {errors.balance && <p className="text-xs text-red-500 mt-1">{errors.balance}</p>}
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={includeInNet} onChange={(e) => setIncludeInNet(e.target.checked)} className="rounded" />
        Incluir en patrimonio neto
      </label>
      <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700">
        {submitting ? "Guardando..." : initial ? "Actualizar" : "Crear cuenta"}
      </Button>
    </form>
  )
}

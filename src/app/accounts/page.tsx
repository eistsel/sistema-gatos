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
import { Plus } from "lucide-react"
import { toast } from "sonner"

const accountTypeLabels: Record<AccountType, string> = {
  ahorro: "Ahorro",
  corriente: "Corriente",
  efectivo: "Efectivo",
  tarjeta_credito: "Tarjeta de crédito",
}

const accountTypeColors: Record<AccountType, string> = {
  ahorro: "bg-emerald-100 text-emerald-700",
  corriente: "bg-blue-100 text-blue-700",
  efectivo: "bg-amber-100 text-amber-700",
  tarjeta_credito: "bg-red-100 text-red-700",
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => { loadData() }, [])

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
          <h1 className="text-2xl font-bold text-gray-900">Cuentas</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Nueva cuenta
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Nueva cuenta</DialogTitle></DialogHeader>
              <AccountForm onSuccess={() => { loadData(); setOpen(false) }} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-gray-500">Activos netos</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(netAssets)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-gray-500">Deudas</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(netDebt)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-gray-500">Patrimonio neto</p>
              <p className={`text-2xl font-bold ${netWorth >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(netWorth)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Cargando...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center text-gray-400 py-8">Sin cuentas registradas</div>
          ) : accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-gray-900">{account.name}</h3>
                    <Badge className={accountTypeColors[account.type]} variant="outline">{accountTypeLabels[account.type]}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${account.type === "tarjeta_credito" ? "text-red-600" : "text-gray-900"}`}>
                    {account.type === "tarjeta_credito" ? "-" : ""}{formatCurrency(account.balance)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {account.include_in_net ? "Incluido en neto" : "Excluido de neto"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

function AccountForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("")
  const [type, setType] = useState<AccountType>("corriente")
  const [balance, setBalance] = useState("")
  const [includeInNet, setIncludeInNet] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("accounts").insert({
      user_id: user.id,
      name,
      type,
      balance: parseFloat(balance || "0"),
      include_in_net: includeInNet,
    })
    setSubmitting(false)
    if (!error) { onSuccess(); toast.success("Cuenta creada") }
    else if (error) toast.error("Error al crear cuenta")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Nombre</label>
        <Input placeholder="BCP Ahorros" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Tipo</label>
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
        <label className="text-sm text-gray-600 mb-1 block">Balance inicial</label>
        <Input type="number" step="0.01" placeholder="0.00" value={balance} onChange={(e) => setBalance(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={includeInNet} onChange={(e) => setIncludeInNet(e.target.checked)} className="rounded" />
        Incluir en patrimonio neto
      </label>
      <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700">
        {submitting ? "Guardando..." : "Crear cuenta"}
      </Button>
    </form>
  )
}

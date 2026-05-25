"use client"

import { useEffect, useState, useRef } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CategoryIcon } from "@/components/finance/CategoryIcon"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/finance/helpers"
import { CATEGORIES, type Account, type Transaction, type TransactionType } from "@/types/database"
import { createTransaction, updateTransaction, deleteTransaction } from "@/lib/server/actions/transactions"
import { Plus, Search, Pencil, Trash2, Repeat } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | TransactionType>("all")
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => { loadData() }, [])

  function handleEdit(t: Transaction) {
    setEditingTransaction(t)
    setOpen(true)
  }

  function handleNew() {
    setEditingTransaction(null)
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar esta transacción?")) return
    try {
      await deleteTransaction(id)
      toast.success("Transacción eliminada")
      loadData()
    } catch {
      toast.error("Error al eliminar")
    }
  }

  function handleClose() {
    setOpen(false)
    setEditingTransaction(null)
  }

  async function loadData() {
    const supabase = createClient()
    const [txRes, accRes] = await Promise.all([
      supabase.from("transactions").select("*").order("date", { ascending: false }).limit(50),
      supabase.from("accounts").select("*"),
    ])
    if (txRes.data) setTransactions(txRes.data)
    if (accRes.data) setAccounts(accRes.data)
    setLoading(false)
  }

  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a.name]))

  const filtered = transactions.filter((t) => {
    if (filter !== "all" && t.type !== filter) return false
    if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const badgeColors: Record<string, string> = {
    vivienda: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    alimentacion: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    transporte: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
    salud: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    suscripciones: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
    entretenimiento: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400",
    sueldo: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Transacciones</h1>
          <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); setOpen(v) }}>
            <DialogTrigger onClick={handleNew} className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Nuevo
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingTransaction ? "Editar transacción" : "Nueva transacción"}</DialogTitle>
              </DialogHeader>
              <TransactionForm accounts={accounts} initial={editingTransaction} onSuccess={() => { loadData(); handleClose() }} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              <div className="p-8 text-center text-muted-foreground">Cargando...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Sin transacciones</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs">Fecha</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs">Descripción</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs">Categoría</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs">Cuenta</th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs">Monto</th>
                      <th className="py-3 px-4 font-semibold text-muted-foreground text-xs w-20">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="py-3 px-4 text-muted-foreground">{t.date}</td>
                        <td className="py-3 px-4 font-medium text-foreground">
                          <div className="flex items-center gap-1.5">
                            {t.description}
                            {t.is_recurring && <Repeat className="h-3.5 w-3.5 text-amber-500" aria-label="Recurrente" />}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={badgeColors[t.category] ?? "bg-muted text-muted-foreground"} variant="outline">
                            <CategoryIcon category={t.category} /> {CATEGORIES.find((c) => c.key === t.category)?.label ?? t.category}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{t.account_id ? (accountMap[t.account_id] ?? "Cuenta") : "-"}</td>
                        <td className={`py-3 px-4 text-right font-medium ${t.type === "INGRESO" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {t.type === "INGRESO" ? "+" : "-"}{formatCurrency(t.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(t)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Editar">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Eliminar">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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
        active ? "bg-emerald-600 text-white" : "bg-card border border-border text-muted-foreground hover:bg-muted/50"
      }`}
    >
      {children}
    </button>
  )
}

const transactionSchema = z.object({
  type: z.enum(["INGRESO", "GASTO"]),
  amount: z.string().min(1, "El monto es requerido").refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Debe ser un número positivo"),
  category: z.string().min(1, "Selecciona una categoría"),
  description: z.string().min(1, "La descripción es requerida"),
  accountId: z.string().optional(),
})

function TransactionForm({ accounts, initial, onSuccess }: { accounts: Account[]; initial: Transaction | null; onSuccess: () => void }) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? "GASTO")
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "")
  const [category, setCategory] = useState(initial?.category ?? "")
  const [accountId, setAccountId] = useState(initial?.account_id ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? "")
  const [isRecurring, setIsRecurring] = useState(initial?.is_recurring ?? false)
  const [note, setNote] = useState(initial?.note ?? "")
  const [attachmentUrl, setAttachmentUrl] = useState(initial?.attachment_url ?? "")
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: formData })
    const data = await res.json()
    if (data.url) setAttachmentUrl(data.url)
    else toast.error("Error al subir la imagen")
    setUploading(false)
  }

  function removeAttachment() {
    setAttachmentUrl("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = transactionSchema.safeParse({ type, amount, category: category || "otros", description, accountId })
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
    try {
      const payload = { type, amount: parseFloat(amount), category: category || "otros", description, subcategory: subcategory || null, is_recurring: isRecurring, note: note || null, attachment_url: attachmentUrl || null, account_id: accountId || undefined }

      if (initial) {
        await updateTransaction(initial.id, payload as Record<string, unknown>)
      } else {
        await createTransaction(payload)
      }
      onSuccess()
      toast.success(initial ? "Transacción actualizada" : "Transacción registrada")
    } catch {
      toast.error("Error al guardar")
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <button type="button" onClick={() => setType("GASTO")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${type === "GASTO" ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>Gasto</button>
        <button type="button" onClick={() => setType("INGRESO")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${type === "INGRESO" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>Ingreso</button>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Monto</label>
        <Input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => { setAmount(e.target.value); setErrors((prev) => ({ ...prev, amount: "" })) }} />
        {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Descripción</label>
        <Input placeholder="¿En qué gastaste?" value={description} onChange={(e) => { setDescription(e.target.value); setErrors((prev) => ({ ...prev, description: "" })) }} />
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Categoría</label>
          <Select value={category} onValueChange={(v) => { setCategory(v ?? ""); setErrors((prev) => ({ ...prev, category: "" })) }}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.filter((c) => type === "INGRESO" ? ["sueldo", "freelance", "ingreso_pasivo", "otros"].includes(c.key) : !["sueldo", "freelance", "ingreso_pasivo"].includes(c.key)).map((c) => (
              <SelectItem key={c.key} value={c.key}>{c.icon} {c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Cuenta</label>
        <Select value={accountId} onValueChange={(v) => setAccountId(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="Sin cuenta" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Subcategoría (opcional)</label>
        <Input placeholder="Ej: Comida fuera, Café" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="rounded" />
        Gasto recurrente (suscripción, mensualidad)
      </label>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Nota (opcional)</label>
        <Textarea placeholder="Anota algún detalle..." value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[60px]" />
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Foto del recibo (opcional)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 dark:file:bg-emerald-900/40 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-100 dark:hover:file:bg-emerald-900/60"
        />
        {uploading && <p className="text-xs text-muted-foreground mt-1">Subiendo...</p>}
        {attachmentUrl && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 truncate">✅ Foto subida</span>
            <button type="button" onClick={removeAttachment} className="text-xs text-red-500 hover:underline">Eliminar</button>
          </div>
        )}
      </div>
      <Button type="submit" disabled={submitting || uploading} className="w-full bg-emerald-600 hover:bg-emerald-700">
        {submitting ? "Guardando..." : initial ? "Actualizar" : "Registrar"}
      </Button>
    </form>
  )
}

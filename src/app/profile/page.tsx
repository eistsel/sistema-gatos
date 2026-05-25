"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types/database"
import { toast } from "sonner"
import { z } from "zod"

const profileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  currency: z.string().min(1, "Selecciona una moneda"),
  timezone: z.string().min(1, "Selecciona una zona horaria"),
  profile_type: z.string().min(1, "Selecciona un perfil"),
})

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    if (data) setProfile(data)
    setLoading(false)
  }

  async function handleSave() {
    if (!profile) return
    const result = profileSchema.safeParse(profile)
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
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from("profiles").update({
      name: profile.name,
      currency: profile.currency,
      timezone: profile.timezone,
      profile_type: profile.profile_type,
      main_goal: profile.main_goal,
    }).eq("id", profile.id)
    setSaving(false)
    if (!error) toast.success("Perfil actualizado")
    else toast.error("Error al guardar")
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Cargando...</div>
      </DashboardLayout>
    )
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center text-muted-foreground py-8">No se pudo cargar el perfil</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-xl space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
        <Card>
          <CardHeader>
            <CardTitle>Configuración personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Nombre</label>
              <Input value={profile.name ?? ""} onChange={(e) => { setProfile({ ...profile, name: e.target.value }); setErrors((prev) => ({ ...prev, name: "" })) }} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Moneda</label>
              <Select value={profile.currency ?? "PEN"} onValueChange={(v) => { setProfile({ ...profile, currency: v }); setErrors((prev) => ({ ...prev, currency: "" })) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEN">S/ — Sol peruano</SelectItem>
                  <SelectItem value="USD">$ — Dólar estadounidense</SelectItem>
                  <SelectItem value="EUR">€ — Euro</SelectItem>
                </SelectContent>
              </Select>
              {errors.currency && <p className="text-xs text-red-500 mt-1">{errors.currency}</p>}
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Zona horaria</label>
              <Select value={profile.timezone ?? "America/Lima"} onValueChange={(v) => { setProfile({ ...profile, timezone: v }); setErrors((prev) => ({ ...prev, timezone: "" })) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Lima">América/Lima (UTC-5)</SelectItem>
                  <SelectItem value="America/Mexico_City">América/Ciudad de México (UTC-6)</SelectItem>
                  <SelectItem value="America/Argentina/Buenos_Aires">América/Buenos Aires (UTC-3)</SelectItem>
                  <SelectItem value="America/Bogota">América/Bogotá (UTC-5)</SelectItem>
                  <SelectItem value="America/Santiago">América/Santiago (UTC-4)</SelectItem>
                </SelectContent>
              </Select>
              {errors.timezone && <p className="text-xs text-red-500 mt-1">{errors.timezone}</p>}
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Perfil laboral</label>
              <Select value={profile.profile_type ?? "empleado"} onValueChange={(v) => { setProfile({ ...profile, profile_type: v }); setErrors((prev) => ({ ...prev, profile_type: "" })) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="empleado">Empleado dependiente</SelectItem>
                  <SelectItem value="freelancer">Freelancer</SelectItem>
                  <SelectItem value="estudiante">Estudiante</SelectItem>
                  <SelectItem value="independiente">Independiente</SelectItem>
                </SelectContent>
              </Select>
              {errors.profile_type && <p className="text-xs text-red-500 mt-1">{errors.profile_type}</p>}
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Meta principal</label>
              <Input placeholder="Ej: Ahorrar para un viaje" value={profile.main_goal ?? ""} onChange={(e) => setProfile({ ...profile, main_goal: e.target.value })} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

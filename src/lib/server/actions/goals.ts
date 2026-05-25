"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createGoal(data: {
  name: string; target_amount: number; current_amount: number
  deadline: string | null; monthly_contribution: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado")
  const { error } = await supabase.from("savings_goals").insert({ ...data, user_id: user.id })
  if (error) throw error
  revalidatePath("/goals")
  revalidatePath("/dashboard")
}

export async function updateGoal(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { error } = await supabase.from("savings_goals").update(data).eq("id", id)
  if (error) throw error
  revalidatePath("/goals")
  revalidatePath("/dashboard")
}

export async function deleteGoal(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("savings_goals").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/goals")
  revalidatePath("/dashboard")
}

export async function updateProfile(data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado")
  const { error } = await supabase.from("profiles").update(data).eq("id", user.id)
  if (error) throw error
  revalidatePath("/profile")
}

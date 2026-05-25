"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createBudget(data: { category: string; limit_amount: number; month: number; year: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado")
  const { error } = await supabase.from("budgets").insert({ ...data, spent_amount: 0, user_id: user.id })
  if (error) throw error
  revalidatePath("/budgets")
  revalidatePath("/dashboard")
}

export async function updateBudget(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { error } = await supabase.from("budgets").update(data).eq("id", id)
  if (error) throw error
  revalidatePath("/budgets")
  revalidatePath("/dashboard")
}

export async function deleteBudget(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("budgets").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/budgets")
  revalidatePath("/dashboard")
}

"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createAccount(data: { name: string; type: string; balance: number; include_in_net: boolean }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado")
  const { error } = await supabase.from("accounts").insert({ ...data, user_id: user.id })
  if (error) throw error
  revalidatePath("/accounts")
}

export async function updateAccount(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { error } = await supabase.from("accounts").update(data).eq("id", id)
  if (error) throw error
  revalidatePath("/accounts")
}

export async function deleteAccount(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("accounts").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/accounts")
}

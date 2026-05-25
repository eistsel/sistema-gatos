"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createTransaction(data: {
  type: string; amount: number; category: string; description: string
  account_id?: string; subcategory?: string | null; is_recurring?: boolean
  note?: string | null; attachment_url?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado")

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id, date: new Date().toISOString().split("T")[0],
    ...data,
  })
  if (error) throw error
  revalidatePath("/transactions")
  revalidatePath("/dashboard")
  revalidatePath("/analysis")
}

export async function updateTransaction(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { error } = await supabase.from("transactions").update(data).eq("id", id)
  if (error) throw error
  revalidatePath("/transactions")
  revalidatePath("/dashboard")
  revalidatePath("/analysis")
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("transactions").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/transactions")
  revalidatePath("/dashboard")
  revalidatePath("/analysis")
}

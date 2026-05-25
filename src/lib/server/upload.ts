import { createClient } from "@/lib/supabase/server"

export async function uploadReceipt(file: File, userId: string): Promise<string | null> {
  const supabase = await createClient()
  const ext = file.name.split(".").pop() ?? "jpg"
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from("receipts").upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    console.error("Upload error:", error)
    return null
  }

  const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(path)
  return urlData.publicUrl
}

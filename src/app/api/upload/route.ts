import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })
  }

  const ext = file.name.split(".").pop() ?? "jpg"
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage.from("receipts").upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(path)

  return NextResponse.json({ url: urlData.publicUrl })
}

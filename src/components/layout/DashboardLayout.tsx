"use client"

import { Sidebar } from "./Sidebar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-16 p-8">
        {children}
      </main>
    </div>
  )
}

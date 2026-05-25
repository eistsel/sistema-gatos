import { DashboardLayout } from "@/components/layout/DashboardLayout"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="h-10 w-full bg-card rounded-xl border border-border" />
        <div className="h-64 bg-card rounded-xl border border-border" />
      </div>
    </DashboardLayout>
  )
}

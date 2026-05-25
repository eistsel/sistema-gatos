import { DashboardLayout } from "@/components/layout/DashboardLayout"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-48 bg-card rounded-xl border border-border" />
          <div className="h-48 bg-card rounded-xl border border-border" />
        </div>
      </div>
    </DashboardLayout>
  )
}

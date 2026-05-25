import { DashboardLayout } from "@/components/layout/DashboardLayout"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-card rounded-xl border border-border p-5 space-y-3">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-8 w-32 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-card rounded-xl border border-border" />
          <div className="h-72 bg-card rounded-xl border border-border" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-48 bg-card rounded-xl border border-border" />
          <div className="h-48 bg-card rounded-xl border border-border" />
        </div>
      </div>
    </DashboardLayout>
  )
}

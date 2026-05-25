import { DashboardLayout } from "@/components/layout/DashboardLayout"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-card rounded-xl border border-border p-4 space-y-2">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-6 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-card rounded-xl border border-border" />
          <div className="h-72 bg-card rounded-xl border border-border" />
        </div>
      </div>
    </DashboardLayout>
  )
}

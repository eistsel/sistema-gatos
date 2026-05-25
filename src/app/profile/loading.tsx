import { DashboardLayout } from "@/components/layout/DashboardLayout"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="max-w-xl h-96 bg-card rounded-xl border border-border p-6 space-y-4">
          <div className="h-16 w-16 bg-muted rounded-full" />
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
        </div>
      </div>
    </DashboardLayout>
  )
}

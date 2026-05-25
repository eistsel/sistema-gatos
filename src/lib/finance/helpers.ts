export function formatCurrency(amount: number, currency = "S/"): string {
  return `${currency} ${Math.abs(amount).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

export function getMonthDateRange(month: number, year: number, startDay: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, startDay)
  const end = startDay === 1
    ? new Date(year, month, 0)
    : new Date(year, month, startDay - 1)
  return { start, end }
}

export function getDaysElapsed(month: number, year: number, startDay: number): number {
  const now = new Date()
  const { start } = getMonthDateRange(month, year, startDay)
  if (now < start) return 0
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    vivienda: "Home", alimentacion: "ShoppingCart", transporte: "Car",
    salud: "HeartPulse", ropa: "Shirt", suscripciones: "Radio",
    entretenimiento: "Gamepad2", educacion: "GraduationCap", deudas: "CreditCard",
    regalos: "Gift", emergencias: "TriangleAlert", otros: "Package",
    sueldo: "Briefcase", freelance: "Laptop", ingreso_pasivo: "TrendingUp",
  }
  return icons[category] ?? "Package"
}




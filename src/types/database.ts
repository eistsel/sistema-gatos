export interface Profile {
  id: string
  name: string | null
  currency: string | null
  timezone: string | null
  month_start_day: number | null
  profile_type: string | null
  main_goal: string | null
  created_at: string | null
}

export type AccountType = "ahorro" | "corriente" | "efectivo" | "tarjeta_credito"

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  balance: number
  include_in_net: boolean
  created_at: string | null
}

export type TransactionType = "INGRESO" | "GASTO"

export interface Transaction {
  id: string
  user_id: string
  account_id: string | null
  date: string
  type: TransactionType
  amount: number
  category: string
  subcategory: string | null
  description: string
  is_recurring: boolean
  note: string | null
  attachment_url: string | null
  created_at: string | null
}

export interface Budget {
  id: string
  user_id: string
  category: string
  month: number
  year: number
  limit_amount: number
  spent_amount: number
}

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  monthly_contribution: number | null
  created_at: string | null
}

export type BudgetStatus = "ok" | "warning" | "exceeded"

export const CATEGORIES = [
  { key: "vivienda", label: "Vivienda", icon: "🏠" },
  { key: "alimentacion", label: "Alimentación", icon: "🛒" },
  { key: "transporte", label: "Transporte", icon: "🚗" },
  { key: "salud", label: "Salud", icon: "🏥" },
  { key: "ropa", label: "Ropa y cuidado personal", icon: "👗" },
  { key: "suscripciones", label: "Suscripciones", icon: "📱" },
  { key: "entretenimiento", label: "Entretenimiento", icon: "🎮" },
  { key: "educacion", label: "Educación", icon: "🎓" },
  { key: "deudas", label: "Deudas", icon: "💳" },
  { key: "regalos", label: "Regalos y social", icon: "🎁" },
  { key: "emergencias", label: "Emergencias", icon: "🆘" },
  { key: "otros", label: "Otros", icon: "📦" },
  { key: "sueldo", label: "Sueldo", icon: "💼" },
  { key: "freelance", label: "Freelance", icon: "💻" },
  { key: "ingreso_pasivo", label: "Ingreso pasivo", icon: "🏦" },
] as const

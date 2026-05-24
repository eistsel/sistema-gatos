import type { BudgetStatus } from "@/types/database"

export function getBudgetStatus(spent: number, limit: number): BudgetStatus {
  if (limit === 0) return "ok"
  const pct = (spent / limit) * 100
  if (pct > 100) return "exceeded"
  if (pct >= 75) return "warning"
  return "ok"
}

export function applyThreeBoxesRule(income: number) {
  return {
    needs: income * 0.5,
    wants: income * 0.3,
    savings: income * 0.2,
  }
}

export interface DebtMethodResult {
  method: "avalancha" | "bola_de_nieve"
  explanation: string
}

export function suggestDebtMethod(
  debts: { name: string; balance: number; interestRate: number }[]
): DebtMethodResult {
  if (debts.length <= 1) {
    return { method: "avalancha", explanation: "Una sola deuda. Enfócate en pagarla." }
  }

  const uniqueRates = new Set(debts.map((d) => d.interestRate))
  if (uniqueRates.size > 1) {
    return {
      method: "avalancha",
      explanation: "Avalancha: paga primero la deuda con mayor tasa de interés. Ahorras más en intereses a largo plazo.",
    }
  }

  return {
    method: "bola_de_nieve",
    explanation: "Bola de nieve: paga primero la deuda con menor saldo. Ganas motivación al ver progreso rápido.",
  }
}

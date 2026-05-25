"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Sun, Moon, LayoutDashboard, ArrowLeftRight, Building2,
  TrendingUp, Target, Trophy, User, Wallet,
} from "lucide-react"

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="h-4 w-4" />,
  transactions: <ArrowLeftRight className="h-4 w-4" />,
  accounts: <Building2 className="h-4 w-4" />,
  analysis: <TrendingUp className="h-4 w-4" />,
  budgets: <Target className="h-4 w-4" />,
  goals: <Trophy className="h-4 w-4" />,
  profile: <User className="h-4 w-4" />,
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/transactions", label: "Transacciones", key: "transactions" },
  { href: "/accounts", label: "Cuentas", key: "accounts" },
  { href: "/analysis", label: "Análisis", key: "analysis" },
  { href: "/budgets", label: "Presupuestos", key: "budgets" },
  { href: "/goals", label: "Metas", key: "goals" },
  { href: "/profile", label: "Perfil", key: "profile" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const currentTheme = mounted ? (theme === "system" ? resolvedTheme : theme) : "light"

  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col gap-1 p-4 z-50 transition-all duration-300 ease-in-out"
      style={{ width: expanded ? "15rem" : "4rem" }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="flex items-center gap-3 h-14 mb-2 overflow-hidden">
        <Wallet className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span
          className="text-base font-bold text-foreground whitespace-nowrap transition-opacity duration-300"
          style={{ opacity: expanded ? 1 : 0 }}
        >
          Mis Finanzas
        </span>
      </div>
      <nav className="flex flex-col gap-1 flex-1 overflow-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 h-11 rounded-lg text-sm transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-medium"
                  : "text-muted-foreground hover:bg-accent"
              }`}
              style={{ paddingLeft: expanded ? "0.75rem" : "0.625rem" }}
            >
              <span className="shrink-0 text-foreground">{iconMap[item.key]}</span>
              <span
                className="transition-opacity duration-300"
                style={{ opacity: expanded ? 1 : 0 }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
      <button
        onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
        className="flex items-center gap-3 h-11 rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors whitespace-nowrap overflow-hidden"
        style={{ paddingLeft: expanded ? "0.75rem" : "0.625rem" }}
      >
        {currentTheme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
        <span
          className="transition-opacity duration-300"
          style={{ opacity: expanded ? 1 : 0 }}
        >
          {currentTheme === "dark" ? "Claro" : "Oscuro"}
        </span>
      </button>
    </aside>
  )
}

import {
  Home, ShoppingCart, Car, HeartPulse, Shirt, Radio,
  Gamepad2, GraduationCap, CreditCard, Gift, TriangleAlert,
  Package, Briefcase, Laptop, TrendingUp,
} from "lucide-react"
import { getCategoryIcon } from "@/lib/finance/helpers"

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home className="h-4 w-4" />,
  ShoppingCart: <ShoppingCart className="h-4 w-4" />,
  Car: <Car className="h-4 w-4" />,
  HeartPulse: <HeartPulse className="h-4 w-4" />,
  Shirt: <Shirt className="h-4 w-4" />,
  Radio: <Radio className="h-4 w-4" />,
  Gamepad2: <Gamepad2 className="h-4 w-4" />,
  GraduationCap: <GraduationCap className="h-4 w-4" />,
  CreditCard: <CreditCard className="h-4 w-4" />,
  Gift: <Gift className="h-4 w-4" />,
  TriangleAlert: <TriangleAlert className="h-4 w-4" />,
  Package: <Package className="h-4 w-4" />,
  Briefcase: <Briefcase className="h-4 w-4" />,
  Laptop: <Laptop className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
}

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const iconName = getCategoryIcon(category)
  return <span className={className}>{iconMap[iconName] ?? <Package className="h-4 w-4" />}</span>
}

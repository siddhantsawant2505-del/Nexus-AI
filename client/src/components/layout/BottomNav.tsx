import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  Trophy,
  User,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Nexus", path: "/dashboard" },
  { icon: Dumbbell, label: "Workout", path: "/workout" },
  { icon: UtensilsCrossed, label: "Nutrition", path: "/nutrition" },
  { icon: Trophy, label: "Arena", path: "/arena" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-technical-slate/5 md:hidden">
      <div className="flex items-center justify-around py-3 px-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 transition-all duration-200 ${
                active
                  ? "text-primary font-bold"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-display tracking-widest uppercase font-black">
                {label}
              </span>
              {active && (
                <div className="w-1.5 h-1.5 bg-primary mt-1" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

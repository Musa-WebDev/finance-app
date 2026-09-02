import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Authenticated, Unauthenticated } from "@/components/providers/auth.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import {
  LayoutDashboard,
  Landmark,
  PieChart,
  TrendingUp,
  LogOut,
  Menu,
  X,
  DollarSign,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { motion, AnimatePresence } from "motion/react";

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, to: "/" },
  { label: "Accounts", icon: Landmark, to: "/accounts" },
  { label: "Budget", icon: PieChart, to: "/budget" },
  { label: "Investments", icon: TrendingUp, to: "/investments" },
];

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signout } = useAuth();
  const location = useLocation();

  const initials = user?.user_metadata?.full_name
    ? String(user.user_metadata.full_name).split(" ").map((n) => n[0]).join("").toUpperCase()
    : "U";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
        <SidebarContent user={user} initials={initials} signout={signout} location={location} />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground z-50 flex flex-col md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="flex justify-end p-3">
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="text-sidebar-foreground">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <SidebarContent user={user} initials={initials} signout={signout} location={location} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-background">
          <button onClick={() => setMobileOpen(true)} className="cursor-pointer">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1.5 font-bold text-primary">
            <DollarSign className="h-5 w-5" />
            <span>FinanceOS</span>
          </div>
          <Authenticated>
            <Avatar className="h-8 w-8">
              <AvatarImage src={typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </Authenticated>
          <Unauthenticated>
            <SignInButton />
          </Unauthenticated>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around border-t bg-background md:hidden z-30">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) => {
          const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-3 text-xs transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

type SidebarContentProps = {
  user: ReturnType<typeof useAuth>["user"];
  initials: string;
  signout: () => Promise<void>;
  location: ReturnType<typeof useLocation>;
};

function SidebarContent({ user, initials, signout, location }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full py-4">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 pb-6">
        <div className="bg-sidebar-primary p-1.5 rounded-lg">
          <DollarSign className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <span className="font-bold text-lg tracking-tight">FinanceOS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) => {
          const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 mt-4">
        <Authenticated>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-sidebar-border">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : undefined} />
              <AvatarFallback className="text-xs bg-sidebar-accent text-sidebar-accent-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">{typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "User"}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email ?? ""}</p>
            </div>
            <button onClick={signout} className="cursor-pointer text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors shrink-0">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </Authenticated>
        <Unauthenticated>
          <div className="px-3">
            <SignInButton />
          </div>
        </Unauthenticated>
      </div>
    </div>
  );
}

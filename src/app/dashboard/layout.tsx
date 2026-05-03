"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Gem, 
  Users, 
  FileText, 
  Receipt, 
  LogOut, 
  Menu, 
  X, 
  Settings,
  Shield
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Items", href: "/dashboard/items", icon: Gem },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Quotations", href: "/dashboard/quotations", icon: FileText },
  { name: "Receipts", href: "/dashboard/receipts", icon: Receipt },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <Shield className="w-12 h-12 text-blue-500 animate-bounce" />
        <span className="mt-4 text-zinc-500 font-medium">Authenticating...</span>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen w-full bg-[#050505] text-zinc-100 flex overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-20"} 
        transition-all duration-300 ease-in-out
        border-r border-zinc-800/50 bg-[#0a0a0a] flex flex-col fixed h-full z-[70]
        print:hidden
      `}>
        <div className="p-6 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 border border-white/20 shadow-lg shadow-blue-500/20 overflow-hidden shrink-0">
            <img src="/logo.png" alt="TitanCore Logo" className="w-full h-full object-contain p-1" />
          </div>
          {(isSidebarOpen || isMobile) && <span className="font-bold text-lg tracking-tight text-white truncate">TitanCore</span>}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" 
                    : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"}
                `}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {(isSidebarOpen || isMobile) && <span className="font-medium text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800/50">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-3 rounded-xl w-full text-zinc-400 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {(isSidebarOpen || isMobile) && <span className="font-medium text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`
        flex-1 transition-all duration-300 print:ml-0
        ${isSidebarOpen && !isMobile ? "ml-64" : "ml-0 md:ml-20"}
      `}>
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800/50 bg-[#0a0a0a]/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 print:hidden">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-zinc-400 hover:text-white hover:bg-white/5">
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <h1 className="text-sm font-semibold text-zinc-300 truncate max-w-[120px] md:max-w-none">
              {navItems.find(i => pathname.startsWith(i.href))?.name || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-white">{user.username}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Admin</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-700 shrink-0" />
          </div>
        </header>

        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}


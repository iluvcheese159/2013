/* eslint-disable */
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import ThemeToggle from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { LogOut, User, LayoutDashboard, Sparkles, UserCircle, Layers, ShieldCheck, Tag, BarChart3, ShieldAlert } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TopBar() {
  const { user, guestOrUser, openAuth, logout, setUser } = useAuth();
  const { sidebarCollapsed } = useUI();
  const navigate = useNavigate();
  const [isDarkTheme, setIsDarkTheme] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const syncTheme = () => {
      const rootIsDark = document.documentElement.classList.contains("dark");
      setIsDarkTheme(rootIsDark);
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", syncTheme);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", syncTheme);
    };
  }, []);

  const becomeSeller = async () => {
    if (!user) { openAuth("signin"); return; }
    try {
      const r = await api.post("/auth/become-seller");
      setUser(r.data);
      toast.success("Seller mode enabled");
      navigate("/create");
    } catch { toast.error("Could not enable seller mode"); }
  };

  const claimOwner = async () => {
    try {
      const r = await api.post("/admin/claim-owner");
      setUser(r.data);
      toast.success("You are now the owner of Print Cosmos");
    } catch (e) {
      const detail = e?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Could not claim ownership");
    }
  };

  return (
    <header
      data-testid="top-bar"
      className={`fixed top-0 right-0 z-30 backdrop-blur-xl border-b border-border h-14 flex items-center px-6 transition-all ${
        isDarkTheme ? "bg-background/80" : "bg-white/95"
      } ${
        sidebarCollapsed ? "left-0 pl-16" : "left-16 md:left-20"
      }`}
    >
      <div className="ml-auto flex items-center gap-2">
        {/* Become a Seller — left of theme toggle */}
        {(!user || !user.is_seller) && (
          <Button
            data-testid="topbar-become-seller-btn"
            size="sm"
            variant="outline"
            onClick={becomeSeller}
            className="hidden sm:inline-flex font-tech text-xs uppercase tracking-wider rounded-xl"
          >
            <Tag className="h-3.5 w-3.5 mr-1.5" /> Become a Seller
          </Button>
        )}
        <ThemeToggle />
        {user ? (
          <>
            {!user.is_pro && (
              <Button
                data-testid="topbar-pro-btn"
                size="sm"
                variant="ghost"
                onClick={() => navigate("/pro")}
                className="hidden md:inline-flex text-accent hover:text-accent font-tech text-xs uppercase tracking-wider"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Pro
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger data-testid="user-menu-trigger" className="outline-none flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="hidden md:flex flex-col items-start text-left">
                  <span className="text-xs font-medium leading-tight flex items-center gap-1">
                    {user.name}
                    {user.is_seller && <Tag className="h-2.5 w-2.5 text-primary" strokeWidth={2.5} />}
                    {user.is_admin && <ShieldCheck className="h-2.5 w-2.5 text-accent" strokeWidth={2.5} />}
                  </span>
                  {user.user_tag && (
                    <span className="text-[9px] font-tech text-muted-foreground leading-tight">@ {user.user_tag}</span>
                  )}
                </div>
                <div
                  data-testid="topbar-threads-balance"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-[10px] font-tech uppercase tracking-wider"
                >
                  <span className="inline-flex h-[18px] items-center justify-center">
                    {!isDarkTheme ? (
                      <a href="https://thenounproject.com" target="_blank" rel="noreferrer" className="inline-flex h-[18px] items-center">
                        <img
                          src="https://static.thenounproject.com/png/7883039-200.png"
                          alt="Filament Threads"
                          className="h-[18px] w-auto object-contain"
                        />
                      </a>
                    ) : (
                      <img
                        src="https://static.thenounproject.com/png/7883039-200.png"
                        alt="Filament Threads"
                        className="h-[18px] w-auto object-contain"
                      />
                    )}
                  </span>
                  <span>{Math.max(0, Number(user.filament_threads_balance || 0))} Threads</span>
                </div>
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={user.picture} alt={user.name} />
                  <AvatarFallback className="bg-secondary text-foreground">{user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-tech text-xs">
                  <div className="flex items-center gap-1">
                    {user.name}
                    {user.is_seller && <Tag className="h-3 w-3 text-primary" strokeWidth={2.5} title="Seller" />}
                  </div>
                  <div className="text-muted-foreground font-normal truncate">{user.email}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {user.is_admin && (
                      <span className="text-[9px] font-tech uppercase tracking-wider px-2 py-0.5 bg-accent/15 text-accent border border-accent/40 rounded-full">
                        <ShieldCheck className="inline h-2.5 w-2.5 mr-0.5" />Owner
                      </span>
                    )}
                    {user.is_pro && (
                      <span className="text-[9px] font-tech uppercase tracking-wider px-2 py-0.5 bg-accent/10 text-accent border border-accent/30 rounded-full">
                        <Sparkles className="inline h-2.5 w-2.5 mr-0.5" />Pro
                      </span>
                    )}
                    {user.is_seller && (
                      <span className="text-[9px] font-tech uppercase tracking-wider px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full">Seller</span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="menu-profile" onClick={() => navigate("/profile")}>
                  <UserCircle className="h-4 w-4 mr-2" /> Edit profile
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-my-designs" onClick={() => navigate("/my-designs")}>
                  <Layers className="h-4 w-4 mr-2" /> My designs
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-dashboard" onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                </DropdownMenuItem>
                {user.is_platform_owner && (
                  <DropdownMenuItem data-testid="menu-owner-analytics" onClick={() => navigate("/owner/analytics")}>
                    <BarChart3 className="h-4 w-4 mr-2" /> Owner analytics
                  </DropdownMenuItem>
                )}
                {user.is_platform_owner && (
                  <DropdownMenuItem data-testid="menu-owner-control" onClick={() => navigate("/owner/control")}>
                    <ShieldAlert className="h-4 w-4 mr-2" /> Owner control hub
                  </DropdownMenuItem>
                )}
                {user.is_seller && (
                  <DropdownMenuItem data-testid="menu-create" onClick={() => navigate("/create")}>
                    <User className="h-4 w-4 mr-2" /> New listing
                  </DropdownMenuItem>
                )}
                {!user.is_pro && (
                  <DropdownMenuItem data-testid="menu-pro" onClick={() => navigate("/pro")}>
                    <Sparkles className="h-4 w-4 mr-2 text-accent" /> Upgrade to Pro
                  </DropdownMenuItem>
                )}
                {!user.is_admin && (
                  <DropdownMenuItem data-testid="menu-claim-owner" onClick={claimOwner}>
                    <ShieldCheck className="h-4 w-4 mr-2 text-accent" /> Claim ownership
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="menu-logout" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <div className="hidden sm:flex items-center gap-2 mr-2 pr-2 border-r border-border">
              <Avatar className="h-8 w-8 border border-border" data-testid="guest-avatar">
                <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
                  <UserCircle className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-tech text-muted-foreground">{guestOrUser.name}</span>
            </div>
            <Button
              data-testid="signin-btn"
              variant="outline"
              size="sm"
              onClick={() => openAuth("signin")}
              className="rounded-xl font-tech text-xs uppercase tracking-wider"
            >
              Sign in
            </Button>
            <Button
              data-testid="signup-btn"
              size="sm"
              onClick={() => openAuth("signup")}
              className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider"
            >
              Sign up
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

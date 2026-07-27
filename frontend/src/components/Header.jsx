import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, LayoutDashboard, Sparkles, Calculator, AlertTriangle, Grid3X3 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Header() {
  const { user, setUser, openAuth, logout } = useAuth();
  const navigate = useNavigate();

  const becomeCreator = async () => {
    try {
      const r = await api.post("/auth/become-creator");
      setUser(r.data);
      toast.success("You're now a creator. Open the designer to publish.");
      navigate("/designer");
    } catch {
      toast.error("Could not enable creator mode");
    }
  };

  const becomeSeller = async () => {
    try {
      const r = await api.post("/auth/become-seller");
      setUser(r.data);
      toast.success("Seller mode enabled.");
      navigate("/create");
    } catch {
      toast.error("Could not enable seller mode");
    }
  };

  const tabClass = ({ isActive }) =>
    `px-3 py-1.5 text-sm font-medium uppercase tracking-wider transition-colors ${
      isActive ? "text-primary" : "text-foreground/70 hover:text-foreground"
    }`;

  return (
    <header
      data-testid="site-header"
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border h-16 flex items-center px-6 md:px-12"
    >
<nav className="hidden md:flex items-center gap-1">
         <NavLink to="/browse" data-testid="nav-browse" className={tabClass}>
           Browse
         </NavLink>
         <NavLink to="/designer" data-testid="nav-design" className={tabClass}>
           Design
         </NavLink>
         <NavLink to="/designs" data-testid="nav-designs" className={tabClass}>
           Community
         </NavLink>
          <NavLink to="/boards" data-testid="nav-boards" className={tabClass}>
            <Grid3X3 className="h-3.5 w-3.5 mr-1" /> Boards
          </NavLink>
          <NavLink to="/filament-calculator" data-testid="nav-filament-calc" className={tabClass}>
           <Calculator className="h-3.5 w-3.5 mr-1" /> Filament
         </NavLink>
         <NavLink to="/print-failures" data-testid="nav-print-failures" className={tabClass}>
           <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Failures
         </NavLink>
       </nav>

      <div className="ml-auto flex items-center gap-2">
        {user ? (
          <>
            {!user.is_creator && (
              <Button
                data-testid="become-creator-btn"
                size="sm"
                variant="ghost"
                onClick={becomeCreator}
                className="hidden md:inline-flex font-tech text-xs uppercase tracking-wider text-accent hover:text-accent"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Become a Creator
              </Button>
            )}
            {!user.is_seller && (
              <Button
                data-testid="become-seller-btn"
                size="sm"
                variant="outline"
                onClick={becomeSeller}
                className="hidden sm:inline-flex font-tech text-xs uppercase tracking-wider"
              >
                Become a Seller
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger data-testid="user-menu-trigger" className="outline-none">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={user.picture} alt={user.name} />
                  <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-tech text-xs">
                  {user.name}
                  <div className="text-muted-foreground font-normal truncate">{user.email}</div>
                  <div className="flex gap-1 mt-2">
                    {user.is_creator && (
                      <span className="text-[9px] font-tech uppercase tracking-wider px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded-full">Creator</span>
                    )}
                    {user.is_seller && (
                      <span className="text-[9px] font-tech uppercase tracking-wider px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full">Seller</span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="menu-dashboard" onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-create" onClick={() => navigate("/create")}>
                  <User className="h-4 w-4 mr-2" />
                  New Listing
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-design" onClick={() => navigate("/designer")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Open Designer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="menu-logout" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button
            data-testid="signin-btn"
            onClick={() => openAuth("signin")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-tech text-xs uppercase tracking-wider rounded-xl"
          >
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}

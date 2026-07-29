/* eslint-disable */
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { useCart } from "@/contexts/CartContext";
import { Home, Hammer, Search, MessageSquare, ShoppingCart, Sparkles, PanelLeftClose, PanelLeftOpen, Tag, Rocket, ShieldAlert, FolderOpen, BookOpen } from "lucide-react";
import { BRAND_NAME } from "@/lib/branding";
import BrandLogo from "@/components/BrandLogo";

const NAV = [
  { to: "/", icon: Home, label: "Home", testid: "side-home" },
  { to: "/browse", icon: Search, label: "Browse", testid: "side-browse" },
  { to: "/designer", icon: Hammer, label: "Design", testid: "side-design" },
  { to: "/forums", icon: Rocket, label: "Mission Control", testid: "side-forums" },
  { to: "/collections", icon: FolderOpen, label: "Collections", testid: "side-collections" },
  { to: "/messages", icon: MessageSquare, label: "Messages", testid: "side-messages", auth: true },
  { to: "/docs", icon: BookOpen, label: "Documentation", testid: "side-docs" },
];

const OWNER_NAV = [
  { to: "/owner/control", icon: ShieldAlert, label: "Owner Control", testid: "side-owner-control", auth: true },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, openAuth } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useUI();
  const { count: cartCount } = useCart();

  const isActive = (to) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));

  const go = (item) => {
    if (item.auth && !user) {
      openAuth("signin");
      return;
    }
    navigate(item.to);
  };

  if (sidebarCollapsed) {
    return (
      <button
        data-testid="sidebar-expand-btn"
        onClick={toggleSidebar}
        title="Expand sidebar"
        className="fixed left-2 top-3 z-50 h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center text-foreground/70 hover:text-primary hover:border-primary transition-colors shadow-sm"
      >
        <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
      </button>
    );
  }

  const homeItem = NAV[0];

  return (
    <aside
      data-testid="sidebar"
      className="fixed left-0 top-0 bottom-0 w-16 md:w-20 border-r border-border bg-background z-40 flex flex-col items-center py-4"
    >
      <Link to="/" data-testid="sidebar-logo" className="mb-6 group" aria-label="Home">
        <BrandLogo
          alt={BRAND_NAME}
          className="h-[40px] w-auto max-w-[140px] object-contain"
          hoverScale
        />
      </Link>

      <nav className="flex flex-col items-center gap-2 flex-1">
        <SidebarBtn active={isActive(homeItem.to)} onClick={() => go(homeItem)} {...homeItem} />

        {/* Collapse toggle directly under Home */}
        <button
          data-testid="sidebar-collapse-btn"
          onClick={toggleSidebar}
          title="Minimize sidebar"
          className="h-8 w-8 rounded-xl flex items-center justify-center text-foreground/40 hover:text-primary hover:bg-secondary transition-colors"
        >
          <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>

        {NAV.slice(1).map((item) => (
          <SidebarBtn key={item.label} active={isActive(item.to)} onClick={() => go(item)} {...item} />
        ))}

        {user?.is_platform_owner && OWNER_NAV.map((item) => (
          <SidebarBtn key={item.label} active={isActive(item.to)} onClick={() => go(item)} {...item} />
        ))}

        <button
          onClick={() => navigate("/create")}
          data-testid="side-sell-tag-btn"
          title="Selling panel"
          className={`relative h-12 w-12 rounded-xl flex items-center justify-center transition-all group overflow-hidden ${
            isActive("/create") || isActive("/new-listing") ? "text-primary bg-primary/10 border border-primary/30" : "text-foreground/60 hover:text-foreground hover:bg-secondary"
          }`}
        >
          <Tag className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
          <span className="pointer-events-none absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/5 transition-colors" />
          <span className="hidden md:block absolute left-full ml-3 px-2 py-1 rounded-xl bg-card border border-border text-[10px] font-tech uppercase tracking-wider opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
            Sell
          </span>
        </button>


      {user && !user.is_pro && (
        <button
          onClick={() => navigate("/pro")}
          data-testid="side-pro-btn"
          title="Upgrade to Hyperspace"
          className="h-12 w-12 mb-2 rounded-xl flex items-center justify-center text-accent border border-accent/30 hover:bg-accent/10 transition-colors"
        >
          <Sparkles className="h-5 w-5" strokeWidth={1.5} />
        </button>
      )}

      <button
        onClick={() => navigate("/cart")}
        data-testid="side-cart-btn"
        title="Cart"
        className={`relative h-12 w-12 rounded-xl flex items-center justify-center transition-all group overflow-hidden ${
          isActive("/cart") ? "text-primary bg-primary/10 border border-primary/30" : "text-foreground/60 hover:text-foreground hover:bg-secondary"
        }`}
      >
        <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
        {/* Little shapes that "jump" out on hover */}
        <span className="pointer-events-none absolute -top-1 left-2 h-1.5 w-1.5 bg-primary rounded-xl opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 delay-0" />
        <span className="pointer-events-none absolute -top-1 right-2 h-1.5 w-1.5 bg-accent rounded-full opacity-0 group-hover:opacity-100 group-hover:-translate-y-3 transition-all duration-300 delay-75" />
        <span className="pointer-events-none absolute top-0 left-1/2 h-1.5 w-1.5 bg-primary/70 rotate-45 opacity-0 group-hover:opacity-100 group-hover:-translate-y-4 transition-all duration-300 delay-150" />
        {cartCount > 0 && (
          <span data-testid="cart-badge" className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-tech flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>
      </nav>
    </aside>
  );
}

function SidebarBtn({ active, onClick, icon: Icon, label, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      title={label}
      className={`relative h-12 w-12 rounded-xl flex items-center justify-center transition-all group overflow-hidden ${
        active ? "text-primary bg-primary/10 border border-primary/30" : "text-foreground/60 hover:text-foreground hover:bg-secondary"
      }`}
    >
      <Icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
      {/* Subtle ripple */}
      <span className="pointer-events-none absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/5 transition-colors" />
      <span className="hidden md:block absolute left-full ml-3 px-2 py-1 rounded-xl bg-card border border-border text-[10px] font-tech uppercase tracking-wider opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
        {label}
      </span>
    </button>
  );
}

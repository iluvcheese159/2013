import "@/App.css";
import "@/index.css";
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UIProvider, useUI } from "@/contexts/UIContext";
import { CartProvider } from "@/contexts/CartContext";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import AuthModal from "@/components/AuthModal";
import CosmosLoader from "@/components/CosmosLoader";
import Onboarding from "@/components/Onboarding";
import FeedbackPrompt from "@/components/FeedbackPrompt";
import BobSectionPopupProvider from "@/components/BobSectionPopupProvider";
import AuthCallback from "@/components/AuthCallback";
import Home from "@/pages/Home";
import Intro from "@/pages/Intro";
import Browse from "@/pages/Browse";
import ListingDetail from "@/pages/ListingDetail";
import Editor from "@/pages/Editor";
import DesignWorkshop from "@/pages/DesignWorkshop";
import Dashboard from "@/pages/Dashboard";
import SellerOrders from "@/pages/SellerOrders";
import SellerOrderDetail from "@/pages/SellerOrderDetail";
import Purchases from "@/pages/Purchases";
import CreateListing from "@/pages/CreateListing";
import NewListing from "@/pages/NewListing";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import Designs from "@/pages/Designs";
import Forums from "@/pages/Forums";
import OwnerControlHub from "@/pages/OwnerControlHub";
import MyDesigns from "@/pages/MyDesigns";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import Pro from "@/pages/Pro";
import Cart from "@/pages/Cart";
import Terms from "@/pages/Terms";
import SuspendedPage from "@/pages/SuspendedPage";
import Inspiration from "@/pages/Inspiration";
import Wishlists from "@/pages/Wishlists";
import Compare from "@/pages/Compare";
import Collections from "@/pages/Collections";
import CollectionDetail from "@/pages/CollectionDetail";
import Boards from "@/pages/Boards";
import PrintFailure from "@/pages/PrintFailure";
import FilamentCalculator from "@/pages/FilamentCalculator";
import Privacy from "@/pages/Privacy";
import PolicyEditor from "@/pages/PolicyEditor";

// Module-level flag: the intro plays immediately on every fresh page load,
// but only once per session — navigating around the app won't replay it.
// A new tab or full page refresh will show the intro again.
let introPlayedThisLoad = false;

function HomeOrIntro() {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (!introPlayedThisLoad) {
      introPlayedThisLoad = true;
      // Small delay so the intro page can mount before render
      requestAnimationFrame(() => setShowIntro(true));
    } else {
      // Always show the intro on first visit per session, then home on subsequent navigations
      setShowIntro(false);
    }
  }, []);

  if (showIntro) return <Navigate to="/intro" replace />;
  return <Home />;
}

function AppShell() {
  const location = useLocation();
  const { openAuth, suspended, loading } = useAuth();
  const { sidebarCollapsed } = useUI();
  const isIntro = location.pathname === "/intro";

  useEffect(() => {
    const h = (e) => openAuth(e.detail || "signin");
    window.addEventListener("auth:open", h);
    return () => window.removeEventListener("auth:open", h);
  }, [openAuth]);

  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50 overflow-hidden" data-testid="app-loading">
        {/* Animated ambient particles */}
        <div className="absolute inset-0" aria-hidden="true">
          {Array.from({ length: 40 }).map((_, i) => (
            <span
              key={i}
              className="floating-particle"
              style={{
                position: "absolute",
                left: `${(i * 23 + 7) % 100}%`,
                bottom: "-10px",
                width: 2 + (i % 5),
                height: 2 + (i % 5),
                backgroundColor: i % 4 === 0 ? "#00e5ff" : i % 4 === 1 ? "#ff5722" : i % 4 === 2 ? "#a78bfa" : "#ffffff",
                opacity: 0.15 + (i % 6) * 0.08,
                animationDuration: `${7 + (i % 12)}s`,
                animationDelay: `${(i * 1.3) % 10}s`,
                borderRadius: i % 3 === 0 ? "50%" : i % 3 === 1 ? "2px" : "0",
                transform: i % 5 === 0 ? "rotate(45deg)" : "none",
              }}
            />
          ))}
        </div>

        {/* Shooting stars */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`meteor-${i}`}
            className="ambient-meteor"
            style={{
              position: "absolute",
              left: `${10 + i * 30}%`,
              top: "-20px",
              width: 2,
              height: 2,
              backgroundColor: "#fff",
              borderRadius: "50%",
              animationDelay: `${2 + i * 4}s`,
              animationDuration: `${4 + i * 2}s`,
            }}
          >
            <div
              className="ambient-meteor-tail"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                height: 1,
                background: "linear-gradient(to left, rgba(255,255,255,0.6), transparent)",
                animationDelay: `${2 + i * 4}s`,
                animationDuration: `${4 + i * 2}s`,
              }}
            />
          </div>
        ))}

        <div className="relative flex flex-col items-center gap-6">
          {/* 3D Cosmos Loader with float animation */}
          <div className="animate-[float_3s_ease-in-out_infinite] drop-shadow-[0_0_30px_rgba(0,229,255,0.3)]">
            <CosmosLoader isActive={true} size={88} color="#00e5ff" />
          </div>

          {/* Animated text with typewriter effect */}
          <div className="flex items-center gap-3 font-tech text-sm">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground tracking-[0.3em] uppercase">
              <span>L</span><span className="animate-pulse" style={{ animationDelay: "0.1s" }}>O</span>
              <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>A</span>
              <span className="animate-pulse" style={{ animationDelay: "0.3s" }}>D</span>
              <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>I</span>
              <span className="animate-pulse" style={{ animationDelay: "0.5s" }}>N</span>
              <span className="animate-pulse" style={{ animationDelay: "0.6s" }}>G</span>
              <span className="ml-2 text-accent">◈</span>
            </span>
          </div>

          {/* Animated progress bar */}
          <div className="w-48 h-[2px] bg-border/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full"
              style={{
                animation: "shimmer-slide 2.2s ease-in-out infinite",
                width: "100%",
                backgroundSize: "200% 100%",
              }}
            />
          </div>

          {/* Subtle loading hints that cycle */}
          <div className="h-4">
            <span className="text-[9px] font-tech uppercase tracking-[0.25em] text-muted-foreground/50 animate-pulse">
              INITIALIZING COSMOS
            </span>
          </div>
        </div>

        {/* Corner decorative elements */}
        <div className="absolute top-6 left-6 w-8 h-8 border-l border-t border-primary/20 rounded-tl-lg" />
        <div className="absolute top-6 right-6 w-8 h-8 border-r border-t border-accent/20 rounded-tr-lg" />
        <div className="absolute bottom-6 left-6 w-8 h-8 border-l border-b border-primary/20 rounded-bl-lg" />
        <div className="absolute bottom-6 right-6 w-8 h-8 border-r border-b border-accent/20 rounded-br-lg" />
      </div>
    );
  }

  if (suspended) {
    return <SuspendedPage />;
  }

  if (isIntro) {
    return (
      <div className="min-h-screen">
        <Routes>
          <Route path="/intro" element={<Intro />} />
        </Routes>
        <AuthModal />
      </div>
    );
  }

  return (
       <div className="min-h-screen">
         <Sidebar />
         <TopBar />
         <div className={`transition-all ${sidebarCollapsed ? "pl-0" : "pl-16 md:pl-20"}`}>
           <Routes>
<Route path="/" element={<HomeOrIntro />} />
             <Route path="/intro" element={<Intro />} />
             <Route path="/browse" element={<Browse />} />
             <Route path="/listing/:id" element={<ListingDetail />} />
             <Route path="/designer" element={<DesignWorkshop />} />
             <Route path="/designer/new" element={<Editor />} />
             <Route path="/designer/:id" element={<Editor />} />
             <Route path="/designs" element={<Designs />} />
             <Route path="/forums" element={<Forums />} />
             <Route path="/owner/control" element={<OwnerControlHub />} />
             <Route path="/my-designs" element={<MyDesigns />} />
             <Route path="/messages" element={<Messages />} />
             <Route path="/messages/:otherId" element={<Messages />} />
             <Route path="/profile" element={<Profile />} />
             <Route path="/profile/:userId" element={<Profile />} />
             <Route path="/pro" element={<Pro />} />
             <Route path="/pro/success" element={<Pro />} />
             <Route path="/cart" element={<Cart />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/owner/policy/terms" element={<PolicyEditor policyType="terms" />} />
              <Route path="/owner/policy/privacy" element={<PolicyEditor policyType="privacy" />} />
             <Route path="/dashboard" element={<Dashboard />} />
             <Route path="/seller/orders" element={<SellerOrders />} />
             <Route path="/seller/orders/:transactionId" element={<SellerOrderDetail />} />
             <Route path="/purchases" element={<Purchases />} />
             <Route path="/create" element={<CreateListing />} />
             <Route path="/new-listing" element={<NewListing />} />
             <Route path="/checkout/success" element={<CheckoutSuccess />} />
             <Route path="/inspiration" element={<Inspiration />} />
             <Route path="/wishlists" element={<Wishlists />} />
             <Route path="/compare" element={<Compare />} />
             <Route path="/collections" element={<Collections />} />
             <Route path="/collections/:id" element={<CollectionDetail />} />
             <Route path="/boards" element={<Boards />} />
              <Route path="/print-failures" element={<PrintFailure />} />
              <Route path="/filament-calculator" element={<FilamentCalculator />} />
             <Route path="*" element={<HomeOrIntro />} />
           </Routes>
         </div>
         <Footer />
  <AuthModal />
         <Onboarding />
         <FeedbackPrompt />
         <BobSectionPopupProvider />
      </div>
    );
 }

function ThemeBoot() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
  return null;
}

function App() {
  return (
    <div className="App">
      <ThemeBoot />
      <BrowserRouter>
        <UIProvider>
          <AuthProvider>
            <CartProvider>
              <AppShell />
              <Toaster position="bottom-right" />
            </CartProvider>
          </AuthProvider>
        </UIProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;

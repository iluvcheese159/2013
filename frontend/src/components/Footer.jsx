import { NavLink } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-auto pt-12 pb-10 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-muted-foreground">
          <div>
            <h3 className="mb-3 font-medium text-foreground">Documentation</h3>
            <nav className="flex flex-col space-y-2">
              <NavLink to="/docs" end className="hover:text-foreground">Overview</NavLink>
              <NavLink to="/docs?section=forum" className="hover:text-foreground">Forums</NavLink>
              <NavLink to="/docs?section=listings" className="hover:text-foreground">Listings Guide</NavLink>
              <NavLink to="/docs?section=qna" className="hover:text-foreground">Q&A Guidelines</NavLink>
              <NavLink to="/docs?section=cleanup" className="hover:text-foreground">Maintenance</NavLink>
            </nav>
          </div>
          
          <div>
            <h3 className="mb-3 font-medium text-foreground">Platform</h3>
            <nav className="flex flex-col space-y-2">
              <NavLink to="/" end className="hover:text-foreground">Home</NavLink>
              <NavLink to="/browse" className="hover:text-foreground">Browse</NavLink>
              <NavLink to="/designer" className="hover:text-foreground">Designer</NavLink>
              <NavLink to="/designs" className="hover:text-foreground">Community Designs</NavLink>
            </nav>
          </div>
          
          <div>
            <h3 className="mb-3 font-medium text-foreground">Community</h3>
            <nav className="flex flex-col space-y-2">
              <NavLink to="/forums" className="hover:text-foreground">Forums</NavLink>
              <NavLink to="/messages" className="hover:text-foreground">Messages</NavLink>
              <NavLink to="/profile" className="hover:text-foreground">Profile</NavLink>
              <NavLink to="/wishlists" className="hover:text-foreground">Wishlists</NavLink>
            </nav>
          </div>
          
          <div>
            <h3 className="mb-3 font-medium text-foreground">Legal</h3>
            <nav className="flex flex-col space-y-2">
              <NavLink to="/terms" className="hover:text-foreground">Terms of Service</NavLink>
            </nav>
          </div>
        </div>
        
        <div className="mt-10 pt-8 border-t border-border text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Print Cosmos. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
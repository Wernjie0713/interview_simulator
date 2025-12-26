import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, Plus, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isDashboard = location.pathname === "/dashboard";

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <img src="/logo.png" alt="EQ-View Logo" className="h-9 w-9 object-contain drop-shadow-md" />
              </motion.div>
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                EQ-View
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              {user ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3"
                >
                  
                  <div className="h-8 w-[1px] bg-border/60 mx-1 hidden sm:block" />

                  <div className="flex items-center gap-3 pl-2 py-1 pr-1 rounded-full border border-border/40 bg-muted/30 backdrop-blur-sm">
                    <div className="flex flex-col items-end hidden md:flex">
                      <span className="text-xs font-semibold leading-none">{user.displayName || "User"}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{user.email}</span>
                    </div>
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="h-8 w-8 rounded-full border border-border/60 shadow-sm" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-border/60">
                        <UserIcon className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleLogout} 
                      className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Logout"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => navigate("/login")}
                    className="rounded-full px-6"
                  >
                    Login
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  LayoutDashboard, 
  Bot, 
  PhoneCall, 
  Hash, 
  BarChart3, 
  Settings, 
  Radio, 
  LogOut, 
  Menu, 
  X,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeCustomizer from '@/components/ThemeCustomizer';
import { removeApiKey, getMaskedApiKey } from '@/utils/apiKeyManager';
import CreateAssistantDialog from '@/components/CreateAssistantDialog';
import { toast } from 'sonner';

export default function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const assistants = useSelector((state) => state.assistants?.assistants || []);
  const location = useLocation();

  const handleLogout = () => {
    removeApiKey();
    toast.success('Logged out successfully', {
      description: 'Your API key has been removed from browser memory.',
    });
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, exact: true },
    { to: '/agents', label: 'Voice Agents', icon: Bot, badge: assistants.length },
    { to: '/calls', label: 'Call Activity', icon: PhoneCall },
    { to: '/phone-numbers', label: 'Phone Numbers', icon: Hash },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const maskedKey = getMaskedApiKey();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row antialiased select-none">
      {/* Desktop / Tablet Sidebar */}
      <aside 
        className="hidden md:flex md:w-64 lg:w-72 bg-card border-r border-border flex-col h-screen sticky top-0 shrink-0 z-30"
        aria-label="Sidebar Navigation"
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm shrink-0">
                <Radio className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-tight text-foreground text-base">VoxPilot</span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.2 bg-primary/10 text-primary rounded">Studio</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Voice Agent Workspace</p>
              </div>
            </NavLink>
          </div>

          <div className="mt-4">
            <Button 
              onClick={() => setIsCreateOpen(true)}
              className="w-full shadow-xs text-xs h-8.5 font-medium"
              size="sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Voice Agent
            </Button>
          </div>
        </div>

        {/* Primary Navigation List */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? location.pathname === item.to 
              : location.pathname.startsWith(item.to) && (item.to !== '/' || location.pathname === '/');
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Status & Utilities */}
        <div className="p-3 border-t border-border bg-card/50 space-y-2">
          {/* Engine Status */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-muted/40 border border-border text-[11px]">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="truncate">
                <span className="text-foreground font-medium">Engine Active</span>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{maskedKey || 'Connected'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <ThemeCustomizer />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Disconnect API Key & Logout"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Disconnect
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Top App Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-40">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-xs">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-foreground text-sm">VoxPilot</span>
            <span className="text-[9px] uppercase font-semibold text-primary ml-1.5 px-1 py-0.2 bg-primary/10 rounded">Studio</span>
          </div>
        </NavLink>

        <div className="flex items-center gap-1">
          <ThemeCustomizer />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-8 w-8 text-muted-foreground"
            aria-label="Toggle mobile navigation"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay Drawer */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 md:hidden flex justify-start backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="w-72 max-w-[80vw] h-full bg-card p-4 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                  <Radio className="h-4 w-4" />
                </div>
                <span className="font-bold text-foreground">VoxPilot</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsCreateOpen(true);
              }}
              className="w-full text-xs h-9 mb-3"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Voice Agent
            </Button>

            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact 
                  ? location.pathname === item.to 
                  : location.pathname.startsWith(item.to) && (item.to !== '/' || location.pathname === '/');

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive 
                        ? 'bg-primary text-primary-foreground font-semibold' 
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-border">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full text-xs text-destructive hover:bg-destructive/10 border-destructive/20"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Disconnect API Key
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Stage */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Outlet />
      </main>

      {/* Global Create Assistant Modal */}
      <CreateAssistantDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}

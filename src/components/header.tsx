import { User, Home, Package, MessageCircle, LogOut, LayoutDashboard, Target, HelpCircle } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useUser } from "@/context/user-context";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/design-system/components";

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useUser();
  const [location, navigate] = useLocation();

  const getNavClass = (path: string, currentLoc: string) => {
    const isActive = currentLoc === path || (path !== '/' && currentLoc.startsWith(path));
    if (isActive) {
      return "text-white bg-[var(--ds-cyan-dim)] border-b-[2px] border-[var(--ds-cyan)]";
    }
    return "text-blue-200 hover:text-white hover:bg-[var(--ds-bg-overlay)] border-b-[2px] border-transparent";
  };

  return (
    <header className="topbar bg-[rgba(2,8,16,0.95)] backdrop-blur-[16px] border-b border-[var(--ds-border-subtle)] flex items-center transition-colors">
      <div className="container mx-auto px-6 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex items-baseline">
              <h1 className="font-display font-[900] text-[20px] text-[var(--ds-text-primary)] tracking-tight leading-none">
                CHE.<span className="text-[var(--ds-cyan)]">COMEX</span>
              </h1>
              <span className="font-data text-[var(--ds-text-xs)] text-[var(--ds-text-muted)] ml-1 leading-none align-bottom">
                v2
              </span>
            </div>
          </div>

          {/* Navigation - Hidden on Auth Page */}
          {location !== '/auth' && (
            <nav className="hidden md:flex items-center h-full px-4">
              <div className="flex items-center h-full space-x-1 mr-6">
                <a 
                  onClick={() => navigate('/')}
                  className={`h-full flex items-center px-4 font-body text-[var(--ds-text-sm)] font-medium cursor-pointer transition-colors ${getNavClass('/', location)}`}
                >
                  {t('nav.home') || 'INICIO'}
                </a>
                <a 
                  onClick={() => navigate('/marketplace')}
                  className={`h-full flex items-center px-4 font-body text-[var(--ds-text-sm)] font-medium cursor-pointer transition-colors ${getNavClass('/marketplace', location)}`}
                >
                  {t('nav.marketplace') || 'MARKETPLACE'}
                </a>
                
                {user && (
                  <>
                    <a 
                      onClick={() => navigate('/chat')} 
                      className={`h-full flex items-center px-4 font-body text-[var(--ds-text-sm)] font-medium cursor-pointer transition-colors ${getNavClass('/chat', location)}`}
                    >
                      {t('nav.chats') || 'CHATS'}
                    </a>
                    <a 
                      onClick={() => navigate('/marketplace/dashboard')} 
                      className={`h-full flex items-center px-4 font-body text-[var(--ds-text-sm)] font-medium cursor-pointer transition-colors ${getNavClass('/marketplace/dashboard', location)}`}
                    >
                      {t('nav.dashboard') || 'DASHBOARD'}
                    </a>
                  </>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-4">
                
                {/* Score Pill Placeholder */}
                {user && (
                   <div className="flex items-center gap-2 bg-[var(--ds-bg-surface)] border border-[var(--ds-border-default)] rounded-[var(--ds-radius-full)] px-3 py-1 mr-2">
                     <Target className="w-3 h-3 text-[var(--ds-text-muted)]" />
                     <span className="font-data text-[var(--ds-text-xs)] text-[var(--ds-text-muted)] tracking-[var(--ds-tracking-data)] uppercase">SCORE</span>
                     <span className="font-data text-[var(--ds-text-sm)] font-medium text-[var(--ds-cyan)]">85</span>
                   </div>
                )}

                {user ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/control-panel')}
                      className="text-[var(--ds-text-muted)] hover:text-[var(--ds-cyan)] p-2 transition-colors relative"
                      title="Control de Calidad y Feedback"
                    >
                      <HelpCircle className="w-4 h-4" />
                      {/* Optional notification dot for needs_info could go here */}
                    </Button>
                     <div 
                      onClick={() => navigate('/profile')}
                      className="flex items-center gap-2 cursor-pointer hover:bg-[var(--ds-bg-overlay)] p-1 pr-3 rounded-[var(--ds-radius-full)] transition-colors border border-transparent hover:border-[var(--ds-border-default)]"
                    >
                       <Avatar className="w-6 h-6 border no-border">
                          <AvatarFallback className="bg-[var(--ds-cyan-dim)] text-[var(--ds-cyan)] font-data text-xs border border-[var(--ds-cyan)]">
                            {user.name?.substring(0,2)?.toUpperCase() || "U"}
                          </AvatarFallback>
                       </Avatar>
                       <span className="hidden lg:inline font-body text-[var(--ds-text-sm)] text-[var(--ds-text-primary)] max-w-[100px] truncate">{user.name || "Usuario"}</span>
                    </div>
                    <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => logout()}
                       className="text-[var(--ds-text-muted)] hover:text-[var(--ds-red)] p-2"
                     >
                       <LogOut className="w-4 h-4" />
                     </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 h-full">
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/auth')}
                      className="bg-transparent border border-[rgba(255,255,255,0.16)] text-[var(--ds-text-primary)] hover:bg-[var(--ds-bg-overlay)]"
                    >
                      {t('nav.login') || 'LOGIN'}
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => navigate('/auth?view=register')}
                      className="bg-gradient-to-br from-[var(--ds-cyan)] to-[var(--ds-blue)] text-[var(--ds-bg-void)] font-bold border-none"
                    >
                      {t('nav.register') || 'REGISTER'}
                    </Button>
                  </div>
                )}
                
                {/* Language Toggle */}
                <div className="flex items-center bg-[var(--ds-bg-overlay)] rounded-[var(--ds-radius-sm)] border border-[var(--ds-border-default)] p-0.5 ml-2">
                  {['es', 'en'].map(l => (
                    <button
                      key={l}
                      onClick={() => setLanguage(l as any)}
                      className={`font-data text-[10px] uppercase px-2 py-0.5 rounded-[var(--ds-radius-sm)] transition-colors ${
                        language === l ? 'bg-[var(--ds-cyan-dim)] text-[var(--ds-cyan)] font-bold' : 'text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)]'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}

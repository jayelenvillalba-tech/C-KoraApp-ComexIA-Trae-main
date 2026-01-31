import { User, Home, Package, MessageCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { useUser } from "@/context/user-context";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Header() {
  const { language, setLanguage } = useLanguage();
  const { user, logout } = useUser();
  const [, navigate] = useLocation();

  return (
    <header className="bg-[#0D2137] border-b border-cyan-900/30 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1 overflow-hidden shadow-lg border border-cyan-400/30 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => navigate('/')}
            >
              <img src="/logo.png" alt="Che.Comex Logo" className="w-full h-full object-contain" />
            </div>
            <div className="cursor-pointer" onClick={() => navigate('/')}>
              <h1 className="text-2xl font-black text-white tracking-tighter">
                CHE.<span className="text-cyan-400">COMEX</span>
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-cyan-500 font-bold opacity-80">
                {language === 'es' ? 'Inteligencia de Comercio Global' : 'Global Trade Intelligence'}
              </p>
            </div>
          </div>

          {/* Navigation - Hidden on Auth Page */}
          {location !== '/auth' && (
            <nav className="hidden md:flex items-center gap-6">
              <a 
                onClick={() => navigate('/')}
                className="text-gray-300 hover:text-cyan-400 transition-colors text-sm cursor-pointer flex items-center gap-1"
              >
                <Home className="w-4 h-4" />
                {language === 'es' ? 'INICIO' : 'HOME'}
              </a>
              <a href="/news" className="text-gray-300 hover:text-cyan-400 transition-colors text-sm">
                {language === 'es' ? 'NOTICIAS' : 'NEWS'}
              </a>
              <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors text-sm">
                HS CODE
              </a>
              <a 
                onClick={() => navigate('/marketplace')}
                className="text-gray-300 hover:text-cyan-400 transition-colors text-sm cursor-pointer flex items-center gap-1"
              >
                <Package className="w-4 h-4" />
                MARKETPLACE
              </a>
              
              {user && (
                <a href="/chat" className="text-gray-300 hover:text-cyan-400 transition-colors text-sm font-medium flex items-center gap-1">
                  <MessageCircle className="w-4 h-4 text-cyan-400" />
                  CHATS
                </a>
              )}

              {/* Language Toggle */}
              <div className="flex items-center gap-1 border border-cyan-900/30 rounded-md overflow-hidden bg-[#0A1929]">
                <button
                  onClick={() => setLanguage('es')}
                  className={`px-3 py-1 text-xs transition-colors ${
                    language === 'es' 
                      ? 'bg-cyan-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  ESP
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 text-xs transition-colors ${
                    language === 'en' 
                      ? 'bg-cyan-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  ENG
                </button>
              </div>

              {user ? (
                <div className="flex items-center gap-1">
                   <Button 
                    onClick={() => navigate('/profile')}
                    variant="ghost" 
                    className="flex items-center gap-2 hover:bg-slate-800 text-white px-2"
                  >
                     <Avatar className="w-8 h-8 border border-cyan-500/50">
                        <AvatarImage src={user.avatar || "/placeholder-user.jpg"} />
                        <AvatarFallback className="bg-cyan-900 text-cyan-200">{user.name?.substring(0,2)?.toUpperCase() || "U"}</AvatarFallback>
                     </Avatar>
                     <span className="hidden lg:inline text-sm max-w-[100px] truncate">{user.name || "Usuario"}</span>
                  </Button>
                  <Button
                     variant="ghost"
                     size="icon"
                     onClick={() => logout()}
                     className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                     title="Cerrar Sesión"
                   >
                     <LogOut className="w-5 h-5" />
                   </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost"
                    className="text-gray-300 hover:text-white"
                    onClick={() => navigate('/auth')}
                  >
                    {language === 'es' ? 'Ingresar' : 'Login'}
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 border-0"
                    onClick={() => navigate('/auth?view=register')}
                  >
                    {language === 'es' ? 'Crear Cuenta' : 'Register'}
                  </Button>
                </div>
              )}
            </nav>
          )}
        </div>

      </div>
    </header>
  );
}

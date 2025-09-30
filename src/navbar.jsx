import React, { useState } from 'react';
import { Home, LayoutDashboard, LogIn, UserPlus, LogOut, Menu, X, Train } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    setIsMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return null;
    return `/${user.role}`;
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      vendor: 'Vendor',
      depot: 'Depot Staff',
      installation: 'Installation Crew',
      inspector: 'Inspector'
    };
    return roleNames[role] || role;
  };

  return (
    <>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-800 to-orange-700 text-white text-xs py-1 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span>भारत सरकार | Government of India</span>
          <span>रेल मंत्रालय | Ministry of Railways</span>
        </div>
      </div>

      <hr class="border-t border-white w-full" />

      {/* Main Navbar */}
      <nav className="bg-gradient-to-r from-orange-700 via-orange-700 to-orange-800 shadow-lg sticky top-0 z-50 border-b-4 border-orange-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo/Brand */}
            <a 
              href="/" 
              className="flex items-center gap-3 text-white hover:opacity-90 transition-opacity group"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-all">
                <Train className="w-8 h-8" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight">QRail Track Management System</span>
                <span className="text-xs text-orange-100">Laser-based QR Code Marking for Track Fittings</span>
              </div>
            </a>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-2">
              <a 
                href="/" 
                className="flex items-center gap-2 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                Home
              </a>

              {user ? (
                <>
                  <a 
                    href={getDashboardLink()} 
                    className="flex items-center gap-2 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </a>

                  <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/20">
                    <div className="text-white text-sm">
                      <span className="text-orange-100">Welcome,</span>
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-xs text-orange-200">({getRoleDisplayName(user.role)})</div>
                    </div>
                    <button 
                      onClick={handleLogout} 
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all font-medium border border-white/30"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <a 
                    href="/login" 
                    className="flex items-center gap-2 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </a>
                  <a 
                    href="/register" 
                    className="flex items-center gap-2 bg-white text-orange-700 px-5 py-2 rounded-lg hover:bg-orange-50 transition-all font-semibold shadow-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserPlus className="w-4 h-4" />
                    Register
                  </a>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-all"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden pb-4 border-t border-white/20 mt-2">
              <div className="flex flex-col gap-2 pt-4">
                <a 
                  href="/" 
                  className="flex items-center gap-2 text-white px-4 py-3 rounded-lg hover:bg-white/10 transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home className="w-5 h-5" />
                  Home
                </a>

                {user ? (
                  <>
                    <a 
                      href={getDashboardLink()} 
                      className="flex items-center gap-2 text-white px-4 py-3 rounded-lg hover:bg-white/10 transition-all"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </a>

                    <div className="bg-white/10 rounded-lg p-4 mx-2 my-2">
                      <div className="text-white text-sm mb-3">
                        <span className="text-orange-100">Welcome,</span>
                        <div className="font-semibold text-lg">{user.name}</div>
                        <div className="text-xs text-orange-200">({getRoleDisplayName(user.role)})</div>
                      </div>
                      <button 
                        onClick={handleLogout} 
                        className="flex items-center justify-center gap-2 w-full bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all font-medium border border-white/30"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <a 
                      href="/login" 
                      className="flex items-center gap-2 text-white px-4 py-3 rounded-lg hover:bg-white/10 transition-all"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LogIn className="w-5 h-5" />
                      Login
                    </a>
                    <a 
                      href="/register" 
                      className="flex items-center gap-2 bg-white text-orange-700 px-4 py-3 rounded-lg hover:bg-orange-50 transition-all font-semibold mx-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <UserPlus className="w-5 h-5" />
                      Register
                    </a>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
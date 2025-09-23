// components/common/Navbar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getNavItems = () => {
    const baseItems = [
      { path: '/', label: 'Dashboard', roles: ['vendor', 'depot_staff', 'engineer', 'admin'] }
    ];

    if (user?.role === 'vendor' || user?.role === 'admin') {
      baseItems.push({ path: '/qr-management', label: 'QR Management', roles: ['vendor', 'admin'] });
    }

    if (user?.role === 'depot_staff' || user?.role === 'admin') {
      baseItems.push({ path: '/inventory', label: 'Inventory', roles: ['depot_staff', 'admin'] });
    }

    if (user?.role === 'engineer' || user?.role === 'admin') {
      baseItems.push({ path: '/installation', label: 'Installation', roles: ['engineer', 'admin'] });
      baseItems.push({ path: '/inspection', label: 'Inspection', roles: ['engineer', 'admin'] });
    }

    if (user?.role === 'admin') {
      baseItems.push({ path: '/analytics', label: 'Analytics', roles: ['admin'] });
    }

    return baseItems.filter(item => item.roles.includes(user?.role));
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold">
              QR Track System
            </Link>
            
            <div className="hidden md:flex space-x-4">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === item.path
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-500'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm">
              {user?.name} ({user?.role})
            </span>
            <button
              onClick={logout}
              className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
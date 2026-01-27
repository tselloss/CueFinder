import React, { useState } from 'react';
import { 
  Menu as MenuIcon, 
  X,
  MessageSquare,
  Home,
  Search as SearchIcon,
  User,
  LogOut,
  Settings
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const ForumNavigation = ({ 
  onNavigateTo, 
  currentPage,
  profileOpen,
  setProfileOpen 
}) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check if mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const navigationItems = [
    {
      label: 'Home',
      icon: Home,
      page: 'home',
      color: '#3b82f6'
    },
    {
      label: 'Search',
      icon: SearchIcon,
      page: 'search',
      color: '#666'
    },
    {
      label: 'Forum',
      icon: MessageSquare,
      page: 'forum',
      color: '#10b981',
      badge: 'New'
    },
    {
      label: 'Profile',
      icon: User,
      page: 'profile',
      color: '#666'
    }
  ];

  const handleNavClick = (page) => {
    onNavigateTo(page);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const renderDesktopNav = () => (
    <div
      className="flex items-center gap-4 px-4 bg-white rounded-lg border border-blue-200 shadow-sm"
      style={{
        borderColor: 'rgba(59, 130, 246, 0.2)'
      }}
    >
      {navigationItems.map(item => {
        const Icon = item.icon;
        const isActive = currentPage === item.page;
        
        return (
          <button
            key={item.page}
            onClick={() => handleNavClick(item.page)}
            className={`px-3 py-2 rounded-md transition-all flex items-center gap-2 ${
              isActive 
                ? 'bg-blue-100 border border-blue-400' 
                : 'hover:bg-blue-50'
            }`}
          >
            <Icon size={18} color={item.color} />
            <span 
              className={`text-sm ${
                isActive ? 'font-semibold text-blue-600' : 'font-medium text-gray-700'
              }`}
            >
              {item.label}
            </span>
            {item.badge && (
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const renderMobileNav = () => (
    <div>
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="p-2 hover:bg-gray-100 rounded-md"
      >
        <MenuIcon size={24} />
      </button>
      
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {mobileMenuOpen && (
        <div
          className="fixed left-0 top-0 h-screen w-60 bg-white z-50 overflow-y-auto shadow-xl"
          style={{
            borderRight: '1px solid rgba(59, 130, 246, 0.2)'
          }}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-lg">Menu</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-md"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-1 p-4">
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.page;
              
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className={`w-full px-3 py-3 rounded-md text-left transition-colors flex items-center gap-3 ${
                    isActive 
                      ? 'bg-blue-100' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} color={item.color} />
                  <span 
                    className={`text-sm ${
                      isActive ? 'font-semibold text-blue-600' : 'font-medium text-gray-700'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}

            <div className="border-t my-4" />

            {user ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-3 py-3 rounded-md text-left transition-colors flex items-center gap-3 text-red-600 hover:bg-red-50"
              >
                <LogOut size={20} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="flex items-center justify-between p-4 bg-white border-b"
      style={{
        borderBottomColor: 'rgba(59, 130, 246, 0.2)'
      }}
    >
      {/* Brand/Logo */}
      <div className="flex items-center gap-2">
        <h1 className="font-bold text-lg text-blue-600">CueFinder</h1>
      </div>

      {/* Navigation */}
      {isMobile ? renderMobileNav() : renderDesktopNav()}

      {/* Profile Section */}
      {user && !isMobile && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {user.username || user.email}
          </span>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className={`p-2 rounded-md transition-colors ${
              profileOpen ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
          >
            <Settings size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ForumNavigation;

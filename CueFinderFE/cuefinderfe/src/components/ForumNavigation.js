import React, { useState } from 'react';
import { Box, Button, Text, Layer, ResponsiveContext } from 'grommet';
import { 
  Menu as MenuIcon, 
  Close, 
  Chat,
  Home,
  Search as SearchIcon,
  User,
  LogOut,
  Settings
} from 'grommet-icons';
import { useAuth } from '../auth/AuthContext';

const ForumNavigation = ({ 
  onNavigateTo, 
  currentPage,
  profileOpen,
  setProfileOpen 
}) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const size = React.useContext(ResponsiveContext);
  const isMobile = size === 'small';

  const navigationItems = [
    {
      label: 'Home',
      icon: Home,
      page: 'home',
      color: 'brand'
    },
    {
      label: 'Search',
      icon: SearchIcon,
      page: 'search',
      color: 'text'
    },
    {
      label: 'Forum',
      icon: Chat,
      page: 'forum',
      color: 'status-ok',
      badge: 'New'
    },
    {
      label: 'Profile',
      icon: User,
      page: 'profile',
      color: 'text'
    }
  ];

  const handleNavClick = (page) => {
    onNavigateTo(page);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const renderDesktopNav = () => (
    <Box
      direction="row"
      align="center"
      gap="medium"
      pad={{ horizontal: 'medium' }}
      background="background-front"
      elevation="small"
      round="medium"
      style={{
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}
    >
      {navigationItems.map(item => {
        const Icon = item.icon;
        const isActive = currentPage === item.page;
        
        return (
          <Button
            key={item.page}
            onClick={() => handleNavClick(item.page)}
            plain
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: isActive 
                ? 'rgba(59, 130, 246, 0.2)' 
                : 'transparent',
              border: isActive 
                ? '1px solid rgba(59, 130, 246, 0.4)'
                : 'none',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <Box direction="row" align="center" gap="small">
              <Icon size="18px" color={item.color} />
              <Text 
                size="small" 
                weight={isActive ? '600' : '500'}
                color={isActive ? 'brand' : 'text'}
              >
                {item.label}
              </Text>
              {item.badge && (
                <Box
                  background="status-ok"
                  pad={{ horizontal: 'xsmall' }}
                  round="full"
                >
                  <Text size="xsmall" color="white" weight="bold">
                    {item.badge}
                  </Text>
                </Box>
              )}
            </Box>
          </Button>
        );
      })}
    </Box>
  );

  const renderMobileNav = () => (
    <Box>
      <Button
        icon={<MenuIcon size="24px" />}
        onClick={() => setMobileMenuOpen(true)}
        plain
      />
      
      {mobileMenuOpen && (
        <Layer
          onEsc={() => setMobileMenuOpen(false)}
          onClickOutside={() => setMobileMenuOpen(false)}
          position="left"
          full="vertical"
          style={{
            width: '240px'
          }}
        >
          <Box
            background="background-front"
            fill="vertical"
            pad="medium"
            gap="small"
            border={{ side: 'right', color: 'rgba(59, 130, 246, 0.2)' }}
          >
            <Box direction="row" justify="between" align="center" margin={{ bottom: 'medium' }}>
              <Text weight="600" size="large">Menu</Text>
              <Button
                icon={<Close size="20px" />}
                onClick={() => setMobileMenuOpen(false)}
                plain
              />
            </Box>

            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.page;
              
              return (
                <Button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  plain
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    background: isActive 
                      ? 'rgba(59, 130, 246, 0.2)' 
                      : 'transparent',
                    textAlign: 'left'
                  }}
                >
                  <Box direction="row" align="center" gap="small">
                    <Icon size="20px" color={item.color} />
                    <Text 
                      size="small" 
                      weight={isActive ? '600' : '500'}
                      color={isActive ? 'brand' : 'text'}
                    >
                      {item.label}
                    </Text>
                  </Box>
                </Button>
              );
            })}

            <Box border={{ side: 'top', color: 'rgba(59, 130, 246, 0.1)' }} 
                 margin={{ top: 'medium', bottom: 'medium' }} />

            {user ? (
              <Button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                plain
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  textAlign: 'left',
                  color: '#ef4444'
                }}
              >
                <Box direction="row" align="center" gap="small">
                  <LogOut size="20px" color="status-critical" />
                  <Text size="small" color="status-critical">
                    Logout
                  </Text>
                </Box>
              </Button>
            ) : null}
          </Box>
        </Layer>
      )}
    </Box>
  );

  return (
    <Box
      direction="row"
      justify="between"
      align="center"
      pad="medium"
      background="background"
      border={{ side: 'bottom', color: 'rgba(59, 130, 246, 0.2)' }}
    >
      {/* Brand/Logo */}
      <Box direction="row" align="center" gap="small">
        <Text weight="700" size="large" color="brand">
          CueFinder
        </Text>
      </Box>

      {/* Navigation */}
      {isMobile ? renderMobileNav() : renderDesktopNav()}

      {/* Profile Section */}
      {user && !isMobile && (
        <Box direction="row" align="center" gap="small">
          <Text size="small" color="text-weak">
            {user.username || user.email}
          </Text>
          <Button
            icon={<Settings size="18px" />}
            onClick={() => setProfileOpen(!profileOpen)}
            plain
            style={{
              padding: '8px',
              borderRadius: '6px',
              background: profileOpen ? 'rgba(59, 130, 246, 0.2)' : 'transparent'
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ForumNavigation;

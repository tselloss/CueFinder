import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Box, Button, Header, Heading, Text, Footer, Menu } from 'grommet';
import { User, Logout, UserAdmin, MailOption, Menu as MenuIcon } from 'grommet-icons';
import CueList from './components/CueList';
import CueDetail from './components/CueDetail';
import CueFormModal from './components/CueFormModal';
import CueCaseDetail from './components/CueCaseDetail';
import AdminPage from './components/AdminPage';
import LoginPage from './components/LoginPage';
import UserProfile from './components/UserProfile';
import OAuthCallback from './components/OAuthCallback';
import Inbox from './components/Inbox';
import ComingSoon from './components/ComingSoon';
import Forum from './components/Forum';
import DesktopSidebar from './components/DesktopSidebar';
import { HeroSearch } from './components/HeroSearch';
import { AuthProvider, useAuth } from './auth/AuthContext';
import * as cueService from './api/cueService';
import * as cueCaseService from './api/cueCaseService';
import * as messageService from './api/messageService';
import * as forumService from './api/forumService';

import './form-icons.css';
import './mobile-responsive.css';
import { useTranslation } from 'react-i18next';

function AppInner() {
  const { t, i18n } = useTranslation();
  // Load saved language from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  }, [i18n]);
  const [cues, setCues] = useState([]);
  const [search, setSearch] = useState('');
  // Set default view mode based on screen size
  const [viewMode, setViewMode] = useState(
    window.innerWidth <= 768 ? 'list' : 'grid'
  ); // 'grid' or 'list'
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCue, setEditingCue] = useState(null);
  const [category, setCategory] = useState('all'); // 'all', 'cues', 'cases'
  const [condition, setCondition] = useState('all');
  const [cueType, setCueType] = useState('all'); // 'all', 'playing', 'break', 'jump'
  const [sortBy, setSortBy] = useState('newest');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile sidebar toggle
  const sidebarOpen = true; // Always open on home page
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [forumCategories, setForumCategories] = useState([]);
  const [showForumCategories, setShowForumCategories] = useState(false);
  // Price range slider [min,max] in USD
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const PRICE_MIN_LIMIT = 0;
  const PRICE_MAX_LIMIT = 10000;
  const PRICE_STEP = 1;
  const presetRanges = [
    { label: '< $200', value: [0, 200] },
    { label: '$200–$500', value: [200, 500] },
    { label: '$500–$1000', value: [500, 1000] },
    { label: '> $1000', value: [1000, PRICE_MAX_LIMIT] },
  ];
  // Prices are in EUR; use € labels
  const currencySymbol = '€';
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on the home page (listings page)
  const isHomePage = location.pathname === '/';
  
  // Handle view mode based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setViewMode('list'); // Mobile: always list view
      }
      // Don't auto-change on desktop - let user choose
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('Current path:', location.pathname);
    console.log('Is home page:', isHomePage);
  }, [location.pathname, isHomePage]);

  // Reset cueType filter when switching away from cues category
  useEffect(() => {
    if (category !== 'cues' && category !== 'all') {
      setCueType('all');
    }
  }, [category]);

  const refreshListings = useCallback(async () => {
    // Fetch both cues and cases
    const [cuesData, casesData] = await Promise.all([
      cueService.getCues(),
      cueCaseService.getCueCases()
    ]);

    // Add itemType field to each item and combine (avoid colliding with backend 'category')
    const cuesWithCategory = cuesData.map(cue => ({ ...cue, itemType: 'cue' }));
    const casesWithCategory = casesData.map(cueCase => ({ ...cueCase, itemType: 'case' }));

    // Combine both arrays
    const allListings = [...cuesWithCategory, ...casesWithCategory];

    console.log('Loaded listings:', {
      cues: cuesWithCategory.length,
      cases: casesWithCategory.length,
      total: allListings.length
    });
    
    // Log first cue for debugging
    if (cuesWithCategory.length > 0) {
      console.log('Sample cue data:', {
        title: cuesWithCategory[0].title,
        cueType: cuesWithCategory[0].cueType,
        cue_type: cuesWithCategory[0].cue_type,
        itemType: cuesWithCategory[0].itemType,
        keys: Object.keys(cuesWithCategory[0])
      });
    }

    setCues(allListings);
    
    // Expose for debugging in E2E tests
    if (typeof window !== 'undefined') {
      window.__cuesData = allListings;
    }
  }, []);

  // Keep listings fresh on the home page when navigating back or switching categories
  useEffect(() => {
    if (!isHomePage) return;
    
    // Navigate to coming soon page for tables and accessories
    if (category === 'tables' || category === 'accessories') {
      navigate('/coming-soon');
      return;
    }
    
    refreshListings();
  }, [isHomePage, category, refreshListings, navigate]);

  const handleSelect = (item) => {
  if (item.itemType === 'case') {
      navigate(`/case/${item.id}`);
    } else {
      navigate(`/cue/${item.id}`);
    }
  };
  
  const handleBack = () => {
    setCategory('all');
    navigate('/');
  };
  
  const handleAdd = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setEditingCue(null); // Ensure we're creating a new listing, not editing
    setShowAddModal(true);
  };

  // Called when CueFormModal successfully saves a cue
  // The modal handles the API call internally, we just need to close it and refresh
  const handleModalSave = async () => {
    setShowAddModal(false);
    setEditingCue(null); // Clear the editing state
    // Refresh the cues list
    try {
      await refreshListings();
    } catch (err) {
      console.error('Error refreshing listings:', err);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingCue(null); // Clear the editing state when closing
  };

  const handleLogout = async () => {
    await logout();
    navigate('/'); // Ensure we navigate to home page after logout
  };

  useEffect(() => {
    if (!user) return;
    
    const loadUnreadCount = async () => {
      try {
        const messages = await messageService.getInbox(true);
        setUnreadMessageCount((messages || []).length);
      } catch (err) {
        console.error('Error loading unread count:', err);
      }
    };

    loadUnreadCount();
    
    // Refresh unread count every 30 seconds when user is logged in
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Load forum categories on mount
  useEffect(() => {
    const loadForumCategories = async () => {
      try {
        const categories = await forumService.getCategories();
        setForumCategories(categories);
      } catch (error) {
        console.error('Failed to load forum categories:', error);
      }
    };
    
    loadForumCategories();
  }, []);

  const userMenuItems = user
    ? [
        {
          label: (
            <Box 
              direction="row" 
              align="center" 
              gap="medium" 
              pad={{ horizontal: 'small', vertical: 'small' }}
              style={{ transition: 'all 0.2s ease' }}
            >
              <Box direction="row" align="center" gap="small" fill="horizontal">
                <MailOption color="#3b82f6" size="20px" />
                <Text size="medium" weight={600} color="text-strong">Inbox</Text>
                {unreadMessageCount > 0 && (
                  <Box
                    background="#ef4444"
                    round="full"
                    pad={{ horizontal: '8px', vertical: '2px' }}
                    style={{ minWidth: '24px', textAlign: 'center', marginLeft: 'auto' }}
                  >
                    <Text size="xsmall" weight={700} color="white">
                      {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                    </Text>
                  </Box>
                )}
              </Box>
            </Box>
          ),
          onClick: () => navigate('/inbox')
        },
        {
          label: (
            <Box 
              direction="row" 
              align="center" 
              gap="medium" 
              pad={{ horizontal: 'small', vertical: 'small' }}
              style={{ transition: 'all 0.2s ease' }}
            >
              <User color="#3b82f6" size="20px" />
              <Text size="medium" weight={600} color="text-strong">{t('actions.profile')}</Text>
            </Box>
          ),
          onClick: () => navigate('/profile')
        },
        ...(user.role === 'admin'
          ? [
              {
                label: (
                  <Box 
                    direction="row" 
                    align="center" 
                    gap="medium" 
                    pad={{ horizontal: 'small', vertical: 'small' }}
                    style={{ transition: 'all 0.2s ease' }}
                  >
                    <UserAdmin color="#f59e0b" size="20px" />
                    <Text size="medium" weight={600} color="text-strong">{t('actions.admin')}</Text>
                  </Box>
                ),
                onClick: () => navigate('/admin')
              }
            ]
          : []),
        {
          label: (
            <Box 
              direction="row" 
              align="center" 
              gap="medium" 
              pad={{ horizontal: 'small', vertical: 'small' }}
              style={{ 
                borderTop: '2px solid rgba(59, 130, 246, 0.2)',
                marginTop: '4px',
                paddingTop: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              <Logout color="#ef4444" size="20px" />
              <Text size="medium" weight={700} color="#ef4444">{t('actions.logout')}</Text>
            </Box>
          ),
          onClick: handleLogout
        }
      ]
    : [];


  return (
    <Box fill background="background" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .unread-badge {
          animation: pulse 2s infinite;
        }
      `}</style>
      <Header 
        background="background-front" 
        pad={{ horizontal: "medium", vertical: "small" }}
        elevation="medium"
        style={{
          zIndex: 1000,
          position: 'relative',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box direction="row" align="center" gap="small" style={{ minWidth: 0 }}>
          {/* Sidebar is always open on the home page; toggle removed */}
          
          <Heading level="2" margin="none" color="text-strong" style={{ fontWeight: 700, letterSpacing: '-0.5px', fontSize: 'clamp(16px, 3.5vw, 24px)', whiteSpace: 'nowrap' }}>
            🎱 {t('app.title')}
          </Heading>
        </Box>
        <Box direction="row" align="center" gap="xsmall" wrap style={{ flexShrink: 0, justifyContent: 'flex-end' }}>
          {/* Language Switcher hidden */}
          {user ? (
            <>
              {/* User Info Display */}
              <Box 
                direction="row"
                align="center"
                gap="xsmall"
                background="background-back"
                pad={{ horizontal: 'small', vertical: 'xsmall' }}
                round="8px"
                style={{
                  border: '2px solid rgba(59, 130, 246, 0.5)',
                  backdropFilter: 'blur(10px)',
                  minWidth: 0,
                  maxWidth: '100%'
                }}
              >
                <Text size="medium" style={{ fontSize: '18px', flexShrink: 0 }}>
                  {user.avatar || '👤'}
                </Text>
                <Box style={{ minWidth: 0 }}>
                  <Text size="small" color="text-strong" weight={700} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name}
                  </Text>
                  {user.role === 'admin' && (
                    <Text size="xsmall" color="brand" weight={600} style={{ lineHeight: '1' }}>
                      Admin
                    </Text>
                  )}
                </Box>
              </Box>

              {/* User Actions Menu */}
              <Box style={{ position: 'relative', flexShrink: 0 }}>
                <Menu
                  a11yTitle="User menu"
                  icon={<MenuIcon color="white" size="20px" />}
                  label={<Text size="small" weight={700} color="white" style={{ display: 'none' }}>Menu</Text>}
                  items={userMenuItems}
                  dropAlign={{ top: 'bottom', right: 'right' }}
                  dropProps={{ 
                    background: 'background-front', 
                    elevation: 'xlarge', 
                    round: 'medium',
                    style: {
                      border: '2px solid rgba(59, 130, 246, 0.3)',
                      boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.2)',
                      marginTop: '8px',
                      minWidth: '220px',
                      backdropFilter: 'blur(10px)'
                    }
                  }}
                  buttonProps={{
                    plain: false,
                    style: {
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                      minWidth: '48px',
                      transition: 'all 0.2s ease'
                    },
                    onMouseEnter: (e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.5)';
                    },
                    onMouseLeave: (e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
                    }
                  }}
                />
                {unreadMessageCount > 0 && (
                  <Box
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#ef4444',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      border: '2px solid white',
                      animation: 'pulse 2s infinite',
                      boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)'
                    }}
                  >
                    {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                  </Box>
                )}
              </Box>
            </>
          ) : (
            <>
              <Button 
                primary 
                label={<Text size="xsmall" weight={700} color="white">{t('actions.signIn')}</Text>}
                onClick={() => navigate('/login')} 
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                  border: 'none',
                  transition: 'all 0.3s ease'
                }}
              />
              <Button 
                label={<Text size="xsmall" color="text-strong" weight={600}>{t('actions.register')}</Text>}
                onClick={() => navigate('/register')} 
                style={{ 
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '2px solid rgba(59, 130, 246, 0.5)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
              />
            </>
          )}
        </Box>
      </Header>

      {/* Hero Section - New Shadcn UI Design - Only show on home page */}
      {isHomePage && (
        <div className="bg-gradient-to-b from-background via-background to-secondary/20">
          <HeroSearch
            search={search}
            setSearch={setSearch}
            condition={condition}
            setCondition={setCondition}
            sortBy={sortBy}
            setSortBy={setSortBy}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            PRICE_MIN_LIMIT={PRICE_MIN_LIMIT}
            PRICE_MAX_LIMIT={PRICE_MAX_LIMIT}
            currencySymbol={currencySymbol}
          />
        </div>
      )}

      {/* Main Content Area with Sidebar */}
      <Box 
        flex="grow" 
        background="background" 
        style={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          minHeight: 0
        }}
      >
        <Box 
          direction="row" 
          fill="horizontal"
          style={{
            flex: 1,
            minHeight: 0,
            position: 'relative'
          }}
        >
          {/* Mobile Sidebar Overlay */}
          {isHomePage && mobileMenuOpen && (
            <Box 
              className="sidebar-overlay"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Desktop Sidebar - Only on home page */}
          {isHomePage && (
            <DesktopSidebar
              category={category}
              setCategory={setCategory}
              cueType={cueType}
              setCueType={setCueType}
              condition={condition}
              setCondition={setCondition}
              sortBy={sortBy}
              setSortBy={setSortBy}
              search={search}
              setSearch={setSearch}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              forumCategories={forumCategories}
              showForumCategories={showForumCategories}
              setShowForumCategories={setShowForumCategories}
              PRICE_MIN_LIMIT={PRICE_MIN_LIMIT}
              PRICE_MAX_LIMIT={PRICE_MAX_LIMIT}
              PRICE_STEP={PRICE_STEP}
              currencySymbol={currencySymbol}
              presetRanges={presetRanges}
            />
          )}

          {/* Main Content */}
          <Box 
            flex 
            className="main-content-wrapper"
            pad={{ horizontal: 'medium', vertical: 'none' }} 
            style={{ 
              flex: 1,
              maxWidth: isHomePage && sidebarOpen ? 'none' : '1400px', 
              width: '100%',
              margin: isHomePage && sidebarOpen ? '0' : '0 auto',
              position: 'relative',
              minHeight: 0,
              overflowX: 'hidden',
              overflowY: 'auto'
            }}
          >
            <Routes>
              <Route path="/" element={
                <CueList 
                  cues={cues} 
                  onSelect={handleSelect} 
                  onAdd={handleAdd} 
                  query={search} 
                  viewMode={viewMode} 
                  setViewMode={setViewMode}
                  category={category}
                  condition={condition}
                  cueType={cueType}
                  sortBy={sortBy}
                  priceRange={priceRange}
                />
              } />
              
              <Route path="/login" element={
                user ? <Navigate to="/" /> : <LoginPage />
              } />
              
              <Route path="/register" element={
                user ? <Navigate to="/" /> : <LoginPage />
              } />
              
              <Route path="/oauth-callback" element={<OAuthCallback />} />
              
              <Route path="/cue/:id" element={
                user ? <CueDetail onBack={handleBack} /> : <Navigate to="/login" />
              } />
              <Route path="/case/:id" element={
                user ? <CueCaseDetail onBack={handleBack} /> : <Navigate to="/login" />
              } />
              
              <Route path="/profile" element={
                user ? <UserProfile onBack={handleBack} /> : <Navigate to="/login" />
              } />
              
              <Route path="/inbox" element={
                user ? <Inbox onBack={handleBack} /> : <Navigate to="/login" />
              } />
              
              <Route path="/admin" element={
                user && user.role === 'admin' ? <AdminPage onBack={handleBack} /> : <Navigate to="/" />
              } />
              
              <Route path="/coming-soon" element={
                <ComingSoon category={category} onBack={handleBack} />
              } />
              
              <Route path="/forum" element={
                <Forum onBack={handleBack} />
              } />
            </Routes>
          </Box>
        </Box>
      </Box>

      {/* Mobile Menu Button - Only on home page */}
      {isHomePage && (
        <Button
          className="mobile-menu-button"
          data-testid="mobile-menu-toggle"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          }
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          plain
        />
      )}

      <Footer 
        background="background-front" 
        pad="large" 
        justify="center" 
        border={{ side: 'top', color: 'border', size: 'small' }}
        style={{
          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        <Box align="center" gap="small">
          <Text size="medium" weight={600} color="text">
            🎱 CueFinder
          </Text>
          <Text size="small" color="text-weak" textAlign="center">
            Your Premium Billiard Cue Marketplace
          </Text>
          <Box direction="row" gap="medium" margin={{ top: 'small' }}>
            <Text size="small" color="text-weak">© 2026 CueFinder</Text>
            <Text size="small" color="text-weak">•</Text>
            <Text size="small" color="brand" weight={500} style={{ cursor: 'pointer' }}>
              Privacy Policy
            </Text>
            <Text size="small" color="text-weak">•</Text>
            <Text size="small" color="brand" weight={500} style={{ cursor: 'pointer' }}>
              Terms of Service
            </Text>
          </Box>
        </Box>
      </Footer>

      {/* Add Cue Modal */}
      {showAddModal && (
        <CueFormModal
          cue={editingCue}
          onClose={handleCloseModal}
          onSave={handleModalSave}
        />
      )}
    </Box>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

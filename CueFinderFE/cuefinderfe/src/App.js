import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import CueList from './components/CueList';
import CueDetail from './components/CueDetail';
import CueFormModal from './components/CueFormModal';
import CueCaseDetail from './components/CueCaseDetail';
import BilliardTableDetail from './components/BilliardTableDetail';
import AdminPage from './components/AdminPage';
import LoginPage from './components/LoginPage';
import UserProfile from './components/UserProfile';
import OAuthCallback from './components/OAuthCallback';
import Inbox from './components/Inbox';
import ComingSoon from './components/ComingSoon';
import Forum from './components/Forum';
import DesktopSidebar from './components/DesktopSidebar';
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import { AuthProvider, useAuth } from './auth/AuthContext';
import * as cueService from './api/cueService';
import * as cueCaseService from './api/cueCaseService';
import * as billiardTableService from './api/billiardTableService';
import * as messageService from './api/messageService';
import * as forumService from './api/forumService';

// import './form-icons.css';
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

  // Disable body scroll when modal is open
  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddModal]);

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
    // Fetch cues, cases, and tables
    const [cuesData, casesData, tablesData] = await Promise.all([
      cueService.getCues(),
      cueCaseService.getCueCases(),
      billiardTableService.getTables()
    ]);

    // Add itemType field to each item and combine (avoid colliding with backend 'category')
    const cuesWithCategory = cuesData.map(cue => ({ ...cue, itemType: 'cue' }));
    const casesWithCategory = casesData.map(cueCase => ({ ...cueCase, itemType: 'case' }));
    const tablesWithCategory = tablesData.map(table => ({ ...table, itemType: 'table' }));

    // Combine all arrays
    const allListings = [...cuesWithCategory, ...casesWithCategory, ...tablesWithCategory];

    console.log('Loaded listings:', {
      cues: cuesWithCategory.length,
      cases: casesWithCategory.length,
      tables: tablesWithCategory.length,
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
    
    // Navigate to coming soon page for accessories only (tables now have listings)
    if (category === 'accessories') {
      navigate('/coming-soon');
      return;
    }
    
    refreshListings();
  }, [isHomePage, category, refreshListings, navigate]);

  const handleSelect = (item) => {
  if (item.itemType === 'case') {
      navigate(`/case/${item.id}`);
    } else if (item.itemType === 'table') {
      navigate(`/table/${item.id}`);
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

    // Load immediately when user changes
    loadUnreadCount();
    
    // Also refresh when user navigates back to home or other pages
    const handleFocus = () => {
      loadUnreadCount();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Refresh unread count every 10 seconds when user is logged in (faster polling)
    const interval = setInterval(loadUnreadCount, 10000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
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

  // User menu replaced by Shadcn-styled header actions


  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .unread-badge {
          animation: pulse 2s infinite;
        }
      `}</style>
      <AppHeader
        title={t('app.title')}
        user={user}
        unreadCount={unreadMessageCount}
        onNavigate={(path) => navigate(path)}
        onLogout={handleLogout}
        currentPath={location.pathname}
      />

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 bg-background flex flex-col relative pt-[60px]">
        <div className="flex flex-row flex-1 relative">
          {/* Mobile Sidebar Overlay */}
          {isHomePage && mobileMenuOpen && (
            <div 
              className="sidebar-overlay absolute inset-0 bg-black/50 z-40"
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
          <div 
            className="flex-1 main-content-wrapper overflow-x-hidden relative"
            style={{ 
              maxWidth: isHomePage && sidebarOpen ? 'none' : '1400px',
              margin: isHomePage && sidebarOpen ? '0' : '0 auto'
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
                  search={search}
                  setSearch={setSearch}
                  setCondition={setCondition}
                  setSortBy={setSortBy}
                  setPriceRange={setPriceRange}
                  PRICE_MIN_LIMIT={PRICE_MIN_LIMIT}
                  PRICE_MAX_LIMIT={PRICE_MAX_LIMIT}
                  user={user}
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
              <Route path="/table/:id" element={
                user ? <BilliardTableDetail onBack={handleBack} /> : <Navigate to="/login" />
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
                user ? <Forum onBack={handleBack} /> : <Navigate to="/login" />
              } />
            </Routes>
          </div>
        </div>
      </div>

      {/* Mobile Menu Button - Only on home page */}
      {isHomePage && (
        <button
          className="mobile-menu-button fixed bottom-20 right-4 md:hidden p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg"
          data-testid="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      )}

      {/* App Footer - shown on all pages */}
      <AppFooter />

      {/* Add Cue Modal */}
      {showAddModal && (
        <CueFormModal
          cue={editingCue}
          onClose={handleCloseModal}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

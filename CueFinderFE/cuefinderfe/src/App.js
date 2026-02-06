import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import CueList from './components/CueList';
import CueDetail from './components/CueDetail';
import CueFormModal from './components/CueFormModal';
import CueCaseDetail from './components/CueCaseDetail';
import BilliardTableDetail from './components/BilliardTableDetail';
import AccessoryDetail from './components/AccessoryDetail';
import AdminPage from './components/AdminPage';
import LoginPage from './components/LoginPage';
import UserProfile from './components/UserProfile';
import OAuthCallback from './components/OAuthCallback';
import Inbox from './components/Inbox';
import ComingSoon from './components/ComingSoon';
import Forum from './components/Forum';
import BilliardClubsPage from './features/forum/components/BilliardClubsPage';
import ForgotPassword from './features/auth/components/ForgotPassword';
import ResetPassword from './features/auth/components/ResetPassword';
import DesktopSidebar from './components/DesktopSidebar';
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import OldListingsModal from './components/OldListingsModal';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { initializeAxiosInterceptor } from './utils/axiosInterceptor';
import * as cueService from './api/cueService';
import * as cueCaseService from './api/cueCaseService';
import * as billiardTableService from './api/billiardTableService';
import * as accessoryService from './api/accessoryService';
import * as messageService from './api/messageService';
import * as forumService from './api/forumService';

// import './form-icons.css';
import './mobile-responsive.css';
import { useTranslation } from 'react-i18next';

function AppInner() {
  const { t, i18n } = useTranslation();
  const { showError } = useToast();
  
  // Initialize axios interceptor for global error handling
  useEffect(() => {
    initializeAxiosInterceptor(showError);
  }, [showError]);
  
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
  const [oldListings, setOldListings] = useState([]);
  const [showOldListingsModal, setShowOldListingsModal] = useState(false);
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

  // Ensure mobile starts at top on route change
  useEffect(() => {
    if (window.innerWidth <= 768) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [location.pathname]);

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
    try {
      // Fetch cues, cases, tables, and accessories with individual error handling
      const [cuesData, casesData, tablesData, accessoriesData] = await Promise.all([
        cueService.getCues().catch(err => { 
          console.error('Error fetching cues:', err); 
          return []; 
        }),
        cueCaseService.getCueCases().catch(err => { 
          console.error('Error fetching cue cases:', err); 
          return []; 
        }),
        billiardTableService.getTables().catch(err => { 
          console.error('Error fetching tables:', err); 
          return []; 
        }),
        accessoryService.getAccessories().catch(err => { 
          console.error('Error fetching accessories:', err); 
          return []; 
        })
      ]);

      // Add itemType field to each item and combine (avoid colliding with backend 'category')
      const cuesWithCategory = cuesData.map(cue => ({ ...cue, itemType: 'cue' }));
      const casesWithCategory = casesData.map(cueCase => ({ ...cueCase, itemType: 'case' }));
      const tablesWithCategory = tablesData.map(table => ({ ...table, itemType: 'table' }));
      const accessoriesWithCategory = accessoriesData.map(accessory => ({ ...accessory, itemType: 'accessory' }));

      // Combine all arrays
      const allListings = [...cuesWithCategory, ...casesWithCategory, ...tablesWithCategory, ...accessoriesWithCategory];

      console.log('Loaded listings:', {
        cues: cuesWithCategory.length,
        cases: casesWithCategory.length,
        tables: tablesWithCategory.length,
        accessories: accessoriesWithCategory.length,
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
    } catch (error) {
      console.error('Error refreshing listings:', error);
      setCues([]);
    }
  }, []);

  // Keep listings fresh on the home page when navigating back or switching categories
  useEffect(() => {
    if (!isHomePage) return;
    
    // All categories now have listings, so no need to redirect to coming-soon
    refreshListings();
  }, [isHomePage, refreshListings]);

  const handleSelect = (item) => {
  if (item.itemType === 'case') {
      navigate(`/case/${item.id}`);
    } else if (item.itemType === 'table') {
      navigate(`/table/${item.id}`);
    } else if (item.itemType === 'accessory') {
      navigate(`/accessory/${item.id}`);
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

  // Check for old listings (30+ days) when user logs in
  const checkOldListings = useCallback(async () => {
    if (!user) return;
    
    try {
      // Check if we've already shown the modal in this session
      const lastCheck = sessionStorage.getItem('oldListingsChecked');
      if (lastCheck) return; // Already checked this session
      const [userCues, userCases, userTables, userAccessories] = await Promise.all([
        cueService.getCues().catch(err => { console.error('Error fetching cues:', err); return []; }),
        cueCaseService.getCueCases().catch(err => { console.error('Error fetching cases:', err); return []; }),
        billiardTableService.getTables().catch(err => { console.error('Error fetching tables:', err); return []; }),
        accessoryService.getAccessories().catch(err => { console.error('Error fetching accessories:', err); return []; })
      ]);

      // Combine and filter for user's listings that are old and not sold
      const allUserListings = [
        ...userCues.map(c => ({ ...c, itemType: 'cue' })),
        ...userCases.map(c => ({ ...c, itemType: 'case' })),
        ...userTables.map(t => ({ ...t, itemType: 'table' })),
        ...userAccessories.map(a => ({ ...a, itemType: 'accessory' }))
      ];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldUserListings = allUserListings.filter(listing => {
        // Check all possible user ID field names (different APIs return different field names)
        // Note: JSON serialization converts C# PascalCase to camelCase, so SellerId becomes sellerId
        const isOwner = listing.userId === user.id || listing.user_id === user.id || listing.owner_id === user.id || 
                        listing.sellerId === user.id ||
                        String(listing.userId) === String(user.id) || String(listing.user_id) === String(user.id) || String(listing.owner_id) === String(user.id) ||
                        String(listing.sellerId) === String(user.id);
        const createdDate = new Date(listing.createdAt || listing.created_at);
        const isOld = createdDate < thirtyDaysAgo;
        const notSold = !listing.sold && !listing.isSold && listing.status !== 'sold';

        return isOwner && isOld && notSold;
      });

      if (oldUserListings.length > 0) {
        setOldListings(oldUserListings);
        setShowOldListingsModal(true);
        sessionStorage.setItem('oldListingsChecked', 'true');
      } else {
        sessionStorage.setItem('oldListingsChecked', 'true');
      }
    } catch (error) {
      console.error('Error checking old listings:', error);
    }
  }, [user]);

  // Check for old listings when user logs in
  useEffect(() => {
    if (user) {
      // Delay check slightly to let the app load
      const timer = setTimeout(() => {
        checkOldListings();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, checkOldListings]);

  const handleKeepListing = async (listingId) => {
    // Renew the listing by updating CreatedAt to today
    const listing = oldListings.find(l => (l.uid || l.id) === listingId);
    if (!listing) return;

    try {
      const updatedListing = { ...listing, createdAt: new Date().toISOString() };
      
      // Update the listing's CreatedAt date based on type
      if (listing.itemType === 'cue') {
        await cueService.updateCue(listingId, updatedListing);
      } else if (listing.itemType === 'case') {
        await cueCaseService.updateCueCase(listingId, updatedListing);
      } else if (listing.itemType === 'table') {
        await billiardTableService.updateTable(listingId, updatedListing);
      } else if (listing.itemType === 'accessory') {
        await accessoryService.updateAccessory(listingId, updatedListing);
      }

      setOldListings(prev => prev.filter(l => (l.uid || l.id) !== listingId));
      if (oldListings.length <= 1) {
        setShowOldListingsModal(false);
      }
      await refreshListings();
    } catch (error) {
      console.error('Error renewing listing:', error);
      alert('Failed to renew listing. Please try again.');
    }
  };

  const handleMarkSold = async (listingId) => {
    const listing = oldListings.find(l => (l.uid || l.id) === listingId);
    if (!listing) return;

    try {
      // Update the listing as sold based on type
      if (listing.itemType === 'cue') {
        await cueService.updateCue(listingId, { ...listing, sold: true, status: 'sold' });
      } else if (listing.itemType === 'case') {
        await cueCaseService.updateCueCase(listingId, { ...listing, sold: true, status: 'sold' });
      } else if (listing.itemType === 'table') {
        await billiardTableService.updateTable(listingId, { ...listing, sold: true, status: 'sold' });
      } else if (listing.itemType === 'accessory') {
        await accessoryService.updateAccessory(listingId, { ...listing, sold: true, status: 'sold' });
      }

      setOldListings(prev => prev.filter(l => (l.uid || l.id) !== listingId));
      if (oldListings.length <= 1) {
        setShowOldListingsModal(false);
      }
      await refreshListings();
    } catch (error) {
      console.error('Error marking listing as sold:', error);
      alert('Failed to mark listing as sold. Please try again.');
    }
  };

  const handleDeleteListing = async (listingId) => {
    const listing = oldListings.find(l => (l.uid || l.id) === listingId);
    if (!listing) return;

    try {
      // Delete the listing based on type
      if (listing.itemType === 'cue') {
        await cueService.deleteCue(listingId);
      } else if (listing.itemType === 'case') {
        await cueCaseService.deleteCueCase(listingId);
      } else if (listing.itemType === 'table') {
        await billiardTableService.deleteTable(listingId);
      } else if (listing.itemType === 'accessory') {
        await accessoryService.deleteAccessory(listingId);
      }

      setOldListings(prev => prev.filter(l => (l.uid || l.id) !== listingId));
      if (oldListings.length <= 1) {
        setShowOldListingsModal(false);
      }
      await refreshListings();
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing. Please try again.');
    }
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
    const dedupeCategories = (items = []) => {
      const seen = new Set();
      return items.filter((cat) => {
        const key = `${cat?.id ?? ''}-${(cat?.name || '').toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const filterForumCategories = (items = []) =>
      items.filter((cat) => (cat?.name || '').trim().toLowerCase() !== 'billiard clubs');

    const loadForumCategories = async () => {
      try {
        const categories = await forumService.getCategories();
        setForumCategories(dedupeCategories(filterForumCategories(categories)));
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
      <div className="flex-1 bg-background flex flex-col relative pt-[76px] sm:pt-[72px] md:pt-[64px]">
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
              
              <Route path="/forgot-password" element={
                user ? <Navigate to="/" /> : <ForgotPassword />
              } />
              
              <Route path="/reset-password" element={
                user ? <Navigate to="/" /> : <ResetPassword />
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
              <Route path="/accessory/:id" element={
                user ? <AccessoryDetail onBack={handleBack} /> : <Navigate to="/login" />
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
              <Route path="/clubs" element={
                <BilliardClubsPage />
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

      {/* Old Listings Review Modal */}
      {showOldListingsModal && oldListings.length > 0 && (
        <OldListingsModal
          listings={oldListings}
          onClose={() => setShowOldListingsModal(false)}
          onKeep={handleKeepListing}
          onMarkSold={handleMarkSold}
          onDelete={handleDeleteListing}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AuthProvider>
  );
}

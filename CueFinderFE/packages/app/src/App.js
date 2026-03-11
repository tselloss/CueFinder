import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import CueList from './components/CueList.jsx';
import CueDetail from './components/CueDetail.jsx';
import CueFormModal from './components/CueFormModal.jsx';
import CueCaseDetail from './components/CueCaseDetail';
import BilliardTableDetail from './components/BilliardTableDetail.jsx';
import AccessoryDetail from './components/AccessoryDetail.jsx';
import CueSetDetail from './components/CueSetDetail.jsx';
import AdminPage from './components/AdminPage.jsx';
import LoginPage from './components/LoginPage.jsx';
import UserProfile from './components/UserProfile.jsx';
import OAuthCallback from './components/OAuthCallback';
import Inbox from './components/Inbox.jsx';
import ComingSoon from './components/ComingSoon';
import Forum from './components/Forum.jsx';
import DesktopSidebar from './components/DesktopSidebar';
import AppHeader from './components/AppHeader.jsx';
import AppFooter from './components/AppFooter.jsx';
import OldListingsModal from './components/OldListingsModal.jsx';
import MobileBottomNav from './components/MobileBottomNav.jsx';
import RaffleList from './components/RaffleList.jsx';
import RaffleDetail from './components/RaffleDetail.jsx';
import RaffleCreateForm from './components/RaffleCreateForm.jsx';
import SellerProfile from './components/SellerProfile.jsx';
import { AuthProvider, useAuth } from './auth/AuthContext';
import * as cueService from './api/cueService';
import * as cueCaseService from './api/cueCaseService';
import * as billiardTableService from './api/billiardTableService';
import * as accessoryService from './api/accessoryService';
import * as cueSetService from './api/cueSetService';
import * as messageService from './api/messageService';
import * as forumService from './api/forumService';

import './form-icons.css';
import './mobile-responsive.css';
import './styles/design-system.css';
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
  const [oldListings, setOldListings] = useState([]);
  const [showOldListingsModal, setShowOldListingsModal] = useState(false);
  // Price range slider [min,max] in EUR
  const PRICE_MIN_LIMIT = 0;
  const PRICE_MAX_LIMIT = 10000;
  const [priceRange, setPriceRange] = useState([PRICE_MIN_LIMIT, PRICE_MAX_LIMIT]);
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
  // Show the sidebar on home + raffles + forum pages
  const showSidebar = isHomePage || location.pathname.startsWith('/raffles') || location.pathname.startsWith('/forum');
  
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
      const [cuesData, casesData, tablesData, accessoriesData, setsData] = await Promise.all([
        cueService.getCues().catch(err => { console.error('Error fetching cues:', err); return []; }),
        cueCaseService.getCueCases().catch(err => { console.error('Error fetching cue cases:', err); return []; }),
        billiardTableService.getTables().catch(err => { console.error('Error fetching tables:', err); return []; }),
        accessoryService.getAccessories().catch(err => { console.error('Error fetching accessories:', err); return []; }),
        cueSetService.getCueSets().catch(err => { console.error('Error fetching cue sets:', err); return []; })
      ]);

      const cuesWithCategory = cuesData.map(cue => ({ ...cue, itemType: 'cue' }));
      const casesWithCategory = casesData.map(cueCase => ({ ...cueCase, itemType: 'case' }));
      const tablesWithCategory = tablesData.map(table => ({ ...table, itemType: 'table' }));
      const accessoriesWithCategory = accessoriesData.map(accessory => ({ ...accessory, itemType: 'accessory' }));
      const setsWithCategory = setsData.map(set => ({ ...set, itemType: 'set' }));

      const combined = [...cuesWithCategory, ...casesWithCategory, ...tablesWithCategory, ...accessoriesWithCategory, ...setsWithCategory];

      // Fisher-Yates shuffle so the home page shows a different order on every refresh
      for (let i = combined.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combined[i], combined[j]] = [combined[j], combined[i]];
      }
      const allListings = combined;

      console.log('Loaded listings:', {
        cues: cuesWithCategory.length,
        cases: casesWithCategory.length,
        tables: tablesWithCategory.length,
        accessories: accessoriesWithCategory.length,
        total: allListings.length
      });

      setCues(allListings);

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
    refreshListings();
  }, [isHomePage, refreshListings]);

  const handleSelect = (item) => {
    if (item.itemType === 'case') {
      navigate(`/case/${item.id}`);
    } else if (item.itemType === 'table') {
      navigate(`/table/${item.id}`);
    } else if (item.itemType === 'accessory') {
      navigate(`/accessory/${item.id}`);
    } else if (item.itemType === 'set') {
      navigate(`/set/${item.id}`);
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
      const lastCheck = sessionStorage.getItem('oldListingsChecked');
      if (lastCheck) return;

      const [userCues, userCases, userTables, userAccessories, userSets] = await Promise.all([
        cueService.getMyCues().catch(err => { console.error('Error fetching cues:', err); return []; }),
        cueCaseService.getMyCueCases().catch(err => { console.error('Error fetching cases:', err); return []; }),
        billiardTableService.getMyTables().catch(err => { console.error('Error fetching tables:', err); return []; }),
        accessoryService.getMyAccessories().catch(err => { console.error('Error fetching accessories:', err); return []; }),
        cueSetService.getMyCueSets().catch(err => { console.error('Error fetching sets:', err); return []; })
      ]);

      const allUserListings = [
        ...userCues.map(c => ({ ...c, itemType: 'cue' })),
        ...userCases.map(c => ({ ...c, itemType: 'case' })),
        ...userTables.map(t => ({ ...t, itemType: 'table' })),
        ...userAccessories.map(a => ({ ...a, itemType: 'accessory' })),
        ...userSets.map(s => ({ ...s, itemType: 'set' }))
      ];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldUserListings = allUserListings.filter(listing => {
        const isOwner =
          listing.userId === user.id || listing.user_id === user.id ||
          listing.owner_id === user.id || listing.sellerId === user.id ||
          String(listing.userId) === String(user.id) || String(listing.user_id) === String(user.id) ||
          String(listing.owner_id) === String(user.id) || String(listing.sellerId) === String(user.id);
        const lastActivityDate = new Date(listing.updatedAt || listing.updated_at || listing.createdAt || listing.created_at);
        const isOld = lastActivityDate < thirtyDaysAgo;
        const notSold = !listing.sold && !listing.isSold && listing.status !== 'sold';
        return isOwner && isOld && notSold;
      });

      sessionStorage.setItem('oldListingsChecked', 'true');
      if (oldUserListings.length > 0) {
        setOldListings(oldUserListings);
        setShowOldListingsModal(true);
      }
    } catch (error) {
      console.error('Error checking old listings:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => { checkOldListings(); }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, checkOldListings]);

  const handleKeepListing = async (listingId) => {
    const listing = oldListings.find(l => (l.uid || l.id) === listingId);
    if (!listing) return;
    try {
      // Send a no-op update — the server always sets updatedAt = now on any update
      const renewPayload = { title: listing.title };
      if (listing.itemType === 'cue') {
        await cueService.updateCue(listingId, renewPayload);
      } else if (listing.itemType === 'case') {
        await cueCaseService.updateCueCase(listingId, renewPayload);
      } else if (listing.itemType === 'table') {
        await billiardTableService.updateTable(listingId, renewPayload);
      } else if (listing.itemType === 'accessory') {
        await accessoryService.updateAccessory(listingId, renewPayload);
      } else if (listing.itemType === 'set') {
        await cueSetService.updateCueSet(listingId, renewPayload);
      }
      setOldListings(prev => prev.filter(l => (l.uid || l.id) !== listingId));
      if (oldListings.length === 1) setShowOldListingsModal(false);
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
      if (listing.itemType === 'cue') {
        await cueService.updateCue(listingId, { ...listing, sold: true, status: 'sold' });
      } else if (listing.itemType === 'case') {
        await cueCaseService.updateCueCase(listingId, { ...listing, sold: true, status: 'sold' });
      } else if (listing.itemType === 'table') {
        await billiardTableService.updateTable(listingId, { ...listing, sold: true, status: 'sold' });
      } else if (listing.itemType === 'accessory') {
        await accessoryService.updateAccessory(listingId, { ...listing, sold: true, status: 'sold' });
      } else if (listing.itemType === 'set') {
        await cueSetService.updateCueSet(listingId, { ...listing, sold: true, status: 'sold' });
      }
      setOldListings(prev => prev.filter(l => (l.uid || l.id) !== listingId));
      if (oldListings.length === 1) setShowOldListingsModal(false);
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
      if (listing.itemType === 'cue') {
        await cueService.deleteCue(listingId);
      } else if (listing.itemType === 'case') {
        await cueCaseService.deleteCueCase(listingId);
      } else if (listing.itemType === 'table') {
        await billiardTableService.deleteTable(listingId);
      } else if (listing.itemType === 'accessory') {
        await accessoryService.deleteAccessory(listingId);
      } else if (listing.itemType === 'set') {
        await cueSetService.deleteCueSet(listingId);
      }
      setOldListings(prev => prev.filter(l => (l.uid || l.id) !== listingId));
      if (oldListings.length === 1) setShowOldListingsModal(false);
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
        {/* pb-16 on mobile leaves room above the fixed bottom nav */}
        <div className="flex flex-row flex-1 relative pb-16 md:pb-0">
          {/* Mobile Sidebar Overlay */}
          {showSidebar && mobileMenuOpen && (
            <div 
              className="sidebar-overlay absolute inset-0 bg-black/50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Desktop Sidebar - Home, Raffles, Forum */}
          {showSidebar && (
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
              <Route path="/accessory/:id" element={
                user ? <AccessoryDetail onBack={handleBack} /> : <Navigate to="/login" />
              } />
              <Route path="/set/:id" element={
                user ? <CueSetDetail onBack={handleBack} /> : <Navigate to="/login" />
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
                user ? <ComingSoon category={category} onBack={handleBack} /> : <Navigate to="/login" />
              } />
              
              <Route path="/forum" element={
                user ? <Forum onBack={handleBack} /> : <Navigate to="/login" />
              } />

              {/* Seller profiles — registered users only */}
              <Route path="/sellers/:id" element={
                user ? <SellerProfile /> : <Navigate to="/login" />
              } />

              {/* Raffles — all require auth */}
              <Route path="/raffles" element={
                user ? <RaffleList onBack={handleBack} /> : <Navigate to="/login" />
              } />
              <Route path="/raffles/create" element={
                user ? <RaffleCreateForm onBack={handleBack} /> : <Navigate to="/login" />
              } />
              <Route path="/raffles/:id" element={
                user ? <RaffleDetail onBack={handleBack} /> : <Navigate to="/login" />
              } />
            </Routes>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
        unreadCount={unreadMessageCount}
        user={user}
        onToggleSidebar={() => setMobileMenuOpen(v => !v)}
        showSidebar={showSidebar}
        onAddListing={handleAdd}
      />

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
      <AppInner />
    </AuthProvider>
  );
}

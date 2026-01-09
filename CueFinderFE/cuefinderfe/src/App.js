import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Box, Button, Header, Heading, Text, TextInput, Select, Footer, RangeSelector } from 'grommet';
import { Add, Search, User, Logout, UserAdmin } from 'grommet-icons';
import CueList from './components/CueList';
import CueDetail from './components/CueDetail';
import CueFormModal from './components/CueFormModal';
import CueCaseDetail from './components/CueCaseDetail';
import AdminPage from './components/AdminPage';
import LoginPage from './components/LoginPage';
import UserProfile from './components/UserProfile';
import OAuthCallback from './components/OAuthCallback';
import { AuthProvider, useAuth } from './auth/AuthContext';
import * as cueService from './api/cueService';
import * as cueCaseService from './api/cueCaseService';

import './form-icons.css';
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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCue, setEditingCue] = useState(null);
  const [category, setCategory] = useState('all'); // 'all', 'cues', 'cases'
  const [condition, setCondition] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const sidebarOpen = true; // Always open on home page
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
  
  // Debug logging
  useEffect(() => {
    console.log('Current path:', location.pathname);
    console.log('Is home page:', isHomePage);
  }, [location.pathname, isHomePage]);

  useEffect(() => {
    async function load() {
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
      
      setCues(allListings);
    }
    load();
  }, []);

  const handleSelect = (item) => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }
  if (item.itemType === 'case') {
      navigate(`/case/${item.id}`);
    } else {
      navigate(`/cue/${item.id}`);
    }
  };
  
  const handleBack = () => navigate('/');
  
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
      
      setCues(allListings);
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

  // Debug logging
  useEffect(() => {
    console.log('User state:', user);
    console.log('User is logged in:', !!user);
  }, [user]);

  return (
    <Box fill background="background" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header 
        background="background-front" 
        pad={{ horizontal: "medium", vertical: "small" }}
        elevation="medium"
        style={{
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
          flexWrap: 'wrap'
        }}
      >
        <Box direction="row" align="center" gap="small">
          {/* Sidebar is always open on the home page; toggle removed */}
          
          <Heading level="2" margin="none" color="text-strong" style={{ fontWeight: 700, letterSpacing: '-0.5px', fontSize: 'clamp(18px, 4vw, 24px)' }}>
            🎱 {t('app.title')}
          </Heading>
        </Box>
        <Box direction="row" align="center" gap="medium" wrap style={{ flexShrink: 0 }}>
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
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Text size="medium" style={{ fontSize: '20px' }}>
                  {user.avatar || '👤'}
                </Text>
                <Box>
                  <Text size="small" color="text-strong" weight={700}>
                    {user.name}
                  </Text>
                  {user.role === 'admin' && (
                    <Text size="xsmall" color="brand" weight={600} style={{ lineHeight: '1' }}>
                      Administrator
                    </Text>
                  )}
                </Box>
              </Box>

              {/* Action Buttons */}
              <Button 
                icon={<User color="white" size="18px" />} 
                label={<Text size="small" color="white" weight={600}>{t('actions.profile')}</Text>}
                onClick={() => navigate('/profile')} 
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                }}
                hoverIndicator={{ 
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                }}
              />
              {user.role === 'admin' && (
                <Button 
                  icon={<UserAdmin color="white" size="18px" />} 
                  label={<Text size="small" color="white" weight={600}>{t('actions.admin')}</Text>}
                  onClick={() => navigate('/admin')} 
                  style={{ 
                    background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)'
                  }}
                  hoverIndicator={{
                    background: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)'
                  }}
                />
              )}
              <Button 
                icon={<Logout color="white" size="18px" />} 
                label={<Text size="small" color="white" weight={600}>{t('actions.logout')}</Text>}
                onClick={handleLogout} 
                style={{ 
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                }}
                hoverIndicator={{ 
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                }}
              />
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

      {/* Hero Section with Search Bar - Only show on home page */}
      {isHomePage && (
        <Box 
          background="background-back" 
          pad={{ vertical: "large", horizontal: "medium" }} 
          align="center"
          style={{ 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            paddingTop: '60px',
            paddingBottom: '80px',
            marginBottom: '40px',
            position: 'relative',
            zIndex: 10,
            borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
          }}
        >
          <Box width="100%" style={{ maxWidth: '900px' }} gap="large" align="center">
            {/* Hero Text */}
            <Box align="center" gap="small" pad={{ horizontal: 'small' }}>
              <Heading 
                level="1" 
                margin="none" 
                textAlign="center" 
                color="text-strong"
                style={{ 
                  fontSize: 'clamp(32px, 5vw, 48px)', 
                  fontWeight: 700,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}
              >
                {t('hero.title')}
              </Heading>
              <Text size="medium" textAlign="center" color="text-weak" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)' }}>
                {t('hero.subtitle')}
              </Text>
            </Box>

            {/* Search Bar - Directly Below Hero Text */}
            <Box 
              width="100%"
              align="center"
              pad={{ horizontal: 'small' }}
            >
              {/* Main Search Input - Prominent and Simple */}
              <Box 
                direction="column" 
                gap="medium" 
                align="center"
                width="100%"
                style={{ maxWidth: '800px' }}
              >
                {/* Primary Search Box with Angular Design */}
                <Box 
                  direction="row" 
                  align="center"
                  background="background-front"
                  pad={{ horizontal: 'medium', vertical: 'small' }}
                  round="medium"
                  elevation="large"
                  style={{ 
                    width: '100%',
                    minHeight: '60px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                    border: '2px solid rgba(59, 130, 246, 0.4)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    zIndex: 20
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(59, 130, 246, 0.3)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                  }}
                >
                  <Search size="24px" color="#3b82f6" style={{ flexShrink: 0, marginRight: '12px' }} />
                  <Box flex={{ grow: 1 }}>
                    <TextInput
                      placeholder="Search for cues, brands, or locations..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      plain
                      style={{
                        fontSize: '17px',
                        fontWeight: 400,
                        border: 'none',
                        background: 'transparent',
                        padding: '8px 0',
                        color: '#f1f5f9',
                        outline: 'none'
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          // Trigger search on Enter key
                          console.log('Search triggered:', search);
                        }
                      }}
                    />
                  </Box>
                  {search && (
                    <Button
                      plain
                      icon={<Text size="large" style={{ lineHeight: 1, color: '#94a3b8' }}>×</Text>}
                      onClick={() => setSearch('')}
                      style={{
                        padding: '4px',
                        marginLeft: '8px',
                        marginRight: '8px',
                        minWidth: 'auto',
                        opacity: 0.6
                      }}
                      hoverIndicator={{ opacity: 1 }}
                    />
                  )}
                  <Button 
                    primary 
                    label={<Text weight={700} size="medium" color="white">Search</Text>}
                    onClick={() => console.log('Search clicked:', search)}
                    style={{ 
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      borderRadius: '8px',
                      padding: '12px 32px',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.2s ease'
                    }}
                    hoverIndicator={false}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                    }}
                  />
                </Box>

                {/* Secondary Filters - Compact Design */}
                <Box 
                  direction="row" 
                  gap="small" 
                  wrap
                  align="center"
                  justify="center"
                  width="100%"
                >
                  <Box direction="row" align="center" gap="xsmall">
                    <Text size="small" color="text-weak" weight={500}>{t('filters.filterBy')}</Text>
                  </Box>
                  <Select
                    options={[t('filters.condition.all'), t('filters.condition.likeNew'), t('filters.condition.used'), t('filters.condition.fair')]}
                    value={condition === 'all' ? t('filters.condition.all') : condition}
                    onChange={({ option }) => setCondition(option === t('filters.condition.all') ? 'all' : option)}
                    size="small"
                    style={{ 
                      minWidth: '130px',
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '8px',
                      backdropFilter: 'blur(10px)',
                      padding: '4px 12px'
                    }}
                  />
                  <Select
                    options={[t('filters.sort.newest'), t('filters.sort.low'), t('filters.sort.high')]}
                    value={sortBy === 'newest' ? t('filters.sort.newest') : sortBy === 'price_asc' ? t('filters.sort.low') : t('filters.sort.high')}
                    onChange={({ option }) => {
                      if (option === t('filters.sort.newest')) setSortBy('newest');
                      else if (option === t('filters.sort.low')) setSortBy('price_asc');
                      else setSortBy('price_desc');
                    }}
                    size="small"
                    style={{ 
                      minWidth: '130px',
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '8px',
                      backdropFilter: 'blur(10px)',
                      padding: '4px 12px'
                    }}
                  />
                  {user && (
                    <Button 
                      icon={<Add size="16px" />} 
                      label={<Text weight={600} size="small" color="white">{t('filters.newListing')}</Text>}
                      onClick={handleAdd}
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.9))',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 18px',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                      hoverIndicator={false}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.3)';
                      }}
                    />
                  )}
                </Box>

                {/* Search Tips - Hidden by default, shown on focus */}
                {search.length > 0 && (
                  <Box 
                    background="rgba(30, 41, 59, 0.8)" 
                    pad="small" 
                    round="small"
                    style={{ 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}
                  >
                    <Text size="xsmall" color="text-weak">
                      💡 Tip: Press Enter to search or use filters to refine results
                    </Text>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Main Content Area with Sidebar */}
      <Box flex="grow" background="background" style={{ flexGrow: 1 }}>
        <Box direction="row" fill>
          {/* Modern Collapsible Sidebar - Only on home page */}
          {isHomePage && (
            <Box 
              width="300px" 
              background="background-front" 
              pad="medium"
              gap="medium"
              elevation="xlarge"
              style={{ 
                borderRight: '1px solid rgba(59, 130, 246, 0.2)',
                height: 'fit-content',
                position: window.innerWidth <= 768 ? 'fixed' : 'sticky',
                top: window.innerWidth <= 768 ? '0' : '20px',
                left: window.innerWidth <= 768 ? '0' : '20px',
                zIndex: window.innerWidth <= 768 ? 100 : 1,
                maxHeight: window.innerWidth <= 768 ? '100vh' : 'calc(100vh - 40px)',
                overflowY: 'auto',
                overflowX: 'hidden',
                borderRadius: window.innerWidth <= 768 ? '0' : '16px',
                backdropFilter: 'blur(20px)',
                background: 'rgba(15, 23, 42, 0.8)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 1px rgba(59, 130, 246, 0.3)',
                animation: 'slideIn 0.3s ease-out',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Sidebar Header */}
              <Box 
                direction="row" 
                justify="between" 
                align="center"
                pad={{ bottom: 'small' }}
                border={{ side: 'bottom', color: 'rgba(59, 130, 246, 0.2)', size: '1px' }}
              >
                <Box direction="row" gap="small" align="center">
                  <Box 
                    background="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                    pad="xsmall"
                    round="small"
                    style={{ 
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    <Text size="medium" style={{ lineHeight: '1' }}>📋</Text>
                  </Box>
                  <Heading level="3" margin="none" style={{ 
                    fontSize: '18px', 
                    fontWeight: 700,
                    color: '#f1f5f9',
                    letterSpacing: '-0.02em'
                  }}>
                    {t('categories.all')}
                  </Heading>
                </Box>
              </Box>
              
              {/* Category Buttons */}
              <Box gap="xsmall" margin={{ top: 'small' }}>
                <Button
                  fill="horizontal"
                  onClick={() => setCategory('all')}
                  style={{
                    background: category === 'all' 
                      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                      : 'rgba(30, 41, 59, 0.5)',
                    color: category === 'all' ? 'white' : '#cbd5e1',
                    border: category === 'all' 
                      ? '2px solid transparent' 
                      : '2px solid rgba(51, 65, 85, 0.5)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    transform: category === 'all' ? 'translateX(4px)' : 'translateX(0)',
                    boxShadow: category === 'all' 
                      ? '0 8px 20px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)' 
                      : 'none'
                  }}
                  hoverIndicator={{
                    background: category === 'all' 
                      ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                      : 'rgba(30, 41, 59, 0.8)'
                  }}
                >
                  <Box direction="row" gap="medium" align="center">
                    <Text size="xlarge" style={{ lineHeight: '1' }}>🎱</Text>
                    <Box>
                      <Text weight={category === 'all' ? 700 : 500} size="medium" style={{ lineHeight: '1.2' }}>
                        {t('categories.all')}
                      </Text>
                      {category === 'all' && (
                        <Text size="xsmall" color="rgba(255, 255, 255, 0.7)" style={{ lineHeight: '1' }}>
                          Browse everything
                        </Text>
                      )}
                    </Box>
                  </Box>
                </Button>
                
                <Button
                  fill="horizontal"
                  onClick={() => setCategory('cues')}
                  style={{
                    background: category === 'cues' 
                      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                      : 'rgba(30, 41, 59, 0.5)',
                    color: category === 'cues' ? 'white' : '#cbd5e1',
                    border: category === 'cues' 
                      ? '2px solid transparent' 
                      : '2px solid rgba(51, 65, 85, 0.5)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    transform: category === 'cues' ? 'translateX(4px)' : 'translateX(0)',
                    boxShadow: category === 'cues' 
                      ? '0 8px 20px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)' 
                      : 'none'
                  }}
                  hoverIndicator={{
                    background: category === 'cues' 
                      ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                      : 'rgba(30, 41, 59, 0.8)'
                  }}
                >
                  <Box direction="row" gap="medium" align="center">
                    <Text size="xlarge" style={{ lineHeight: '1' }}>🎯</Text>
                    <Box>
                      <Text weight={category === 'cues' ? 700 : 500} size="medium" style={{ lineHeight: '1.2' }}>
                        {t('categories.cues')}
                      </Text>
                      {category === 'cues' && (
                        <Text size="xsmall" color="rgba(255, 255, 255, 0.7)" style={{ lineHeight: '1' }}>
                          Pool & snooker cues
                        </Text>
                      )}
                    </Box>
                  </Box>
                </Button>
                
                <Button
                  fill="horizontal"
                  onClick={() => setCategory('cases')}
                  style={{
                    background: category === 'cases' 
                      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                      : 'rgba(30, 41, 59, 0.5)',
                    color: category === 'cases' ? 'white' : '#cbd5e1',
                    border: category === 'cases' 
                      ? '2px solid transparent' 
                      : '2px solid rgba(51, 65, 85, 0.5)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    transform: category === 'cases' ? 'translateX(4px)' : 'translateX(0)',
                    boxShadow: category === 'cases' 
                      ? '0 8px 20px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)' 
                      : 'none'
                  }}
                  hoverIndicator={{
                    background: category === 'cases' 
                      ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                      : 'rgba(30, 41, 59, 0.8)'
                  }}
                >
                  <Box direction="row" gap="medium" align="center">
                    <Text size="xlarge" style={{ lineHeight: '1' }}>💼</Text>
                    <Box>
                      <Text weight={category === 'cases' ? 700 : 500} size="medium" style={{ lineHeight: '1.2' }}>
                        {t('categories.cases')}
                      </Text>
                      {category === 'cases' && (
                        <Text size="xsmall" color="rgba(255, 255, 255, 0.7)" style={{ lineHeight: '1' }}>
                          Protective cases
                        </Text>
                      )}
                    </Box>
                  </Box>
                </Button>
              </Box>

              {/* Filters Section */}
              <Box 
                margin={{ top: 'medium' }}
                pad={{ top: 'medium' }}
                border={{ side: 'top', color: 'rgba(59, 130, 246, 0.2)', size: '1px' }}
                gap="small"
              >
                <Box direction="row" gap="small" align="center">
                  <Box 
                    background="rgba(59, 130, 246, 0.2)"
                    pad="xsmall"
                    round="small"
                  >
                    <Text size="small" style={{ lineHeight: '1' }}>🔍</Text>
                  </Box>
                  <Heading level="4" margin="none" style={{ 
                    fontSize: '14px', 
                    fontWeight: 600,
                    color: '#cbd5e1',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    Filters
                  </Heading>
                </Box>
                <Box 
                  background="rgba(30, 41, 59, 0.5)"
                  pad="medium"
                  round="8px"
                  border={{ color: 'rgba(51, 65, 85, 0.5)', size: '1px' }}
                  gap="small"
                >
                  <Heading level="4" margin="none" style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>
                    {t('price.range')}
                  </Heading>
                  {/* Currency fixed to EUR */}
                  <Box gap="small">
                    {/* Preset quick filters */}
                    <Box direction="row" gap="xsmall" wrap>
                      {presetRanges.map((p) => (
                        <Button
                          key={p.label}
                          label={<Text size="xsmall" weight={600} color={'brand'}>{p.label.replace('$', currencySymbol)}</Text>}
                          onClick={() => {
                            const [min, max] = p.value;
                            setPriceRange([min, max]);
                          }}
                          style={{
                            background: priceRange[0] === p.value[0] && priceRange[1] === p.value[1]
                              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                              : 'rgba(30,41,59,0.5)',
                            border: '1px solid rgba(59,130,246,0.3)',
                            borderRadius: '16px',
                            padding: '4px 10px'
                          }}
                          hoverIndicator={false}
                        />
                      ))}
                    </Box>
                    {/* Current values */}
                    <Box direction="row" justify="between" align="center">
                      <Text size="small" color="#cbd5e1" weight={600}>{currencySymbol}{priceRange[0]}</Text>
                      <Text size="small" color="#cbd5e1" weight={600}>{currencySymbol}{priceRange[1]}</Text>
                    </Box>
                    {/* Range slider */}
                    <Box gap="xsmall">
                      {/* Styled track with highlighted selected range */}
                      <Box height="6px" round="large" background={{ color: 'rgba(51,65,85,0.6)' }}>
                        <Box
                          height="6px"
                          round="large"
                          background={{ color: 'brand' }}
                          style={{
                            width: `${((priceRange[1] - priceRange[0]) / (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT)) * 100}%`,
                            marginLeft: `${((priceRange[0] - PRICE_MIN_LIMIT) / (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT)) * 100}%`,
                            transition: 'width 0.1s ease, margin-left 0.1s ease'
                          }}
                        />
                      </Box>
                      <Box pad={{ horizontal: 'xsmall' }}>
                        <RangeSelector
                          direction="horizontal"
                          min={PRICE_MIN_LIMIT}
                          max={PRICE_MAX_LIMIT}
                          step={PRICE_STEP}
                          values={priceRange}
                          onChange={setPriceRange}
                        />
                      </Box>
                    </Box>
                    <Text size="xsmall" color="#94a3b8">Step: {currencySymbol}{PRICE_STEP}</Text>
                  </Box>
                </Box>
              </Box>

              {/* Pro Tip Section */}
              <Box 
                background="linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)"
                pad="medium"
                round="12px"
                border={{ color: 'rgba(59, 130, 246, 0.3)', size: '1px' }}
                margin={{ top: 'small' }}
              >
                <Box direction="row" gap="small" align="start">
                  <Text size="medium">💡</Text>
                  <Box>
                    <Text size="small" weight={600} color="#f1f5f9" style={{ lineHeight: '1.4' }}>
                      Pro Tip
                    </Text>
                    <Text size="xsmall" color="#94a3b8" style={{ lineHeight: '1.5' }}>
                      Use the search bar above to find specific brands or models quickly!
                    </Text>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {/* Main Content */}
          <Box 
            flex 
            pad={{ horizontal: 'medium', vertical: 'none' }} 
            style={{ 
              maxWidth: isHomePage && sidebarOpen ? '100%' : '1400px', 
              width: '100%',
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
              
              <Route path="/admin" element={
                user && user.role === 'admin' ? <AdminPage onBack={handleBack} /> : <Navigate to="/" />
              } />
            </Routes>
          </Box>
        </Box>
      </Box>

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

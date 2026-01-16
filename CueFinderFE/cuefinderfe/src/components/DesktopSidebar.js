import React from 'react';
import { Box, Button, Heading, Text, RangeSelector } from 'grommet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function DesktopSidebar({
  category,
  setCategory,
  cueType,
  setCueType,
  priceRange,
  setPriceRange,
  mobileMenuOpen,
  setMobileMenuOpen,
  forumCategories,
  showForumCategories,
  setShowForumCategories,
  PRICE_MIN_LIMIT = 0,
  PRICE_MAX_LIMIT = 10000,
  PRICE_STEP = 1,
  currencySymbol = '€',
  presetRanges = []
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box 
      className={`sidebar-desktop ${mobileMenuOpen ? 'sidebar-mobile-open' : ''}`}
      width="280px" 
      flex={{ shrink: 0 }}
      background="background-front" 
      pad="medium"
      gap="medium"
      elevation="xlarge"
      style={{ 
        borderRight: '1px solid rgba(59, 130, 246, 0.2)',
        height: 'fit-content',
        position: 'sticky',
        top: '80px',
        alignSelf: 'flex-start',
        zIndex: 20,
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        borderRadius: '16px',
        backdropFilter: 'blur(20px)',
        background: 'rgba(15, 23, 42, 0.8)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 1px rgba(59, 130, 246, 0.3)',
        animation: 'slideIn 0.3s ease-out',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        margin: '20px 0 20px 20px'
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
        {/* Close button for mobile */}
        <Button
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          }
          onClick={() => setMobileMenuOpen(false)}
          plain
          className="mobile-close-button"
          style={{ display: 'none' }}
        />
      </Box>
      
      {/* Category Buttons */}
      <Box gap="xsmall" margin={{ top: 'small' }}>
        <Button
          fill="horizontal"
          data-testid="sidebar-category-all"
          onClick={() => {
            setCategory('all');
            setMobileMenuOpen(false);
          }}
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
          data-testid="sidebar-category-cues"
          onClick={() => {
            setCategory('cues');
          }}
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
          data-testid="sidebar-category-cases"
          onClick={() => {
            setCategory('cases');
            setMobileMenuOpen(false);
          }}
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

        <Button
          fill="horizontal"
          data-testid="sidebar-category-tables"
          onClick={() => {
            setCategory('tables');
            setMobileMenuOpen(false);
          }}
          style={{
            background: category === 'tables' 
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
              : 'rgba(30, 41, 59, 0.5)',
            color: category === 'tables' ? 'white' : '#cbd5e1',
            border: category === 'tables' 
              ? '2px solid transparent' 
              : '2px solid rgba(51, 65, 85, 0.5)',
            borderRadius: '12px',
            padding: '14px 18px',
            justifyContent: 'flex-start',
            textAlign: 'left',
            transition: 'all 0.2s ease',
            transform: category === 'tables' ? 'translateX(4px)' : 'translateX(0)',
            boxShadow: category === 'tables' 
              ? '0 8px 20px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)' 
              : 'none'
          }}
          hoverIndicator={{
            background: category === 'tables' 
              ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
              : 'rgba(30, 41, 59, 0.8)'
          }}
        >
          <Box direction="row" gap="medium" align="center">
            <Text size="xlarge" style={{ lineHeight: '1' }}>🪑</Text>
            <Box>
              <Text weight={category === 'tables' ? 700 : 500} size="medium" style={{ lineHeight: '1.2' }}>
                Billiard Tables
              </Text>
              {category === 'tables' && (
                <Text size="xsmall" color="rgba(255, 255, 255, 0.7)" style={{ lineHeight: '1' }}>
                  Pool & billiard tables
                </Text>
              )}
            </Box>
          </Box>
        </Button>

        <Button
          fill="horizontal"
          data-testid="sidebar-category-accessories"
          onClick={() => {
            setCategory('accessories');
            setMobileMenuOpen(false);
          }}
          style={{
            background: category === 'accessories' 
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
              : 'rgba(30, 41, 59, 0.5)',
            color: category === 'accessories' ? 'white' : '#cbd5e1',
            border: category === 'accessories' 
              ? '2px solid transparent' 
              : '2px solid rgba(51, 65, 85, 0.5)',
            borderRadius: '12px',
            padding: '14px 18px',
            justifyContent: 'flex-start',
            textAlign: 'left',
            transition: 'all 0.2s ease',
            transform: category === 'accessories' ? 'translateX(4px)' : 'translateX(0)',
            boxShadow: category === 'accessories' 
              ? '0 8px 20px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)' 
              : 'none'
          }}
          hoverIndicator={{
            background: category === 'accessories' 
              ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
              : 'rgba(30, 41, 59, 0.8)'
          }}
        >
          <Box direction="row" gap="medium" align="center">
            <Text size="xlarge" style={{ lineHeight: '1' }}>🛠️</Text>
            <Box>
              <Text weight={category === 'accessories' ? 700 : 500} size="medium" style={{ lineHeight: '1.2' }}>
                Accessories
              </Text>
              {category === 'accessories' && (
                <Text size="xsmall" color="rgba(255, 255, 255, 0.7)" style={{ lineHeight: '1' }}>
                  Billiard accessories
                </Text>
              )}
            </Box>
          </Box>
        </Button>
      </Box>

      {/* Forum Section */}
      <Box gap="xsmall" margin={{ top: 'medium' }} pad={{ top: 'medium' }} border={{ side: 'top', color: 'rgba(59, 130, 246, 0.2)', size: '1px' }}>
        <Box direction="row" gap="small" align="center" pad={{ horizontal: 'small', bottom: 'xsmall' }}>
          <Text size="small" weight={600} color="#94a3b8" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Community
          </Text>
        </Box>
        <Button
          fill="horizontal"
          data-testid="sidebar-forum"
          onClick={(e) => {
            e.stopPropagation();
            setShowForumCategories(!showForumCategories);
            setMobileMenuOpen(false);
          }}
          style={{
            background: showForumCategories 
              ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
              : 'rgba(30, 41, 59, 0.5)',
            color: showForumCategories ? 'white' : '#cbd5e1',
            border: showForumCategories 
              ? '2px solid transparent' 
              : '2px solid rgba(51, 65, 85, 0.5)',
            borderRadius: '12px',
            padding: '14px 18px',
            justifyContent: 'space-between',
            textAlign: 'left',
            transition: 'all 0.2s ease',
            transform: showForumCategories ? 'translateX(4px)' : 'translateX(0)',
            boxShadow: showForumCategories 
              ? '0 8px 20px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)' 
              : 'none'
          }}
          hoverIndicator={{
            background: showForumCategories 
              ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
              : 'rgba(30, 41, 59, 0.8)'
          }}
        >
          <Box direction="row" gap="medium" align="center" justify="between" fill="horizontal">
            <Box direction="row" gap="medium" align="center">
              <Text size="xlarge" style={{ lineHeight: '1' }}>💬</Text>
              <Box>
                <Text weight={showForumCategories ? 700 : 500} size="medium" style={{ lineHeight: '1.2' }}>
                  Forum
                </Text>
                {showForumCategories && (
                  <Text size="xsmall" color="rgba(255, 255, 255, 0.7)" style={{ lineHeight: '1' }}>
                    Select category
                  </Text>
                )}
              </Box>
            </Box>
            {forumCategories.length > 0 && (
              <Box onClick={(e) => e.stopPropagation()}>
                <Text 
                  size="small" 
                  style={{ 
                    transform: showForumCategories ? 'rotate(180deg)' : 'rotate(0)', 
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#a78bfa',
                    fontWeight: 700
                  }}
                >
                  ▼
                </Text>
              </Box>
            )}
          </Box>
        </Button>

        {/* Forum Categories Sub-menu */}
        {showForumCategories && forumCategories.length > 0 && (
          <Box 
            gap="xxsmall" 
            margin={{ top: 'small', left: 'small', right: 'xsmall' }}
            pad={{ left: 'medium', right: 'small', top: 'xsmall', bottom: 'xsmall' }}
            border={{ side: 'left', color: 'rgba(139, 92, 246, 0.5)', size: '3px' }}
            background="rgba(139, 92, 246, 0.08)"
            round="xsmall"
            style={{
              animation: 'slideDown 0.3s ease-out',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Text size="xsmall" weight={600} color="#a78bfa" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', marginLeft: '-4px' }}>
              Categories
            </Text>
            
            {/* All Categories View Button */}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/forum');
                setMobileMenuOpen(false);
              }}
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
                color: '#e0e7ff',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '8px',
                padding: '10px 12px',
                justifyContent: 'flex-start',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                marginBottom: '6px'
              }}
              hoverIndicator={{ background: 'rgba(139, 92, 246, 0.25)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
              }}
            >
              <Box direction="row" gap="small" align="center" fill="horizontal">
                <Text size="small" style={{ color: '#a78bfa', fontWeight: 700 }}>📋</Text>
                <Text size="small" weight={600} style={{ color: 'inherit' }}>
                  All Categories
                </Text>
              </Box>
            </Button>
            
            {/* Individual Categories */}
            {forumCategories.map(forumCat => (
              <Button
                key={forumCat.id}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/forum', { state: { selectedCategory: forumCat } });
                  setMobileMenuOpen(false);
                }}
                style={{
                  background: 'transparent',
                  color: '#cbd5e1',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                hoverIndicator={{ background: 'rgba(139, 92, 246, 0.3)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.paddingLeft = '16px';
                  e.currentTarget.style.color = '#e0e7ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.paddingLeft = '12px';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                <Box direction="row" gap="small" align="center" fill="horizontal">
                  <Text size="xsmall" style={{ color: '#8b5cf6', fontWeight: 600 }}>→</Text>
                  <Text size="small" weight={400} style={{ color: 'inherit' }}>
                    {forumCat.name}
                  </Text>
                </Box>
              </Button>
            ))}
          </Box>
        )}
      </Box>

      {/* Cue Type Sub-filters - Only show when Cues category is selected */}
      {category === 'cues' && (
        <Box 
          gap="xxsmall" 
          margin={{ top: 'small', left: 'small' }}
          pad={{ left: 'small' }}
          border={{ side: 'left', color: 'rgba(59, 130, 246, 0.3)', size: '2px' }}
        >
          <Text size="xsmall" weight={600} color="#94a3b8" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Cue Type
          </Text>
          
          <Button
            data-testid="cue-type-all"
            onClick={() => {
              setCueType('all');
              setMobileMenuOpen(false);
            }}
            style={{
              background: cueType === 'all' 
                ? 'rgba(59, 130, 246, 0.3)' 
                : 'transparent',
              color: cueType === 'all' ? '#60a5fa' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              justifyContent: 'flex-start',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
            hoverIndicator={{ background: 'rgba(30, 41, 59, 0.5)' }}
          >
            <Text size="small" weight={cueType === 'all' ? 600 : 400}>
              All Types
            </Text>
          </Button>
          
          <Button
            data-testid="cue-type-playing"
            onClick={() => {
              setCueType('playing');
              setMobileMenuOpen(false);
            }}
            style={{
              background: cueType === 'playing' 
                ? 'rgba(59, 130, 246, 0.3)' 
                : 'transparent',
              color: cueType === 'playing' ? '#60a5fa' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              justifyContent: 'flex-start',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
            hoverIndicator={{ background: 'rgba(30, 41, 59, 0.5)' }}
          >
            <Box direction="row" gap="small" align="center">
              <Text size="small">🎯</Text>
              <Text size="small" weight={cueType === 'playing' ? 600 : 400}>
                Playing Cue
              </Text>
            </Box>
          </Button>
          
          <Button
            data-testid="cue-type-break"
            onClick={() => {
              setCueType('break');
              setMobileMenuOpen(false);
            }}
            style={{
              background: cueType === 'break' 
                ? 'rgba(59, 130, 246, 0.3)' 
                : 'transparent',
              color: cueType === 'break' ? '#60a5fa' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              justifyContent: 'flex-start',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
            hoverIndicator={{ background: 'rgba(30, 41, 59, 0.5)' }}
          >
            <Box direction="row" gap="small" align="center">
              <Text size="small">💥</Text>
              <Text size="small" weight={cueType === 'break' ? 600 : 400}>
                Break Cue
              </Text>
            </Box>
          </Button>
          
          <Button
            data-testid="cue-type-jump"
            onClick={() => {
              setCueType('jump');
              setMobileMenuOpen(false);
            }}
            style={{
              background: cueType === 'jump' 
                ? 'rgba(59, 130, 246, 0.3)' 
                : 'transparent',
              color: cueType === 'jump' ? '#60a5fa' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              justifyContent: 'flex-start',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
            hoverIndicator={{ background: 'rgba(30, 41, 59, 0.5)' }}
          >
            <Box direction="row" gap="small" align="center">
              <Text size="small">🚀</Text>
              <Text size="small" weight={cueType === 'jump' ? 600 : 400}>
                Jump Cue
              </Text>
            </Box>
          </Button>
        </Box>
      )}

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
  );
}

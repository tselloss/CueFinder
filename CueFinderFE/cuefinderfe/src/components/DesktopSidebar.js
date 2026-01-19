import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function DesktopSidebar({
  category,
  setCategory,
  cueType,
  setCueType,
  mobileMenuOpen,
  setMobileMenuOpen,
  forumCategories,
  showForumCategories,
  setShowForumCategories
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div 
      className={`sidebar-desktop ${mobileMenuOpen ? 'sidebar-mobile-open' : ''} w-70 flex-shrink-0 sticky top-20 z-20 max-h-[calc(100vh-100px)] overflow-y-auto overflow-x-hidden rounded-2xl backdrop-blur-xl bg-opacity-80 p-4 gap-4 flex flex-col border-r border-blue-500/20 shadow-2xl m-5 ml-5`}
      style={{ 
        background: 'rgba(15, 23, 42, 0.8)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 1px rgba(59, 130, 246, 0.3)',
        animation: 'slideIn 0.3s ease-out',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Sidebar Header */}
      <div className="flex flex-row justify-between items-center pb-3 border-b border-blue-500/20">
        <div className="flex flex-row gap-2 items-center">
          <div 
            className="bg-gradient-to-br from-blue-500 to-blue-700 p-1.5 rounded-md"
            style={{ 
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            <span className="text-lg leading-none">📋</span>
          </div>
          <h3 className="text-xl font-bold text-slate-100" style={{ letterSpacing: '-0.02em' }}>
            All Items
          </h3>
        </div>
        {/* Close button for mobile */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="mobile-close-button hidden"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      {/* Main Category Buttons */}
      <div className="gap-1.5 mt-1 flex flex-col">
        <button
          data-testid="sidebar-category-all"
          onClick={() => {
            setCategory('all');
            setMobileMenuOpen(false);
          }}
          className="w-full flex flex-row gap-3 items-center justify-start text-left p-3 rounded-lg transition-all duration-200"
          style={{
            background: category === 'all' 
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
              : 'rgba(30, 41, 59, 0.6)',
            color: category === 'all' ? 'white' : '#cbd5e1',
            border: category === 'all' 
              ? '1px solid rgba(59, 130, 246, 0.5)' 
              : '1px solid rgba(51, 65, 85, 0.4)',
            transform: category === 'all' ? 'translateX(2px)' : 'translateX(0)',
            boxShadow: category === 'all' 
              ? '0 4px 12px rgba(59, 130, 246, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.1)' 
              : 'none'
          }}
          onMouseEnter={(e) => {
            if (category !== 'all') {
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
              e.currentTarget.style.transform = 'translateX(2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (category !== 'all') {
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
              e.currentTarget.style.transform = 'translateX(0)';
            }
          }}
        >
          <span className="text-xl leading-none">🎱</span>
          <span className={`text-sm ${category === 'all' ? 'font-semibold' : 'font-medium'}`}>
            All Items
          </span>
        </button>
        
        <button
          data-testid="sidebar-category-cues"
          onClick={() => {
            setCategory('cues');
          }}
          className="w-full flex flex-row gap-3 items-center justify-start text-left p-3 rounded-lg transition-all duration-200"
          style={{
            background: category === 'cues' 
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
              : 'rgba(30, 41, 59, 0.6)',
            color: category === 'cues' ? 'white' : '#cbd5e1',
            border: category === 'cues' 
              ? '1px solid rgba(59, 130, 246, 0.5)' 
              : '1px solid rgba(51, 65, 85, 0.4)',
            transform: category === 'cues' ? 'translateX(2px)' : 'translateX(0)',
            boxShadow: category === 'cues' 
              ? '0 4px 12px rgba(59, 130, 246, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.1)' 
              : 'none'
          }}
          onMouseEnter={(e) => {
            if (category !== 'cues') {
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
              e.currentTarget.style.transform = 'translateX(2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (category !== 'cues') {
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
              e.currentTarget.style.transform = 'translateX(0)';
            }
          }}
        >
          <span className="text-xl leading-none">🎯</span>
          <div className="flex flex-col">
            <span className={`text-sm ${category === 'cues' ? 'font-semibold' : 'font-medium'}`}>
              Cues
            </span>
            {category === 'cues' && (
              <span className="text-xs leading-none opacity-70">
                Pool & snooker cues
              </span>
            )}
          </div>
        </button>
        
        <button
          data-testid="sidebar-category-cases"
          onClick={() => {
            setCategory('cases');
            setMobileMenuOpen(false);
          }}
          className="w-full flex flex-row gap-3 items-center justify-start text-left p-3 rounded-lg transition-all duration-200"
          style={{
            background: category === 'cases' 
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
              : 'rgba(30, 41, 59, 0.6)',
            color: category === 'cases' ? 'white' : '#cbd5e1',
            border: category === 'cases' 
              ? '1px solid rgba(59, 130, 246, 0.5)' 
              : '1px solid rgba(51, 65, 85, 0.4)',
            transform: category === 'cases' ? 'translateX(2px)' : 'translateX(0)',
            boxShadow: category === 'cases' 
              ? '0 4px 12px rgba(59, 130, 246, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.1)' 
              : 'none'
          }}
          onMouseEnter={(e) => {
            if (category !== 'cases') {
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
              e.currentTarget.style.transform = 'translateX(2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (category !== 'cases') {
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
              e.currentTarget.style.transform = 'translateX(0)';
            }
          }}
        >
          <span className="text-xl leading-none">💼</span>
          <span className={`text-sm ${category === 'cases' ? 'font-semibold' : 'font-medium'}`}>
            Cases
          </span>
        </button>

        <button
          data-testid="sidebar-category-tables"
          onClick={() => {
            setCategory('tables');
            setMobileMenuOpen(false);
          }}
          className="w-full flex flex-row gap-3 items-center justify-start text-left p-3 rounded-lg transition-all duration-200"
          style={{
            background: category === 'tables' 
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
              : 'rgba(30, 41, 59, 0.6)',
            color: category === 'tables' ? 'white' : '#cbd5e1',
            border: category === 'tables' 
              ? '1px solid rgba(59, 130, 246, 0.5)' 
              : '1px solid rgba(51, 65, 85, 0.4)',
            transform: category === 'tables' ? 'translateX(2px)' : 'translateX(0)',
            boxShadow: category === 'tables' 
              ? '0 4px 12px rgba(59, 130, 246, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.1)' 
              : 'none'
          }}
          onMouseEnter={(e) => {
            if (category !== 'tables') {
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
              e.currentTarget.style.transform = 'translateX(2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (category !== 'tables') {
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
              e.currentTarget.style.transform = 'translateX(0)';
            }
          }}
        >
          <span className="text-xl leading-none">🪑</span>
          <span className={`text-sm ${category === 'tables' ? 'font-semibold' : 'font-medium'}`}>
            Billiard Tables
          </span>
        </button>

        <button
          data-testid="sidebar-category-accessories"
          onClick={() => {
            setCategory('accessories');
            setMobileMenuOpen(false);
          }}
          className="w-full flex flex-row gap-3 items-center justify-start text-left p-3 rounded-lg transition-all duration-200"
          style={{
            background: category === 'accessories' 
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
              : 'rgba(30, 41, 59, 0.6)',
            color: category === 'accessories' ? 'white' : '#cbd5e1',
            border: category === 'accessories' 
              ? '1px solid rgba(59, 130, 246, 0.5)' 
              : '1px solid rgba(51, 65, 85, 0.4)',
            transform: category === 'accessories' ? 'translateX(2px)' : 'translateX(0)',
            boxShadow: category === 'accessories' 
              ? '0 4px 12px rgba(59, 130, 246, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.1)' 
              : 'none'
          }}
          onMouseEnter={(e) => {
            if (category !== 'accessories') {
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
              e.currentTarget.style.transform = 'translateX(2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (category !== 'accessories') {
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
              e.currentTarget.style.transform = 'translateX(0)';
            }
          }}
        >
          <span className="text-xl leading-none">🛠️</span>
          <span className={`text-sm ${category === 'accessories' ? 'font-semibold' : 'font-medium'}`}>
            Accessories
          </span>
        </button>
      </div>

      {/* Community Section */}
      <div className="gap-1.5 mt-3 pt-3 border-t border-blue-500/20 flex flex-col">
        <div className="flex flex-row gap-2 items-center px-1 pb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            COMMUNITY
          </span>
        </div>
        <button
          data-testid="sidebar-forum"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/forum');
            setShowForumCategories(!showForumCategories);
            setMobileMenuOpen(false);
          }}
          className="w-full flex flex-row justify-between items-center text-left p-3 rounded-lg transition-all duration-200"
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            color: '#cbd5e1',
            border: '1px solid rgba(51, 65, 85, 0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
            e.currentTarget.style.transform = 'translateX(2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <div className="flex flex-row gap-3 items-center">
            <span className="text-xl leading-none">💬</span>
            <span className="text-sm font-medium">
              Forum
            </span>
          </div>
          {forumCategories.length > 0 && (
            <span 
              style={{ 
                transform: showForumCategories ? 'rotate(180deg)' : 'rotate(0)', 
                transition: 'transform 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                color: '#94a3b8',
                fontSize: '12px'
              }}
            >
              ▼
            </span>
          )}
        </button>

        {/* Forum Categories Sub-menu */}
        {showForumCategories && forumCategories.length > 0 && (
          <div 
            className="gap-0.5 mt-2 ml-2 mr-1 pl-4 pr-2 pt-1 pb-1 rounded-sm border-l-4"
            style={{
              borderColor: 'rgba(139, 92, 246, 0.5)',
              background: 'rgba(139, 92, 246, 0.08)',
              animation: 'slideDown 0.3s ease-out',
              backdropFilter: 'blur(10px)'
            }}
          >
            <span className="text-xs font-semibold uppercase leading-none pl-0 block mb-1" style={{ color: '#a78bfa', letterSpacing: '0.05em' }}>
              Categories
            </span>
            
            {/* All Categories View Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/forum');
                setMobileMenuOpen(false);
              }}
              className="w-full flex flex-row gap-2 items-center justify-start text-left p-2.5 rounded text-sm transition-all mb-1.5"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
                color: '#e0e7ff',
                border: '1px solid rgba(139, 92, 246, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
              }}
            >
              <span style={{ color: '#a78bfa', fontWeight: 700 }}>📋</span>
              <span className="font-semibold" style={{ color: 'inherit' }}>
                All Categories
              </span>
            </button>
            
            {/* Individual Categories */}
            {forumCategories.map(forumCat => (
              <button
                key={forumCat.id}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/forum', { state: { selectedCategory: forumCat } });
                  setMobileMenuOpen(false);
                }}
                className="w-full flex flex-row gap-2 items-center justify-start text-left p-2.5 rounded text-sm transition-all"
                style={{
                  background: 'transparent',
                  color: '#cbd5e1',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.paddingLeft = '16px';
                  e.currentTarget.style.color = '#e0e7ff';
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.paddingLeft = '12px';
                  e.currentTarget.style.color = '#cbd5e1';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ color: '#8b5cf6', fontWeight: 600 }}>→</span>
                <span style={{ color: 'inherit' }}>
                  {forumCat.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cue Type Sub-filters - Only show when Cues category is selected */}
      {category === 'cues' && (
        <div className="gap-1.5 mt-3 pt-3 border-t border-blue-500/20 flex flex-col">
          <div className="flex flex-row gap-2 items-center px-1 pb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              CUE TYPE
            </span>
          </div>
          
          <button
            data-testid="cue-type-all"
            onClick={() => {
              setCueType('all');
              setMobileMenuOpen(false);
            }}
            className="w-full flex flex-row items-center justify-start text-left px-3 py-2.5 rounded-lg text-sm transition-all"
            style={{
              background: cueType === 'all' 
                ? 'rgba(59, 130, 246, 0.25)' 
                : 'transparent',
              color: cueType === 'all' ? '#60a5fa' : '#94a3b8',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              if (cueType !== 'all') {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                e.currentTarget.style.color = '#cbd5e1';
              }
            }}
            onMouseLeave={(e) => {
              if (cueType !== 'all') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            <span className={cueType === 'all' ? 'font-semibold' : 'font-normal'}>
              All Types
            </span>
          </button>
          
          <button
            data-testid="cue-type-playing"
            onClick={() => {
              setCueType('playing');
              setMobileMenuOpen(false);
            }}
            className="w-full flex flex-row gap-2.5 items-center justify-start text-left px-3 py-2.5 rounded-lg text-sm transition-all"
            style={{
              background: cueType === 'playing' 
                ? 'rgba(59, 130, 246, 0.25)' 
                : 'transparent',
              color: cueType === 'playing' ? '#60a5fa' : '#94a3b8',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              if (cueType !== 'playing') {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                e.currentTarget.style.color = '#cbd5e1';
              }
            }}
            onMouseLeave={(e) => {
              if (cueType !== 'playing') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            <span className="text-base">🎯</span>
            <span className={cueType === 'playing' ? 'font-semibold' : 'font-normal'}>
              Playing Cue
            </span>
          </button>
          
          <button
            data-testid="cue-type-break"
            onClick={() => {
              setCueType('break');
              setMobileMenuOpen(false);
            }}
            className="w-full flex flex-row gap-2.5 items-center justify-start text-left px-3 py-2.5 rounded-lg text-sm transition-all"
            style={{
              background: cueType === 'break' 
                ? 'rgba(59, 130, 246, 0.25)' 
                : 'transparent',
              color: cueType === 'break' ? '#60a5fa' : '#94a3b8',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              if (cueType !== 'break') {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                e.currentTarget.style.color = '#cbd5e1';
              }
            }}
            onMouseLeave={(e) => {
              if (cueType !== 'break') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            <span className="text-base">💥</span>
            <span className={cueType === 'break' ? 'font-semibold' : 'font-normal'}>
              Break Cue
            </span>
          </button>
          
          <button
            data-testid="cue-type-jump"
            onClick={() => {
              setCueType('jump');
              setMobileMenuOpen(false);
            }}
            className="w-full flex flex-row gap-2.5 items-center justify-start text-left px-3 py-2.5 rounded-lg text-sm transition-all"
            style={{
              background: cueType === 'jump' 
                ? 'rgba(59, 130, 246, 0.25)' 
                : 'transparent',
              color: cueType === 'jump' ? '#60a5fa' : '#94a3b8',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              if (cueType !== 'jump') {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                e.currentTarget.style.color = '#cbd5e1';
              }
            }}
            onMouseLeave={(e) => {
              if (cueType !== 'jump') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            <span className="text-base">🚀</span>
            <span className={cueType === 'jump' ? 'font-semibold' : 'font-normal'}>
              Jump Cue
            </span>
          </button>
        </div>
      )}

    </div>
  );
}

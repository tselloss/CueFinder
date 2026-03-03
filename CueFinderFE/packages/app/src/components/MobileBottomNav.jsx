import React from 'react';
import { Home, Ticket, Plus, Mail, Menu, User, LogIn } from 'lucide-react';

/**
 * Sticky bottom navigation bar — only visible on mobile (md:hidden).
 *
 * Tabs (authenticated):
 *   Home | Raffles | [+Sell center] | Inbox(badge) | Menu / Profile
 *
 * Tabs (unauthenticated):
 *   Home | Raffles | [Sign In center] | Forum | Menu
 *
 * The 5th tab behaviour:
 *   - on pages that have a sidebar (home / raffles / forum): shows ☰ and toggles the drawer
 *   - on other pages: shows 👤 and navigates to /profile
 */
export default function MobileBottomNav({
  currentPath,
  onNavigate,
  unreadCount = 0,
  user,
  onToggleSidebar,
  showSidebar,
  onAddListing,
}) {
  const isActive = (path) =>
    path === '/' ? currentPath === '/' : currentPath.startsWith(path);

  /* ── reusable tab button ── */
  const Tab = ({ onClick, icon: Icon, label, badge, active }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-colors active:opacity-70 ${
        active ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[10px] font-bold px-0.5 leading-none">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium leading-none mt-0.5">{label}</span>
    </button>
  );

  /* ── center add / sign-in button ── */
  const CenterBtn = () =>
    user ? (
      <button
        onClick={onAddListing}
        className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 active:opacity-70"
        aria-label="Add listing"
      >
        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 -mt-3 transition-transform active:scale-95">
          <Plus className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-medium text-muted-foreground leading-none">Sell</span>
      </button>
    ) : (
      <Tab
        onClick={() => onNavigate('/login')}
        icon={LogIn}
        label="Sign In"
        active={isActive('/login')}
      />
    );

  /* ── 5th tab: sidebar toggle on sidebar pages, profile otherwise ── */
  const LastTab = () =>
    showSidebar ? (
      <Tab onClick={onToggleSidebar} icon={Menu} label="Menu" active={false} />
    ) : (
      <Tab
        onClick={() => onNavigate('/profile')}
        icon={User}
        label="Profile"
        active={isActive('/profile')}
      />
    );

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-14">
        <Tab
          onClick={() => onNavigate('/')}
          icon={Home}
          label="Home"
          active={isActive('/')}
        />
        <Tab
          onClick={() => onNavigate('/raffles')}
          icon={Ticket}
          label="Raffles"
          active={isActive('/raffles')}
        />
        <CenterBtn />
        {user ? (
          <Tab
            onClick={() => onNavigate('/inbox')}
            icon={Mail}
            label="Inbox"
            badge={unreadCount}
            active={isActive('/inbox')}
          />
        ) : (
          <Tab
            onClick={() => onNavigate('/forum')}
            icon={Mail}
            label="Forum"
            active={isActive('/forum')}
          />
        )}
        <LastTab />
      </div>
    </nav>
  );
}

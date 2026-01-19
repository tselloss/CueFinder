import React, { useState } from 'react';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import { Mail, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu.jsx';

export default function AppHeader({ title = 'CueFinder', user, unreadCount = 0, onNavigate, onLogout, currentPath = '/' }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Forum', path: '/forum' },
    { label: 'Inbox', path: '/inbox', requiresAuth: true }
  ];

  // Handle mobile menu toggle - close dropdown if open
  const handleMobileToggle = () => {
    if (dropdownOpen) setDropdownOpen(false);
    setMobileOpen(v => !v);
  };

  // Handle dropdown toggle - close mobile menu if open
  const handleDropdownChange = (open) => {
    if (open && mobileOpen) setMobileOpen(false);
    setDropdownOpen(open);
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border-b border-border z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="font-bold tracking-tight text-foreground text-lg sm:text-xl whitespace-nowrap">🎱 {title}</h2>
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.filter(l => !l.requiresAuth || user).map(link => {
              const active = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
              return (
                <Button
                  key={link.path}
                  variant={active ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onNavigate && onNavigate(link.path)}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                </Button>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 rounded-md border border-primary/40 bg-background/60 backdrop-blur px-2 py-1">
                <span className="text-xl">{user.avatar || '👤'}</span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{user.name}</div>
                  {user.role === 'admin' && (
                    <div className="text-xs text-primary font-medium leading-none">Admin</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="default" size="sm" onClick={() => onNavigate && onNavigate('/inbox')} className="relative hidden sm:inline-flex">
                  <Mail className="mr-2 h-4 w-4" /> Inbox
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 rounded-full unread-badge">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>

                <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownChange} modal={true}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 z-[60]">
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      setDropdownOpen(false);
                      setMobileOpen(false);
                      onNavigate && onNavigate('/profile');
                    }}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => {
                        setDropdownOpen(false);
                        setMobileOpen(false);
                        onNavigate && onNavigate('/admin');
                      }}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      setDropdownOpen(false);
                      setMobileOpen(false);
                      onLogout && onLogout();
                    }} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  aria-label="Toggle menu"
                  onClick={handleMobileToggle}
                >
                  <span className="inline-block w-5 h-5">☰</span>
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="default" size="sm" onClick={() => onNavigate && onNavigate('/login')}>Sign In</Button>
              <Button variant="outline" size="sm" onClick={() => onNavigate && onNavigate('/register')}>Register</Button>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                aria-label="Toggle menu"
                onClick={handleMobileToggle}
              >
                <span className="inline-block w-5 h-5">☰</span>
              </Button>
            </>
          )}
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden absolute left-0 right-0 top-full border-t border-border bg-background shadow-lg">
          <div className="px-4 py-3 flex flex-col gap-2">
            {navLinks.filter(l => !l.requiresAuth || user).map(link => {
              const active = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
              return (
                <Button
                  key={link.path}
                  variant={active ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    onNavigate && onNavigate(link.path);
                    setMobileOpen(false);
                  }}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

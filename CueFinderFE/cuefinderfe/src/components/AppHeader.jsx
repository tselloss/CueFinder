import React from 'react';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import { Mail, LogOut, User as UserIcon, Shield } from 'lucide-react';

export default function AppHeader({ title = 'CueFinder', user, unreadCount = 0, onNavigate, onLogout }) {
  return (
    <header className="w-full bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="font-bold tracking-tight text-foreground text-lg sm:text-xl whitespace-nowrap">🎱 {title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-background/60 backdrop-blur px-2 py-1">
                <span className="text-xl">{user.avatar || '👤'}</span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{user.name}</div>
                  {user.role === 'admin' && (
                    <div className="text-xs text-primary font-medium leading-none">Admin</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="default" size="sm" onClick={() => onNavigate && onNavigate('/inbox')} className="relative">
                  <Mail className="mr-2 h-4 w-4" /> Inbox
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 rounded-full unread-badge">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={() => onNavigate && onNavigate('/profile')}>
                  <UserIcon className="mr-2 h-4 w-4" /> Profile
                </Button>
                {user.role === 'admin' && (
                  <Button variant="outline" size="sm" onClick={() => onNavigate && onNavigate('/admin')}>
                    <Shield className="mr-2 h-4 w-4" /> Admin
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => onLogout && onLogout()}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="default" size="sm" onClick={() => onNavigate && onNavigate('/login')}>Sign In</Button>
              <Button variant="outline" size="sm" onClick={() => onNavigate && onNavigate('/register')}>Register</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

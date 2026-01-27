import React from 'react';

export default function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full bg-background border-t border-border/50 mt-auto">
      <div className="container mx-auto px-4 py-2 text-center text-xs">
        <div className="text-xs font-semibold text-foreground">🎱 CueFinder</div>
        <div className="text-xs text-muted-foreground">Premium Billiard Cue Marketplace</div>
        <div className="flex items-center justify-center gap-2 mt-1 text-xs">
          <span className="text-muted-foreground">© {year} CueFinder</span>
          <span className="text-muted-foreground">•</span>
          <button className="text-primary hover:underline" type="button">Privacy</button>
          <span className="text-muted-foreground">•</span>
          <button className="text-primary hover:underline" type="button">Terms</button>
        </div>
      </div>
    </footer>
  );
}

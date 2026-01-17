import React from 'react';

export default function AppFooter() {
  return (
    <footer className="w-full bg-background border-t border-border mt-8">
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-base font-semibold text-foreground">🎱 CueFinder</div>
        <div className="text-sm text-muted-foreground">Your Premium Billiard Cue Marketplace</div>
        <div className="flex items-center justify-center gap-3 mt-3 text-sm">
          <span className="text-muted-foreground">© 2026 CueFinder</span>
          <span className="text-muted-foreground">•</span>
          <button className="text-primary hover:underline" type="button">Privacy Policy</button>
          <span className="text-muted-foreground">•</span>
          <button className="text-primary hover:underline" type="button">Terms of Service</button>
        </div>
      </div>
    </footer>
  );
}

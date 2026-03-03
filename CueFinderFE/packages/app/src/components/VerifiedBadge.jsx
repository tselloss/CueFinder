import React from 'react';
import { BadgeCheck } from 'lucide-react';

export default function VerifiedBadge({ isVerified, size = 'sm' }) {
  if (!isVerified) return null;

  const sizeClass = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <span
      title="Verified Seller"
      className="inline-flex items-center text-amber-500 shrink-0"
    >
      <BadgeCheck className={sizeClass} />
    </span>
  );
}

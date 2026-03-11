import { useState, useEffect } from 'react';

/**
 * useListingPrompt
 * Determines if a listing should show the prompt (based on props or backend data)
 * @param {object} listing - The listing object (should include lastPromptedAt, lastUserResponseAt, isHidden, etc.)
 * @returns [showPrompt, setShowPrompt]
 */
export default function useListingPrompt(listing) {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!listing) return;
    // Example logic: show prompt if not hidden, and needs re-confirmation
    // (You may want to adjust this logic based on your backend rules)
    if (!listing.isHidden && listing.lastPromptedAt && (!listing.lastUserResponseAt || listing.lastUserResponseAt < listing.lastPromptedAt)) {
      // Only show if last prompt was over 2 months ago
      const lastPrompt = new Date(listing.lastPromptedAt);
      const now = new Date();
      const diffDays = (now - lastPrompt) / (1000 * 60 * 60 * 24);
      if (diffDays >= 60) {
        setShowPrompt(true);
      } else {
        setShowPrompt(false);
      }
    } else {
      setShowPrompt(false);
    }
  }, [listing]);

  return [showPrompt, setShowPrompt];
}

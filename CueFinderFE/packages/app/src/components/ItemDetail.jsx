import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Mail,
  Phone,
  ImageIcon,
  Send,
  Gavel,
  TrendingDown,
  Star
} from 'lucide-react';
import { API_BASE_URL, SITE_BASE_URL } from '../config/apiConfig';
import * as messageService from '../api/messageService';
import * as sellerService from '../api/sellerService';
import { useAuth } from '../auth/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import VerifiedBadge from './VerifiedBadge';
import ReviewModal from './ReviewModal';

// Helper to get full image URL from image object
const getImageUrl = (img) => {
  if (!img) return '';
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  if (url.startsWith('/uploads/')) return `${SITE_BASE_URL}${url}`;
  return `${API_BASE_URL}${url}`;
};

// Image placeholder component
const ImagePlaceholder = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
    <ImageIcon className="w-16 h-16 text-muted-foreground/40" />
    <p className="text-sm text-muted-foreground mt-2">No Image</p>
  </div>
);

export default function ItemDetail({
  item,
  itemType = 'cue',
  onBack,
  specifications = []
}) {
  const { user } = useAuth();
  const [imageIndex, setImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Review state
  const [showReview, setShowReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isEligibleToReview, setIsEligibleToReview] = useState(false);

  useEffect(() => {
    if (user && item?.sellerId && item?.id && (item.isSold || item.is_sold) && user.id !== item.sellerId) {
      sellerService.checkMyReview(item.sellerId, itemType, item.id)
        .then(data => {
          setHasReviewed(data.hasReviewed);
          setIsEligibleToReview(data.isEligible);
        })
        .catch(() => {});
    }
  }, [user, item, itemType]);

  // Bid state
  const [showBid, setShowBid] = useState(false);
  const [bidAmount, setBidAmount] = useState(0);
  const [bidNote, setBidNote] = useState('');
  const [bidSending, setBidSending] = useState(false);
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState(false);

  useEffect(() => {
    if (item) {
      const defaultSubject = item.title ? `Inquiry about ${item.title}` : 'Message about your listing';
      setMessageSubject(defaultSubject);
      const minBidVal = Math.ceil((item.price || 0) * 0.75 * 100) / 100;
      setBidAmount(minBidVal);
    }
  }, [item]);

  const minBid = item ? Math.ceil((item.price || 0) * 0.75 * 100) / 100 : 0;
  const discountPct = item ? Math.round((1 - bidAmount / (item.price || 1)) * 100) : 0;

  const handlePlaceBid = async () => {
    if (!user) { setShowLoginPrompt(true); return; }
    if (!item?.sellerId) { setBidError('Missing seller information.'); return; }
    if (bidAmount < minBid || bidAmount > (item.price || 0)) {
      setBidError(`Bid must be between €${minBid.toFixed(2)} and €${(item.price || 0).toFixed(2)}.`);
      return;
    }
    setBidSending(true);
    setBidError('');
    setBidSuccess(false);
    try {
      await messageService.sendOffer({
        recipientId: item.sellerId,
        itemId: item.id,
        bidAmount,
        originalPrice: item.price,
        itemTitle: `${item.brand || ''} ${item.title || ''}`.trim(),
        personalNote: bidNote,
      });
      setBidSuccess(true);
      setBidNote('');
      setTimeout(() => { setShowBid(false); setBidSuccess(false); }, 1800);
    } catch (err) {
      setBidError(err?.response?.data?.message || err?.message || 'Failed to send bid. Please try again.');
    } finally {
      setBidSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    if (!item || !item.sellerId) {
      setSendError('Missing seller information.');
      return;
    }
    if (!messageBody.trim()) {
      setSendError('Please enter a message.');
      return;
    }

    setSending(true);
    setSendError('');
    setSendSuccess(false);

    try {
      console.log('📤 Sending message to seller:', item.sellerId);
      await messageService.sendMessage({
        recipientId: item.sellerId,
        cueId: item.id,
        subject: messageSubject || 'Message',
        content: messageBody,
        messageType: 'inquiry'
      });
      console.log('✅ Message sent successfully');
      setSendSuccess(true);
      setMessageBody('');
      setMessageSubject('');
      setTimeout(() => {
        setShowMessage(false);
      }, 1500);
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to send message. Please try again.';
      setSendError(msg);
    } finally {
      setSending(false);
    }
  };

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const images = item.images && item.images.length > 0 ? item.images : [];
  const hasImages = images.length > 0;
  const currentImage = hasImages ? getImageUrl(images[imageIndex]) : '';

  const nextImage = () => {
    setImageIndex((i) => (i + 1) % images.length);
  };

  const prevImage = () => {
    setImageIndex((i) => (i - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="p-4 md:p-6">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listings
        </Button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Image Section */}
          <div className="order-1">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-[4/3] bg-card">
                  {hasImages ? (
                    <>
                      <img
                        src={currentImage}
                        alt={`${item.brand} ${item.title}`}
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setIsFullscreen(true)}
                      />
                      {images.length > 1 && (
                        <>
                          {/* Navigation Arrows */}
                          <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={prevImage}
                              className="pointer-events-auto rounded-full w-10 h-10 md:w-12 md:h-12 bg-background/90 hover:bg-background shadow-lg backdrop-blur-sm"
                            >
                              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={nextImage}
                              className="pointer-events-auto rounded-full w-10 h-10 md:w-12 md:h-12 bg-background/90 hover:bg-background shadow-lg backdrop-blur-sm"
                            >
                              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                            </Button>
                          </div>
                          {/* Image Indicators */}
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                            {images.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setImageIndex(idx)}
                                className={`w-1 h-1 rounded-full transition-all ${
                                  idx === imageIndex 
                                    ? 'bg-primary w-4' 
                                    : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <ImagePlaceholder />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <div className="order-2 space-y-6">
            {/* Title & Price */}
            <div>
              <div className="flex items-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
                  {item.brand} {item.title}
                </h1>
                {(item.isSold || item.is_sold) && (
                  <span className="px-3 py-1 bg-destructive text-destructive-foreground text-sm font-bold rounded-md">
                    SOLD
                  </span>
                )}
              </div>
              <p className="text-4xl md:text-5xl font-bold text-primary">
                €{(item.price || 0).toFixed(2)}
              </p>
            </div>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  {itemType === 'case' ? 'Case Specifications' : 'Specifications'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {specifications.map((spec, idx) => spec.value && (
                    <div 
                      key={idx}
                      className="flex justify-between items-center pb-3 border-b border-border last:border-0 last:pb-0"
                    >
                      <span className="font-semibold text-foreground">{spec.label}</span>
                      {spec.highlight ? (
                        <span className={`px-3 py-1 rounded-md text-sm font-medium ${
                          spec.value === 'New' 
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          {spec.value}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{spec.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {item.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Seller Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <CardTitle className="text-xl">Seller Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(item.sellerName || item.seller_name) && (
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <Link
                        to={`/sellers/${item.sellerId}`}
                        className="text-foreground hover:text-primary hover:underline font-medium flex items-center gap-1.5"
                      >
                        {item.sellerName || item.seller_name}
                        <VerifiedBadge isVerified={item.sellerIsVerified} />
                      </Link>
                    </div>
                  )}
                  {(item.sellerEmail || item.seller_email) && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{item.sellerEmail || item.seller_email}</span>
                    </div>
                  )}
                  {(item.sellerPhone || item.seller_phone) && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {(item.sellerHidePhone || item.seller_hidePhone) ? (
                        <span className="px-3 py-1 bg-muted rounded blur-sm select-none">
                          {item.sellerPhone || item.seller_phone}
                        </span>
                      ) : (
                        <span className="text-foreground">{item.sellerPhone || item.seller_phone}</span>
                      )}
                    </div>
                  )}
                  {item.sellerId && (
                    <div className="pt-3 space-y-2">
                      <Button
                        onClick={() => {
                          if (!user) {
                            setShowLoginPrompt(true);
                          } else {
                            setSendError('');
                            setSendSuccess(false);
                            setShowMessage(true);
                          }
                        }}
                        className="w-full gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Message Seller
                      </Button>
                      {user && user.id !== item.sellerId && !(item.isSold || item.is_sold) && (
                        <Button
                          variant="outline"
                          onClick={() => { setBidError(''); setBidSuccess(false); setShowBid(true); }}
                          className="w-full gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                        >
                          <Gavel className="w-4 h-4" />
                          Place a Bid
                        </Button>
                      )}
                      {user && user.id !== item.sellerId && (item.isSold || item.is_sold) && isEligibleToReview && (
                        <Button
                          variant="outline"
                          onClick={() => setShowReview(true)}
                          disabled={hasReviewed}
                          className="w-full gap-2"
                        >
                          <Star className="w-4 h-4" />
                          {hasReviewed ? 'Review Submitted' : 'Leave a Review'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      {isFullscreen && hasImages && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
          <img
            src={currentImage}
            alt={`${item.brand} ${item.title}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
          {images.length > 1 && (
            <>
              <div className="absolute inset-0 flex items-center justify-between px-4 md:px-8 pointer-events-none">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={prevImage}
                  className="pointer-events-auto rounded-full w-12 h-12 md:w-14 md:h-14 bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md"
                >
                  <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={nextImage}
                  className="pointer-events-auto rounded-full w-12 h-12 md:w-14 md:h-14 bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md"
                >
                  <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                </Button>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-lg backdrop-blur-sm">
                <span className="text-white font-medium">{imageIndex + 1} / {images.length}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Message Modal */}
      {showMessage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Message the Seller</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowMessage(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {sendError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{sendError}</p>
                </div>
              )}
              {sendSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                  <p className="text-sm text-green-500">Message sent successfully!</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  rows={6}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowMessage(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={sending}
                  className="gap-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bid Modal */}
      {showBid && item && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-amber-500" />
                  <CardTitle>Place a Bid</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowBid(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Price info */}
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">Asking price</div>
                <div className="text-lg font-bold text-foreground">€{(item.price || 0).toFixed(2)}</div>
              </div>

              {/* Bid amount */}
              <div className="space-y-2">
                <Label>Your bid</Label>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-medium">€</span>
                  <input
                    type="number"
                    min={minBid}
                    max={item.price || 0}
                    step={0.01}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Math.min(item.price || 0, Math.max(minBid, parseFloat(e.target.value) || minBid)))}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-lg font-bold text-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  {discountPct > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-md text-sm font-medium whitespace-nowrap">
                      <TrendingDown className="w-3 h-3" />
                      -{discountPct}%
                    </span>
                  )}
                </div>
                <input
                  type="range"
                  min={minBid}
                  max={item.price || 0}
                  step={0.5}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Min: €{minBid.toFixed(2)} (−25%)</span>
                  <span>Max: €{(item.price || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Optional note */}
              <div className="space-y-2">
                <Label htmlFor="bid-note">Note to seller (optional)</Label>
                <textarea
                  id="bid-note"
                  value={bidNote}
                  onChange={(e) => setBidNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. I can pick up in person..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {bidError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{bidError}</p>
                </div>
              )}
              {bidSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                  <p className="text-sm text-green-500">Bid sent! The seller will respond in your inbox.</p>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowBid(false)}>Cancel</Button>
                <Button
                  onClick={handlePlaceBid}
                  disabled={bidSending}
                  className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {bidSending ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Sending...</>
                  ) : (
                    <><Gavel className="w-4 h-4" />Send Bid</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        sellerId={item?.sellerId}
        sellerName={item?.sellerName || item?.seller_name}
        listingType={itemType}
        listingId={item?.id}
        onSubmitted={() => setHasReviewed(true)}
      />

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Sign In Required</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowLoginPrompt(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                You need to be registered and signed in to send messages to sellers.
              </p>
              <p className="text-sm text-muted-foreground">
                Please sign in or create an account to contact sellers about their listings.
              </p>
              <div className="flex justify-end">
                <Button onClick={() => setShowLoginPrompt(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

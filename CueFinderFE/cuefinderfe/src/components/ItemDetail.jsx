import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  User, 
  Mail, 
  Phone, 
  ImageIcon,
  Send
} from 'lucide-react';
import { API_BASE_URL, SITE_BASE_URL } from '../config/apiConfig';
import * as messageService from '../api/messageService';
import { useAuth } from '../auth/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

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

  useEffect(() => {
    if (item) {
      const defaultSubject = item.title ? `Inquiry about ${item.title}` : 'Message about your listing';
      setMessageSubject(defaultSubject);
    }
  }, [item]);

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
                                className={`w-2 h-2 rounded-full transition-all ${
                                  idx === imageIndex 
                                    ? 'bg-primary w-8' 
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
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
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
                {!(item.sellerName || item.seller_name || item.sellerEmail || item.seller_email || item.sellerPhone || item.seller_phone) ? (
                  <p className="text-muted-foreground">Not provided</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{item.sellerName || item.seller_name || 'Name not provided'}</span>
                    </div>
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
                      <div className="pt-3">
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
                      </div>
                    )}
                  </div>
                )}
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

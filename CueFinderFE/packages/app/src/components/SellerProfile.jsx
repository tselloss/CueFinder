import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Calendar, Package, ShoppingBag } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import VerifiedBadge from './VerifiedBadge';
import * as sellerService from '../api/sellerService';
import { API_BASE_URL, SITE_BASE_URL } from '../config/apiConfig';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  if (url.startsWith('/uploads/')) return `${SITE_BASE_URL}${url}`;
  return `${API_BASE_URL}${url}`;
};

const listingPath = (type, id) => {
  const paths = { cue: '/cue', case: '/case', table: '/table', accessory: '/accessory' };
  return `${paths[type] || '/cue'}/${id}`;
};

function StarDisplay({ value, count }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`}
        />
      ))}
      <span className="text-sm font-medium">{value > 0 ? value.toFixed(1) : '—'}</span>
      {count > 0 && <span className="text-sm text-muted-foreground">({count})</span>}
    </div>
  );
}

function ListingCard({ listing }) {
  const img = getImageUrl(listing.imageUrl);
  return (
    <Link to={listingPath(listing.listingType, listing.id)} className="block group">
      <Card className="overflow-hidden hover:border-primary/50 transition-colors h-full">
        <div className="aspect-[4/3] bg-muted overflow-hidden">
          {img ? (
            <img src={img} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <p className="font-semibold text-sm truncate">{listing.brand} {listing.title}</p>
          <p className="text-primary font-bold text-sm mt-0.5">€{listing.price.toFixed(2)}</p>
          <Badge variant="secondary" className="mt-1 text-xs capitalize">{listing.listingType}</Badge>
        </CardContent>
      </Card>
    </Link>
  );
}

function RaffleCard({ raffle }) {
  const img = getImageUrl(raffle.itemImageUrl);
  return (
    <Link to={`/raffles/${raffle.id}`} className="block group">
      <Card className="overflow-hidden hover:border-primary/50 transition-colors h-full">
        <div className="aspect-[4/3] bg-muted overflow-hidden">
          {img ? (
            <img src={img} alt={raffle.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <p className="font-semibold text-sm truncate">{raffle.title}</p>
          <p className="text-primary font-bold text-sm mt-0.5">€{raffle.pricePerSpot.toFixed(2)} / spot</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={raffle.status === 'open' ? 'success' : 'secondary'} className="text-xs capitalize">
              {raffle.status}
            </Badge>
            <span className="text-xs text-muted-foreground">{raffle.totalSpots} spots</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ReviewCard({ review }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{review.reviewerName}</span>
              {review.listingTitle && (
                <span className="text-xs text-muted-foreground truncate">· {review.listingTitle}</span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= review.ratingValue ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
              ))}
            </div>
            {review.reviewText && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.reviewText}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {new Date(review.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SellerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    sellerService.getSellerProfile(id)
      .then(data => { setProfile(data); setLoading(false); })
      .catch(err => {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          navigate('/login');
        } else if (status === 404) {
          setError('Seller not found.');
        } else {
          setError('Failed to load profile. Please try again.');
        }
        setLoading(false);
      });
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">{error || 'Seller not found.'}</p>
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" />Go back</Button>
      </div>
    );
  }

  const memberYear = new Date(profile.memberSince).getFullYear();

  return (
    <div className="min-h-screen bg-background">
      {/* Back button */}
      <div className="p-4 md:p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="container mx-auto px-4 pb-10 max-w-5xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl shrink-0">
                🎱
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                  <VerifiedBadge isVerified={profile.isVerified} size="lg" />
                  {profile.isVerified && (
                    <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs">
                      Verified Seller
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {(profile.city || profile.country) && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Member since {memberYear}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <StarDisplay value={profile.averageRating} count={profile.reviewCount} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="active">
          <TabsList className="mb-4 flex-wrap h-auto">
            <TabsTrigger value="active">
              Active Listings
              {profile.activeListings.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-xs">{profile.activeListings.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sold">
              Sold
              {profile.soldListings.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-xs">{profile.soldListings.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="raffles">
              Raffles
              {profile.raffles.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-xs">{profile.raffles.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews
              {profile.reviewCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-xs">{profile.reviewCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Active Listings */}
          <TabsContent value="active">
            {profile.activeListings.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No active listings.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {profile.activeListings.map(l => <ListingCard key={`${l.listingType}-${l.id}`} listing={l} />)}
              </div>
            )}
          </TabsContent>

          {/* Sold Listings */}
          <TabsContent value="sold">
            {profile.soldListings.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No sold listings.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {profile.soldListings.map(l => <ListingCard key={`${l.listingType}-${l.id}`} listing={l} />)}
              </div>
            )}
          </TabsContent>

          {/* Raffles */}
          <TabsContent value="raffles">
            {profile.raffles.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No raffles organized.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {profile.raffles.map(r => <RaffleCard key={r.id} raffle={r} />)}
              </div>
            )}
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews">
            {profile.reviews.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {profile.reviews.map(r => <ReviewCard key={r.id} review={r} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

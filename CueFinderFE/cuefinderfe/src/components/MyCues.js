import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import * as cueService from '../api/cueService';
import * as cueCaseService from '../api/cueCaseService';
import CueFormModal from './CueFormModal.jsx';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { API_BASE_URL, SITE_BASE_URL } from '../config/apiConfig';

// Helper to get full image URL from image object
const getImageUrl = (img) => {
  if (!img) return '/placeholder.png';
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '/placeholder.png';
  // If data URI (base64) or absolute URL, use as-is
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  // Uploaded files are served at /uploads/* on the public site (proxied to backend)
  if (url.startsWith('/uploads/')) return `${SITE_BASE_URL}${url}`;
  // If relative URL, prepend API base
  return `${API_BASE_URL}${url}`;
};

export default function MyCues() {
  const [myListings, setMyListings] = useState([]); // cues + cases
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCue, setEditingCue] = useState(null);
  const [message, setMessage] = useState(null);

  const loadMyCues = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching my listings from API...');
      const [cues, cases] = await Promise.all([
        cueService.getMyCues(),
        cueCaseService.getMyCueCases()
      ]);
      const cuesWithCategory = (cues || []).map(c => ({ ...c, category: 'cue' }));
      const casesWithCategory = (cases || []).map(cs => ({ ...cs, category: 'case' }));
      const combined = [...cuesWithCategory, ...casesWithCategory];
      console.log('Received listings:', { cues: cuesWithCategory.length, cases: casesWithCategory.length, total: combined.length });
      setMyListings(combined);
    } catch (error) {
      console.error('Error loading my cues:', error);
      showMessage('error', '❌ Unable to load your listings. Please refresh the page or try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyCues();
  }, [loadMyCues]);

  // loadMyCues defined above with useCallback

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleCreateNew = () => {
    setEditingCue(null);
    setShowCreateModal(true);
  };

  const handleEdit = (cue) => {
    setEditingCue(cue);
    setShowCreateModal(true);
  };

  const handleDelete = async (item) => {
    const itemType = item.category === 'case' ? 'case' : 'cue';
    if (!window.confirm(`⚠️ Delete ${itemType} listing?\n\nThis will permanently remove your listing and cannot be undone.`)) {
      return;
    }

    try {
      if (item.category === 'case') {
        await cueCaseService.deleteCueCase(item.id);
      } else {
        await cueService.deleteCue(item.id);
      }
      setMyListings(myListings.filter(c => c.id !== item.id));
      showMessage('success', `✅ Your ${itemType} listing has been deleted successfully`);
    } catch (error) {
      showMessage('error', `❌ Unable to delete your ${itemType} listing. Please try again.`);
    }
  };

  const handleToggleSold = async (item) => {
    try {
      let updated;
      if (item.category === 'case') {
        updated = await cueCaseService.updateCueCase(item.id, {
          isSold: !item.isSold
        });
      } else {
        updated = await cueService.updateCue(item.id, {
          isSold: !item.isSold
        });
      }
      setMyListings(myListings.map(c => c.id === item.id ? { ...updated, category: item.category } : c));
      showMessage('success', `✅ Listing marked as ${!item.isSold ? 'sold' : 'available'}`);
    } catch (error) {
      showMessage('error', '❌ Unable to update listing status. Please try again.');
    }
  };

  const handleSaveCue = async () => {
    setShowCreateModal(false);
    setEditingCue(null);
    await loadMyCues();
    showMessage('success', editingCue ? '✅ Your listing has been updated successfully' : '✅ Your new listing has been created successfully');
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingCue(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading your listings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold">📋 My Listings</h2>
        <Button
          onClick={handleCreateNew}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all h-10 px-4 text-sm sm:text-base font-semibold w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Add New Listing</span><span className="sm:hidden">Add Listing</span>
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-500/10 border-green-500/20 text-green-600'
            : 'bg-red-500/10 border-red-500/20 text-red-600'
        }`}>
          <p className="font-medium">{message.type === 'success' ? '✅ ' : '⚠️ '}{message.text}</p>
        </div>
      )}

      {myListings.length === 0 ? (
        <Card className="border-2 border-dashed border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-lg text-muted-foreground text-center">
              You haven't created any listings yet.
            </p>
            <Button
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all h-10 px-4 text-sm sm:text-base font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add New Listing</span><span className="sm:hidden">Add Listing</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myListings.map(item => (
            <CueCard
              key={item.id}
              cue={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
              onToggleSold={() => handleToggleSold(item)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CueFormModal
          cue={editingCue}
          onClose={handleCloseModal}
          onSave={handleSaveCue}
        />
      )}
    </div>
  );
}

function CueCard({ cue, onEdit, onDelete, onToggleSold }) {
  const primaryImage = cue.images?.find(img => img.isPrimary) || cue.images?.[0];
  const imageUrl = getImageUrl(primaryImage);

  return (
    <Card className={`overflow-hidden transition-opacity ${cue.isSold ? 'opacity-70' : ''}`}>
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={cue.title || cue.brand}
          className="w-full h-full object-cover"
          onError={(e) => e.target.src = '/placeholder.png'}
        />
        
        {/* Category Badge */}
        {cue.category && (
          <Badge className="absolute top-3 left-3 bg-blue-600">
            {cue.category === 'case' ? 'Case' : 'Cue'}
          </Badge>
        )}
        
        {/* Sold Badge */}
        {cue.isSold && (
          <Badge className="absolute top-3 right-3 bg-red-600">
            SOLD
          </Badge>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg truncate">{cue.title || cue.brand}</h3>
          <p className="text-sm text-muted-foreground">{cue.brand}</p>
        </div>

        {/* Condition Badge */}
        {cue.condition && (
          <Badge variant="outline" className="w-fit">
            {cue.condition}
          </Badge>
        )}

        {/* Price */}
        <div className="text-lg font-bold text-primary">
          €{cue.price?.toFixed(2) || '0.00'}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleSold}
            className="flex-1"
          >
            {cue.isSold ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark Available
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mr-1" />
                Mark Sold
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

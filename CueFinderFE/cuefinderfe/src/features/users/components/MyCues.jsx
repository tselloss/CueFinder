import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import * as cueService from '../../../api/cueService';
import * as cueCaseService from '../../../api/cueCaseService';
import * as billiardTableService from '../../../api/billiardTableService';
import * as accessoryService from '../../../api/accessoryService';
import CueFormModal from '../../../components/CueFormModal';
import { Button } from '../../../components/ui/button.jsx';
import { Card, CardContent } from '../../../components/ui/card.jsx';
import { Badge } from '../../../components/ui/badge.jsx';
import { API_BASE_URL, SITE_BASE_URL } from '../../../config/apiConfig';

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
  const { i18n } = useTranslation();
  const isGreek = i18n.language?.startsWith('el');
  const text = {
    title: isGreek ? '📋 Οι Καταχωρήσεις μου' : '📋 My Listings',
    addNewListing: isGreek ? 'Προσθήκη Νέας Καταχώρησης' : 'Add New Listing',
    addShort: isGreek ? 'Προσθήκη' : 'Add',
    loading: isGreek ? 'Φόρτωση καταχωρήσεων...' : 'Loading your listings...',
    empty: isGreek
      ? 'Δεν έχετε δημιουργήσει ακόμα καμία καταχώρηση.'
      : "You haven't created any listings yet.",
    loadError: isGreek
      ? '❌ Αδυναμία φόρτωσης καταχωρήσεων. Παρακαλώ δοκιμάστε ξανά.'
      : '❌ Unable to load listings. Please refresh or try again.',
    deleteSuccess: (itemType) => isGreek
      ? `✅ Η καταχώρησή σας ${itemType} διαγράφηκε επιτυχώς`
      : `✅ Your ${itemType} listing has been deleted successfully`,
    deleteError: (itemType) => isGreek
      ? `❌ Αδυναμία διαγραφής της καταχώρησής σας ${itemType}. Παρακαλώ δοκιμάστε ξανά.`
      : `❌ Unable to delete your ${itemType} listing. Please try again.`,
    deleteConfirm: (itemType) => isGreek
      ? `⚠️ Διαγραφή ${itemType};\n\nΑυτή η ενέργεια δεν μπορεί να αναιρεθεί.`
      : `⚠️ Delete ${itemType}?\n\nThis cannot be undone.`,
    soldMessage: (isSold) => isGreek
      ? (isSold ? '✅ Η καταχώρηση σημάνθηκε ως διαθέσιμη' : '✅ Η καταχώρηση σημάνθηκε ως πωλημένη')
      : `✅ Listing marked as ${isSold ? 'available' : 'sold'}`,
    soldError: isGreek
      ? '❌ Αδυναμία ενημέρωσης της κατάστασης. Παρακαλώ δοκιμάστε ξανά.'
      : '❌ Unable to update listing status. Please try again.',
    saveNew: isGreek
      ? '✅ Η νέα σας καταχώρηση δημιουργήθηκε επιτυχώς'
      : '✅ Your new listing has been created successfully',
    saveUpdate: isGreek
      ? '✅ Η καταχώρησή σας ενημερώθηκε επιτυχώς'
      : '✅ Your listing has been updated successfully',
    edit: isGreek ? 'Επεξεργασία' : 'Edit',
    markSold: isGreek ? 'Σήμανση Πωλημένου' : 'Mark Sold',
    markAvailable: isGreek ? 'Σήμανση Διαθέσιμου' : 'Mark Available',
    soldBadge: isGreek ? 'ΠΩΛΗΘΗΚΕ' : 'SOLD',
    categoryLabel: (category) => {
      if (category === 'case') return isGreek ? 'Θήκη' : 'Case';
      if (category === 'table') return isGreek ? 'Τραπέζι' : 'Table';
      if (category === 'accessory') return isGreek ? 'Αξεσουάρ' : 'Accessory';
      return isGreek ? 'Στέκα' : 'Cue';
    }
  };
  const [myListings, setMyListings] = useState([]); // cues + cases
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCue, setEditingCue] = useState(null);
  const [message, setMessage] = useState(null);

  const showMessage = useCallback((type, messageText) => {
    setMessage({ type, text: messageText });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  const loadMyCues = useCallback(async () => {
    setLoading(true);
    try {
      console.log('[MyCues] Fetching my listings from API...');
      const [cues, cases, tables, accessories] = await Promise.all([
        cueService.getMyCues().catch(err => { console.error('[MyCues] Error fetching cues:', err); return []; }),
        cueCaseService.getMyCueCases().catch(err => { console.error('[MyCues] Error fetching cases:', err); return []; }),
        billiardTableService.getMyTables().catch(err => { console.error('[MyCues] Error fetching tables:', err); return []; }),
        accessoryService.getMyAccessories().catch(err => { console.error('[MyCues] Error fetching accessories:', err); return []; })
      ]);
      const cuesWithCategory = (cues || []).map(c => ({ ...c, category: 'cue' }));
      const casesWithCategory = (cases || []).map(cs => ({ ...cs, category: 'case' }));
      const tablesWithCategory = (tables || []).map(t => ({ ...t, category: 'table' }));
      const accessoriesWithCategory = (accessories || []).map(a => ({ ...a, category: 'accessory' }));
      const combined = [...cuesWithCategory, ...casesWithCategory, ...tablesWithCategory, ...accessoriesWithCategory];
      console.log('[MyCues] Received listings:', { 
        cues: cuesWithCategory.length, 
        cases: casesWithCategory.length, 
        tables: tablesWithCategory.length,
        accessories: accessoriesWithCategory.length,
        total: combined.length,
        data: combined
      });
      setMyListings(combined);
    } catch (error) {
      console.error('[MyCues] Error loading my cues:', error);
      showMessage('error', text.loadError);
    } finally {
      setLoading(false);
    }
  }, [showMessage, text]);

  useEffect(() => {
    loadMyCues();
  }, [loadMyCues]);

  // loadMyCues defined above with useCallback

  const handleCreateNew = () => {
    setEditingCue(null);
    setShowCreateModal(true);
  };

  const handleEdit = (cue) => {
    setEditingCue(cue);
    setShowCreateModal(true);
  };

  const handleDelete = async (item) => {
    let itemType = text.categoryLabel(item.category);

    if (!window.confirm(text.deleteConfirm(itemType))) {
      return;
    }

    try {
      if (item.category === 'case') {
        await cueCaseService.deleteCueCase(item.id);
      } else if (item.category === 'table') {
        await billiardTableService.deleteTable(item.id);
      } else if (item.category === 'accessory') {
        await accessoryService.deleteAccessory(item.id);
      } else {
        await cueService.deleteCue(item.id);
      }
      setMyListings(myListings.filter(c => c.id !== item.id));
      showMessage('success', text.deleteSuccess(itemType));
    } catch (error) {
      console.error('Delete error:', error);
      showMessage('error', text.deleteError(itemType));
    }
  };

  const handleToggleSold = async (item) => {
    try {
      let updated;
      if (item.category === 'case') {
        updated = await cueCaseService.updateCueCase(item.id, {
          isSold: !item.isSold
        });
      } else if (item.category === 'table') {
        updated = await billiardTableService.updateTable(item.id, {
          isSold: !item.isSold
        });
      } else if (item.category === 'accessory') {
        updated = await accessoryService.updateAccessory(item.id, {
          isSold: !item.isSold
        });
      } else {
        updated = await cueService.updateCue(item.id, {
          isSold: !item.isSold
        });
      }
      setMyListings(myListings.map(c => c.id === item.id ? { ...updated, category: item.category } : c));
      showMessage('success', text.soldMessage(!item.isSold));
    } catch (error) {
      console.error('Toggle sold error:', error);
      showMessage('error', text.soldError);
    }
  };

  const handleSaveCue = async () => {
    setShowCreateModal(false);
    setEditingCue(null);
    await loadMyCues();
    showMessage('success', editingCue ? text.saveUpdate : text.saveNew);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingCue(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="inline-block animate-spin">
            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
          <p className="text-muted-foreground">{text.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold">{text.title}</h2>
        <Button
          onClick={handleCreateNew}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all h-10 px-4 text-sm sm:text-base font-semibold w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{text.addNewListing}</span><span className="sm:hidden">{text.addShort}</span>
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
              {text.empty}
            </p>
            <Button
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all h-10 px-4 text-sm sm:text-base font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{text.addNewListing}</span><span className="sm:hidden">{text.addShort}</span>
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
              text={text}
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

function CueCard({ cue, onEdit, onDelete, onToggleSold, text }) {
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
            {text.categoryLabel(cue.category)}
          </Badge>
        )}
        
        {/* Sold Badge */}
        {cue.isSold && (
          <Badge className="absolute top-3 right-3 bg-red-600">
            {text.soldBadge}
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
            {text.edit}
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
                {text.markAvailable}
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mr-1" />
                {text.markSold}
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

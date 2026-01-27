import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';
import * as adminUsers from '../../api/adminUsersService';
import * as cueService from '../../api/cueService';
import * as cueCaseService from '../../api/cueCaseService';
import { UsersManagementView, ListingsManagementView, EditUserModal } from './components';

export default function AdminContainer({ onBack }) {
  const [users, setUsers] = useState([]);
  const [cues, setCues] = useState([]);
  const [cases, setCases] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [listingQuery, setListingQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [userPage, setUserPage] = useState(1);
  const [listingPage, setListingPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  // Load initial data
  useEffect(() => {
    async function load() {
      console.log('AdminPage: Loading data...');
      try {
        const [u, c, k] = await Promise.all([
          adminUsers.getAllUsers().catch(err => { 
            console.error('Error loading users:', err); 
            return []; 
          }),
          cueService.getCues().catch(err => { 
            console.error('Error loading cues:', err); 
            return []; 
          }),
          cueCaseService.getCueCases().catch(err => { 
            console.error('Error loading cases:', err); 
            return []; 
          })
        ]);
        console.log('AdminPage: Users loaded:', u?.length || 0);
        console.log('AdminPage: Cues loaded:', c?.length || 0);
        console.log('AdminPage: Cases loaded:', k?.length || 0);
        setUsers(u || []);
        setCues(c || []);
        setCases(k || []);
      } catch (error) {
        console.error('AdminPage: Fatal error loading data:', error);
        setUsers([]);
        setCues([]);
        setCases([]);
      }
    }
    load();
  }, []);

  // Prepare listings data
  const listings = useMemo(() => {
    const cueItems = (cues || []).map(x => ({
      id: x.id,
      uid: `cue-${x.id}`,
      title: x.title || `${x.brand ?? ''} ${x.model ?? ''}`.trim() || `Cue #${x.id}`,
      price: Number(x.price ?? 0),
      itemType: 'cue',
      flagged: x.flagged || false,
    }));
    const caseItems = (cases || []).map(x => ({
      id: x.id,
      uid: `case-${x.id}`,
      title: x.title || `${x.brand ?? ''} ${x.type ?? ''}`.trim() || `Case #${x.id}`,
      price: Number(x.price ?? 0),
      itemType: 'case',
      flagged: x.flagged || false,
    }));
    return [...cueItems, ...caseItems];
  }, [cues, cases]);

  // User management handlers
  const handleToggleBan = async (user) => {
    const updated = await adminUsers.updateUser(user.id, { 
      IsActive: user.isActive === false ? true : false 
    });
    setUsers((s) => s.map((x) => (x.id === updated.id ? updated : x)));
  };

  const handleSaveUser = async (editedUser) => {
    const updated = await adminUsers.updateUser(editedUser.id, {
      name: editedUser.name,
      email: editedUser.email,
      role: editedUser.role,
    });
    if (updated) {
      setUsers((s) => s.map((u) => (u.id === updated.id ? updated : u)));
      setEditingUser(null);
    }
  };

  const handleDeleteUser = async (id) => {
    await adminUsers.deleteUser(id);
    setUsers((s) => s.filter((u) => u.id !== id));
  };

  // Listing management handlers
  const handleFlagListing = async (item) => {
    if (item.itemType === 'cue') {
      const res = await cueService.updateCue(item.id, { flagged: true });
      setCues((s) => s.map((c) => (c.id === res.id ? res : c)));
    } else {
      const res = await cueCaseService.updateCueCase(item.id, { flagged: true });
      setCases((s) => s.map((c) => (c.id === res.id ? res : c)));
    }
  };

  const handleDeleteListing = async (item) => {
    if (item.itemType === 'cue') {
      await cueService.deleteCue(item.id);
      setCues((s) => s.filter((c) => c.id !== item.id));
    } else {
      await cueCaseService.deleteCueCase(item.id);
      setCases((s) => s.filter((c) => c.id !== item.id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <h2 className="text-2xl font-bold text-gray-900">Admin — Dashboard</h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users Management */}
          <UsersManagementView
            users={users}
            query={userQuery}
            onQueryChange={setUserQuery}
            page={userPage}
            onPageChange={setUserPage}
            onEdit={setEditingUser}
            onToggleBan={handleToggleBan}
            onDelete={handleDeleteUser}
          />

          {/* Listings Management */}
          <ListingsManagementView
            listings={listings}
            query={listingQuery}
            onQueryChange={setListingQuery}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            page={listingPage}
            onPageChange={setListingPage}
            onFlag={handleFlagListing}
            onDelete={handleDeleteListing}
          />
        </div>
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        onSave={handleSaveUser}
        onClose={() => setEditingUser(null)}
      />
    </div>
  );
}

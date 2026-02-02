import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Shield, Image as ImageIcon, Users } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.jsx';
import * as adminUsers from '../../api/adminUsersService';
import * as cueService from '../../api/cueService';
import * as cueCaseService from '../../api/cueCaseService';
import * as moderationService from '../../api/moderationService';
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
  const [flaggedImages, setFlaggedImages] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [moderationStats, setModerationStats] = useState({ total: 0, pending: 0, rejected: 0, approved: 0 });

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

        try {
          const [flaggedData, bannedData] = await Promise.all([
            moderationService.getFlaggedImages().catch(err => {
              console.error('Error loading flagged images:', err);
              return { items: [], total: 0 };
            }),
            moderationService.getBannedUsers().catch(err => {
              console.error('Error loading banned users:', err);
              return { items: [], total: 0 };
            })
          ]);

          const flaggedItems = Array.isArray(flaggedData) ? flaggedData : (flaggedData?.items || flaggedData?.data || []);
          const bannedItems = Array.isArray(bannedData) ? bannedData : (bannedData?.items || bannedData?.data || []);

          setFlaggedImages(flaggedItems);
          setBannedUsers(bannedItems);

          const pending = flaggedItems.filter(f => (f.status || '').toLowerCase() === 'pending').length;
          const rejected = flaggedItems.filter(f => (f.status || '').toLowerCase() === 'rejected').length;
          const approved = flaggedItems.filter(f => (f.status || '').toLowerCase() === 'approved').length;
          setModerationStats({
            total: flaggedData?.total ?? flaggedItems.length,
            pending,
            rejected,
            approved
          });
        } catch (modError) {
          console.error('AdminPage: Error loading moderation data:', modError);
          setFlaggedImages([]);
          setBannedUsers([]);
          setModerationStats({ total: 0, pending: 0, rejected: 0, approved: 0 });
        }
      } catch (error) {
        console.error('AdminPage: Fatal error loading data:', error);
        setUsers([]);
        setCues([]);
        setCases([]);
      }
    }
    load();
  }, []);

  useEffect(() => {
    setUserPage(1);
  }, [userQuery]);

  useEffect(() => {
    setListingPage(1);
  }, [listingQuery]);

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

  const getFlagReason = (flag) => flag?.flagReason || flag?.reason || flag?.flag_reason || '-';
  const getConfidence = (flag) => {
    const value = flag?.aiConfidenceScore ?? flag?.confidence ?? flag?.confidence_score;
    return typeof value === 'number' ? value.toFixed(2) : '-';
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
        {(flaggedImages.length > 0 || bannedUsers.length > 0) && (
          <Card className="mb-6 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Shield className="w-5 h-5" />
                Image Moderation Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4 text-sm">
                <Badge variant="outline">Total flags: {moderationStats.total}</Badge>
                <Badge variant="outline">Pending: {moderationStats.pending}</Badge>
                <Badge variant="outline">Rejected: {moderationStats.rejected}</Badge>
                <Badge variant="outline">Approved: {moderationStats.approved}</Badge>
              </div>

              <Tabs defaultValue="blocked" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="blocked">Blocked Images ({flaggedImages.length})</TabsTrigger>
                  <TabsTrigger value="banned">Banned Users ({bannedUsers.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="blocked" className="mt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Image</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead>User</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {flaggedImages.slice(0, 10).map((flag) => (
                          <TableRow key={flag.id || flag.image_id || flag.flag_id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-purple-500" />
                                <span className="text-xs text-gray-700">#{flag.id ?? flag.image_id ?? '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{getFlagReason(flag)}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="secondary" className="capitalize">{flag.status || 'pending'}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">{getConfidence(flag)}</TableCell>
                            <TableCell className="text-xs">{flag.userName || flag.username || flag.display_name || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="banned" className="mt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Flags</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bannedUsers.slice(0, 10).map((user) => (
                          <TableRow key={user.id || user.user_id || user.email}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-purple-500" />
                                <span className="text-xs text-gray-700">{user.username || user.display_name || user.name || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{user.email || '-'}</TableCell>
                            <TableCell className="text-xs">{user.total_flags ?? user.flagCount ?? '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

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

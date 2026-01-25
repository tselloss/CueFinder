import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { ArrowLeft, Trash2, Flag, UserCheck, UserX, Edit, Shield, Users, Package, AlertTriangle, ChevronLeft, ChevronRight, Ban, Image as ImageIcon } from 'lucide-react';
import * as adminUsers from '../api/adminUsersService';
import * as cueService from '../api/cueService';
import * as cueCaseService from '../api/cueCaseService';
import * as moderationService from '../api/moderationService';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';

export default function AdminPage({ onBack }) {
  const [users, setUsers] = useState([]);
  const [cues, setCues] = useState([]);
  const [cases, setCases] = useState([]);
  const [query, setQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [userPage, setUserPage] = useState(1);
  const [listingPage, setListingPage] = useState(1);
  const [listingTab, setListingTab] = useState('all');
  const [flaggedImages, setFlaggedImages] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [moderationStats, setModerationStats] = useState({ total: 0, pending: 0, rejected: 0, approved: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [flaggedImagesPage, setFlaggedImagesPage] = useState(1);
  const [bannedUsersPage, setBannedUsersPage] = useState(1);
  const itemsPerPage = 5;
  const userQueryRef = useRef(null);
  const queryRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Debounced search handler
  const handleUserQueryChange = useCallback((e) => {
    const value = e.target.value;
    setUserQuery(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => setUserPage(1), 200);
  }, []);

  const handleQueryChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => setListingPage(1), 200);
  }, []);

  useEffect(() => {
    async function load() {
      console.log('AdminPage: Loading data...');
      setIsLoading(true);
      try {
        const [u, c, k, flaggedData, bannedData] = await Promise.all([
          adminUsers.getAllUsers().catch(err => { console.error('Error loading users:', err); return []; }),
          cueService.getCues().catch(err => { console.error('Error loading cues:', err); return []; }),
          cueCaseService.getCueCases().catch(err => { console.error('Error loading cases:', err); return []; }),
          moderationService.getFlaggedImages().catch(err => { console.error('Error loading flagged images:', err); return { items: [], total: 0 }; }),
          moderationService.getBannedUsers().catch(err => { console.error('Error loading banned users:', err); return { items: [], total: 0 }; })
        ]);
        console.log('AdminPage: Data loaded - Users:', u?.length, 'Cues:', c?.length, 'Cases:', k?.length);
        setUsers(u || []);
        setCues(c || []);
        setCases(k || []);
        setFlaggedImages(flaggedData?.items || []);
        setBannedUsers(bannedData?.items || []);
        
        // Calculate stats efficiently
        const flaggedItems = flaggedData?.items || [];
        setModerationStats({
          total: flaggedData?.total || 0,
          pending: flaggedItems.filter(f => f.status === 'pending').length,
          rejected: flaggedItems.filter(f => f.status === 'rejected').length,
          approved: flaggedItems.filter(f => f.status === 'approved').length
        });
      } catch (error) {
        console.error('AdminPage: Fatal error loading data:', error);
        setUsers([]);
        setCues([]);
        setCases([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const listings = useMemo(() => {
    const cueItems = (cues || []).map(x => ({
      id: x.id,
      uid: `cue-${x.id}`,
      title: x.title || `${x.brand ?? ''} ${x.model ?? ''}`.trim() || `Cue #${x.id}`,
      price: Number(x.price ?? 0),
      itemType: 'cue',
      flagged: x.isFlagged || x.flagged || false,
      userId: x.userId,
    }));
    const caseItems = (cases || []).map(x => ({
      id: x.id,
      uid: `case-${x.id}`,
      title: x.title || `${x.brand ?? ''} ${x.type ?? ''}`.trim() || `Case #${x.id}`,
      price: Number(x.price ?? 0),
      itemType: 'case',
      flagged: x.isFlagged || x.flagged || false,
      userId: x.userId,
    }));
    return [...cueItems, ...caseItems];
  }, [cues, cases]);

  // Compute flagged listings once
  const flaggedListings = useMemo(() => listings.filter(l => l.flagged), [listings]);

  // Compute users with flagged content once
  const usersWithFlaggedContent = useMemo(() => {
    const flaggedUserIds = new Set(flaggedListings.map(l => l.userId).filter(Boolean));
    return users.filter(u => flaggedUserIds.has(u.id));
  }, [users, flaggedListings]);

  // Optimize filtering with case-insensitive search
  const filteredListings = useMemo(() => {
    if (!query.trim()) return listings;
    const q = query.toLowerCase();
    return listings.filter(l =>
      l.title.toLowerCase().includes(q) || String(l.price).includes(q)
    );
  }, [listings, query]);

  const filteredUsers = useMemo(() => {
    if (!userQuery.trim()) return users;
    const q = userQuery.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, userQuery]);

  // Optimized action handlers with useCallback
  const toggleBan = useCallback(async (user) => {
    try {
      const updated = await adminUsers.updateUser(user.id, { IsActive: user.isActive === false ? true : false });
      setUsers((s) => s.map((x) => (x.id === updated.id ? updated : x)));
    } catch (error) {
      console.error('Error toggling ban:', error);
    }
  }, []);

  const saveUser = useCallback(async () => {
    if (!editingUser) return;
    try {
      const updated = await adminUsers.updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
      });
      if (updated) {
        setUsers((s) => s.map((u) => (u.id === updated.id ? updated : u)));
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }, [editingUser]);

  const deleteUser = useCallback(async (id) => {
    if (!window.confirm('⚠️ Delete User Account?\n\nThis will permanently delete the user and all their data. This action cannot be undone.')) return;
    try {
      await adminUsers.deleteUser(id);
      setUsers((s) => s.filter((u) => u.id !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }, []);

  const removeListing = useCallback(async (item) => {
    if (!window.confirm(`⚠️ Delete ${item.itemType} listing?\n\nThis will permanently remove this listing from the platform.`)) return;
    try {
      if (item.itemType === 'cue') {
        await cueService.deleteCue(item.id);
        setCues((s) => s.filter((c) => c.id !== item.id));
      } else {
        await cueCaseService.deleteCueCase(item.id);
        setCases((s) => s.filter((c) => c.id !== item.id));
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
    }
  }, []);

  const flagListing = useCallback(async (item) => {
    try {
      if (item.itemType === 'cue') {
        const res = await cueService.updateCue(item.id, { flagged: true });
        setCues((s) => s.map((c) => (c.id === res.id ? res : c)));
      } else {
        const res = await cueCaseService.updateCueCase(item.id, { flagged: true });
        setCases((s) => s.map((c) => (c.id === res.id ? res : c)));
      }
    } catch (error) {
      console.error('Error flagging listing:', error);
    }
  }, []);

  // Optimized pagination calculations
  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, userPage, itemsPerPage]);

  // Pagination for listings with tab filtering
  const filteredListingsByTab = useMemo(() => {
    if (listingTab === 'cues') return filteredListings.filter(l => l.itemType === 'cue');
    if (listingTab === 'cases') return filteredListings.filter(l => l.itemType === 'case');
    return filteredListings;
  }, [filteredListings, listingTab]);

  const totalListingPages = Math.ceil(filteredListingsByTab.length / itemsPerPage);
  const paginatedListings = useMemo(() => {
    const start = (listingPage - 1) * itemsPerPage;
    return filteredListingsByTab.slice(start, start + itemsPerPage);
  }, [filteredListingsByTab, listingPage, itemsPerPage]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 pt-[7px] pb-[7px]">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Listings</p>
                  <p className="text-2xl font-bold">{listings.length}</p>
                </div>
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Flagged Content</p>
                  <p className="text-2xl font-bold text-orange-500">{flaggedListings.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Users w/ Flags</p>
                  <p className="text-2xl font-bold text-red-500">{usersWithFlaggedContent.length}</p>
                </div>
                <Flag className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Moderation Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-purple-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blocked Images</p>
                  <p className="text-2xl font-bold text-purple-500">{moderationStats.total}</p>
                </div>
                <ImageIcon className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-500">{moderationStats.pending}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected Images</p>
                  <p className="text-2xl font-bold text-red-500">{moderationStats.rejected}</p>
                </div>
                <Ban className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Banned Users</p>
                  <p className="text-2xl font-bold text-blue-500">{bannedUsers.length}</p>
                </div>
                <UserX className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flagged Content Alert */}
        {flaggedListings.length > 0 && (
          <Alert className="mb-6 border-orange-500/50 bg-orange-50 dark:bg-orange-950">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              <strong>{flaggedListings.length} listing(s)</strong> flagged for review. 
              {usersWithFlaggedContent.length > 0 && (
                <span> <strong>{usersWithFlaggedContent.length} user(s)</strong> have uploaded flagged content.</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Blocked Images Info Section */}
        {(flaggedImages.length > 0 || bannedUsers.length > 0) && (
          <Card className="mb-6 border-purple-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" />
                Image Moderation Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                          <TableHead>User</TableHead>
                          <TableHead>Image</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Flagged Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {flaggedImages.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              No blocked images
                            </TableCell>
                          </TableRow>
                        ) : (
                          flaggedImages.slice((flaggedImagesPage - 1) * itemsPerPage, flaggedImagesPage * itemsPerPage).map((img) => (
                            <TableRow key={img.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{img.user_name || 'Unknown'}</div>
                                  {img.user_email && (
                                    <div className="text-sm text-muted-foreground">{img.user_email}</div>
                                  )}
                                  {img.user_is_banned && (
                                    <Badge variant="destructive" className="mt-1">BANNED</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-mono text-xs text-muted-foreground">{img.file_name}</div>
                                  {img.cue_id && <div className="text-xs">Cue #{img.cue_id}</div>}
                                  {img.cue_case_id && <div className="text-xs">Case #{img.cue_case_id}</div>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <Badge variant="outline">{img.flag_reason || 'Unknown'}</Badge>
                                  {img.is_ai_flagged && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      AI: {(img.ai_confidence * 100).toFixed(0)}%
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {img.status === 'pending' && <Badge variant="warning">PENDING</Badge>}
                                {img.status === 'rejected' && <Badge variant="destructive">REJECTED</Badge>}
                                {img.status === 'approved' && <Badge variant="success">APPROVED</Badge>}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(img.flagged_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    {flaggedImages.length > itemsPerPage && (
                      <div className="p-4 flex items-center justify-between border-t">
                        <div className="text-sm text-muted-foreground">
                          Showing {(flaggedImagesPage - 1) * itemsPerPage + 1}-{Math.min(flaggedImagesPage * itemsPerPage, flaggedImages.length)} of {flaggedImages.length}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFlaggedImagesPage(p => Math.max(1, p - 1))}
                            disabled={flaggedImagesPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="text-sm">
                            Page {flaggedImagesPage} of {Math.ceil(flaggedImages.length / itemsPerPage)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFlaggedImagesPage(p => p + 1)}
                            disabled={flaggedImagesPage >= Math.ceil(flaggedImages.length / itemsPerPage)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="banned" className="mt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Flagged Images</TableHead>
                          <TableHead>Rejected</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bannedUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              No banned users
                            </TableCell>
                          </TableRow>
                        ) : (
                          bannedUsers.slice((bannedUsersPage - 1) * itemsPerPage, bannedUsersPage * itemsPerPage).map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{user.username}</div>
                                  {user.display_name && (
                                    <div className="text-sm text-muted-foreground">{user.display_name}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{user.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{user.flagged_images_count || 0}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="destructive">{user.rejected_images_count || 0}</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(user.created_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    {bannedUsers.length > itemsPerPage && (
                      <div className="p-4 flex items-center justify-between border-t">
                        <div className="text-sm text-muted-foreground">
                          Showing {(bannedUsersPage - 1) * itemsPerPage + 1}-{Math.min(bannedUsersPage * itemsPerPage, bannedUsers.length)} of {bannedUsers.length}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBannedUsersPage(p => Math.max(1, p - 1))}
                            disabled={bannedUsersPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="text-sm">
                            Page {bannedUsersPage} of {Math.ceil(bannedUsers.length / itemsPerPage)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBannedUsersPage(p => p + 1)}
                            disabled={bannedUsersPage >= Math.ceil(bannedUsers.length / itemsPerPage)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search users (name or email)"
                  value={userQuery}
                  onChange={handleUserQueryChange}
                  className="flex-1"
                  ref={userQueryRef}
                />
                <Badge variant="secondary">
                  {filteredUsers.length} / {users.length}
                </Badge>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{user.name}</span>
                                {usersWithFlaggedContent.some(u => u.id === user.id) && (
                                  <Flag className="w-4 h-4 text-orange-500" title="Has flagged content" />
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.isActive === false ? (
                              <Badge variant="destructive">INACTIVE</Badge>
                            ) : (
                              <Badge variant="success">ACTIVE</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingUser({ ...user })}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleBan(user)}
                              >
                                {user.isActive === false ? (
                                  <UserCheck className="w-4 h-4 text-green-500" />
                                ) : (
                                  <UserX className="w-4 h-4 text-orange-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteUser(user.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Users Pagination Controls */}
              {totalUserPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    Page {userPage} of {totalUserPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserPage(p => Math.max(1, p - 1))}
                      disabled={userPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                      disabled={userPage === totalUserPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Listings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Listings Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search listings (title or price)"
                  value={query}
                  onChange={handleQueryChange}
                  className="flex-1"
                  ref={queryRef}
                />
                <Badge variant="secondary">
                  {filteredListings.length} / {listings.length}
                </Badge>
              </div>

              <Tabs value={listingTab} onValueChange={setListingTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All ({filteredListings.length})</TabsTrigger>
                  <TabsTrigger value="cues">
                    Cues ({filteredListings.filter(l => l.itemType === 'cue').length})
                  </TabsTrigger>
                  <TabsTrigger value="cases">
                    Cases ({filteredListings.filter(l => l.itemType === 'case').length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={listingTab} className="mt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedListings.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              No listings found
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedListings.map((item) => (
                            <TableRow key={item.uid}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {item.itemType.toUpperCase()}
                                  </Badge>
                                  <span className="font-medium">{item.title}</span>
                                </div>
                              </TableCell>
                              <TableCell>€{item.price.toFixed(2)}</TableCell>
                              <TableCell>
                                {item.flagged && <Badge variant="warning">FLAGGED</Badge>}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => flagListing(item)}
                                    disabled={item.flagged}
                                  >
                                    <Flag className="w-4 h-4 text-yellow-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeListing(item)}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Listings Pagination Controls */}
                  {totalListingPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-muted-foreground">
                        Page {listingPage} of {totalListingPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setListingPage(p => Math.max(1, p - 1))}
                          disabled={listingPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setListingPage(p => Math.min(totalListingPages, p + 1))}
                          disabled={listingPage === totalListingPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={true} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button onClick={saveUser}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

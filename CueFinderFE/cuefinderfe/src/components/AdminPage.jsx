import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Trash2, Flag, UserCheck, UserX, Edit, Shield, Users, Package } from 'lucide-react';
import * as adminUsers from '../api/adminUsersService';
import * as cueService from '../api/cueService';
import * as cueCaseService from '../api/cueCaseService';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export default function AdminPage({ onBack }) {
  const [users, setUsers] = useState([]);
  const [cues, setCues] = useState([]);
  const [cases, setCases] = useState([]);
  const [query, setQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    async function load() {
      console.log('AdminPage: Loading data...');
      try {
        const [u, c, k] = await Promise.all([
          adminUsers.getAllUsers().catch(err => { console.error('Error loading users:', err); return []; }),
          cueService.getCues().catch(err => { console.error('Error loading cues:', err); return []; }),
          cueCaseService.getCueCases().catch(err => { console.error('Error loading cases:', err); return []; })
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

  const filteredListings = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter(l =>
      !q || l.title.toLowerCase().includes(q) || String(l.price).includes(q)
    );
  }, [listings, query]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    return users.filter(u =>
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, userQuery]);

  const toggleBan = async (user) => {
    const updated = await adminUsers.updateUser(user.id, { IsActive: user.isActive === false ? true : false });
    setUsers((s) => s.map((x) => (x.id === updated.id ? updated : x)));
  };

  const saveUser = async () => {
    if (!editingUser) return;
    const updated = await adminUsers.updateUser(editingUser.id, {
      name: editingUser.name,
      email: editingUser.email,
      role: editingUser.role,
    });
    if (updated) {
      setUsers((s) => s.map((u) => (u.id === updated.id ? updated : u)));
      setEditingUser(null);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    await adminUsers.deleteUser(id);
    setUsers((s) => s.filter((u) => u.id !== id));
  };

  const removeListing = async (item) => {
    if (!window.confirm(`Are you sure you want to delete this ${item.itemType}?`)) return;
    if (item.itemType === 'cue') {
      await cueService.deleteCue(item.id);
      setCues((s) => s.filter((c) => c.id !== item.id));
    } else {
      await cueCaseService.deleteCueCase(item.id);
      setCases((s) => s.filter((c) => c.id !== item.id));
    }
  };

  const flagListing = async (item) => {
    if (item.itemType === 'cue') {
      const res = await cueService.updateCue(item.id, { flagged: true });
      setCues((s) => s.map((c) => (c.id === res.id ? res : c)));
    } else {
      const res = await cueCaseService.updateCueCase(item.id, { flagged: true });
      setCases((s) => s.map((c) => (c.id === res.id ? res : c)));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
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
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="flex-1"
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
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.name}</div>
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
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1"
                />
                <Badge variant="secondary">
                  {filteredListings.length} / {listings.length}
                </Badge>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All ({filteredListings.length})</TabsTrigger>
                  <TabsTrigger value="cues">
                    Cues ({filteredListings.filter(l => l.itemType === 'cue').length})
                  </TabsTrigger>
                  <TabsTrigger value="cases">
                    Cases ({filteredListings.filter(l => l.itemType === 'case').length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
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
                        {filteredListings.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              No listings found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredListings.map((item) => (
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
                </TabsContent>

                <TabsContent value="cues" className="mt-4">
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
                        {filteredListings.filter(l => l.itemType === 'cue').length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              No cues found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredListings.filter(l => l.itemType === 'cue').map((item) => (
                            <TableRow key={item.uid}>
                              <TableCell className="font-medium">{item.title}</TableCell>
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
                </TabsContent>

                <TabsContent value="cases" className="mt-4">
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
                        {filteredListings.filter(l => l.itemType === 'case').length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              No cases found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredListings.filter(l => l.itemType === 'case').map((item) => (
                            <TableRow key={item.uid}>
                              <TableCell className="font-medium">{item.title}</TableCell>
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

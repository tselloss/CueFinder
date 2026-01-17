import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Trash2, Flag, X, Check, Edit2, User } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import MaterialInput from './MaterialInput';
import * as adminUsers from '../api/adminUsersService';
import * as cueService from '../api/cueService';
import * as cueCaseService from '../api/cueCaseService';

export default function AdminPage({ onBack }) {
  const [users, setUsers] = useState([]);
  const [cues, setCues] = useState([]);
  const [cases, setCases] = useState([]);
  const [query, setQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [listingPage, setListingPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  const itemsPerPage = 10;

  useEffect(() => {
    async function load() {
      console.log('AdminPage: Loading data...');
      try {
        const [u, c, k] = await Promise.all([
          adminUsers.getAllUsers().catch(err => { console.error('Error loading users:', err); return []; }),
          cueService.getCues().catch(err => { console.error('Error loading cues:', err); return []; }),
          cueCaseService.getCueCases().catch(err => { console.error('Error loading cases:', err); return []; })
        ]);
        console.log('AdminPage: Users loaded:', u?.length || 0, u);
        console.log('AdminPage: Cues loaded:', c?.length || 0, c);
        console.log('AdminPage: Cases loaded:', k?.length || 0, k);
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
    await adminUsers.deleteUser(id);
    setUsers((s) => s.filter((u) => u.id !== id));
  };

  const removeListing = async (item) => {
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

  // Filter and pagination helpers
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

  // Paginate users
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, userPage]);

  const userTotalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Paginate listings
  const paginatedListings = useMemo(() => {
    let data = filteredListings;
    if (activeTab === 'cues') {
      data = filteredListings.filter(l => l.itemType === 'cue');
    } else if (activeTab === 'cases') {
      data = filteredListings.filter(l => l.itemType === 'case');
    }
    const start = (listingPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [filteredListings, listingPage, activeTab]);

  const listingTotalPages = useMemo(() => {
    let data = filteredListings;
    if (activeTab === 'cues') {
      data = filteredListings.filter(l => l.itemType === 'cue');
    } else if (activeTab === 'cases') {
      data = filteredListings.filter(l => l.itemType === 'case');
    }
    return Math.ceil(data.length / itemsPerPage);
  }, [filteredListings, activeTab]);
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
          {/* Users Card */}
          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">Users</h3>
              
              {/* Search and filters */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <MaterialInput
                  placeholder="Search users (name or email)"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  style={{ minWidth: '250px' }}
                />
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                  Total: {users.length}
                </span>
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                  Filtered: {filteredUsers.length}
                </span>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Name</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Role</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Status</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-bold text-gray-900">{user.name}</p>
                            <p className="text-gray-500 text-xs">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            <User className="w-3 h-3" />
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium text-white ${
                            user.isActive === false
                              ? 'bg-red-500'
                              : 'bg-green-500'
                          }`}>
                            {user.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingUser({ ...user })}
                              title="Edit"
                              className="w-8 h-8 p-0"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleBan(user)}
                              title={user.isActive === false ? 'Activate' : 'Disable'}
                              className="w-8 h-8 p-0"
                            >
                              {user.isActive === false ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <X className="w-4 h-4 text-red-600" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteUser(user.id)}
                              title="Delete"
                              className="w-8 h-8 p-0"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Users Pagination */}
              {userTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page {userPage} of {userTotalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserPage(prev => Math.max(1, prev - 1))}
                      disabled={userPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserPage(prev => Math.min(userTotalPages, prev + 1))}
                      disabled={userPage === userTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Listings Card */}
          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">Listings</h3>
              
              {/* Search and filters */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <MaterialInput
                  placeholder="Search listings (title or price)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ minWidth: '250px' }}
                />
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                  Total: {listings.length}
                </span>
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                  Filtered: {filteredListings.length}
                </span>
              </div>

              {/* Tabs */}
              <div className="mb-4 border-b border-gray-200">
                <div className="flex gap-1">
                  {['all', 'cues', 'cases'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setListingPage(1);
                      }}
                      className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === tab
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Listings Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Title</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Price (€)</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Status</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedListings.map((item) => (
                      <tr key={item.uid} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded">
                              {item.itemType.toUpperCase()}
                            </span>
                            <span className="font-bold text-gray-900">{item.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          €{Number(item.price || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          {item.flagged ? (
                            <span className="inline-block px-2.5 py-1 bg-orange-500 text-white text-xs font-medium rounded">
                              FLAGGED
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => flagListing(item)}
                              title="Flag"
                              className="w-8 h-8 p-0"
                            >
                              <Flag className="w-4 h-4 text-orange-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeListing(item)}
                              title="Delete"
                              className="w-8 h-8 p-0"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Listings Pagination */}
              {listingTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page {listingPage} of {listingTotalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setListingPage(prev => Math.max(1, prev - 1))}
                      disabled={listingPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setListingPage(prev => Math.min(listingTotalPages, prev + 1))}
                      disabled={listingPage === listingTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold">Edit User</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); saveUser(); }} className="p-6 space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Role Field */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                >
                  Save
                </Button>
              </div>
            </form>
          </div>

          {/* Close modal when clicking outside */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setEditingUser(null)}
          />
        </div>
      )}
    </div>
  );
}

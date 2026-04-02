import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Shield, Image as ImageIcon, Users, ChevronDown, ChevronUp, BarChart3, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.jsx';
import * as adminUsers from '../../api/adminUsersService';
import * as cueService from '../../api/cueService';
import * as cueCaseService from '../../api/cueCaseService';
import * as billiardTableService from '../../api/billiardTableService';
import * as accessoryService from '../../api/accessoryService';
import * as moderationService from '../../api/moderationService';
import { UsersManagementView, ListingsManagementView, EditUserModal } from './components';

export default function AdminContainer({ onBack }) {
  const [users, setUsers] = useState([]);
  const [cues, setCues] = useState([]);
  const [cases, setCases] = useState([]);
  const [tables, setTables] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [listingQuery, setListingQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [userPage, setUserPage] = useState(1);
  const [listingPage, setListingPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [flaggedImages, setFlaggedImages] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [moderationStats, setModerationStats] = useState({ total: 0, pending: 0, rejected: 0, approved: 0 });
  
  // Expansion states for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    dashboard: true,
    moderation: true,
    users: true,
    listings: true
  });

  // Load initial data
  useEffect(() => {
    async function load() {
      console.log('AdminPage: Loading data...');
      try {
        const [u, c, k, t, a] = await Promise.all([
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
          }),
          billiardTableService.getTables().catch(err => { 
            console.error('Error loading billiard tables:', err); 
            return []; 
          }),
          accessoryService.getAccessories().catch(err => { 
            console.error('Error loading accessories:', err); 
            return []; 
          })
        ]);
        console.log('AdminPage: Users loaded:', u?.length || 0);
        console.log('AdminPage: Cues loaded:', c?.length || 0);
        console.log('AdminPage: Cases loaded:', k?.length || 0);
        console.log('AdminPage: Tables loaded:', t?.length || 0);
        console.log('AdminPage: Accessories loaded:', a?.length || 0);
        setUsers(u || []);
        setCues(c || []);
        setCases(k || []);
        setTables(t || []);
        setAccessories(a || []);

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
    const tableItems = (tables || []).map(x => ({
      id: x.id,
      uid: `table-${x.id}`,
      title: x.title || `${x.brand ?? ''} ${x.model ?? ''}`.trim() || `Table #${x.id}`,
      price: Number(x.price ?? 0),
      itemType: 'table',
      flagged: x.flagged || false,
    }));
    const accessoryItems = (accessories || []).map(x => ({
      id: x.id,
      uid: `accessory-${x.id}`,
      title: x.title || `${x.brand ?? ''} ${x.name ?? ''}`.trim() || `Accessory #${x.id}`,
      price: Number(x.price ?? 0),
      itemType: 'accessory',
      flagged: x.flagged || false,
    }));
    return [...cueItems, ...caseItems, ...tableItems, ...accessoryItems];
  }, [cues, cases, tables, accessories]);

  // Sort users by creation date (newest first)
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.dateCreated || 0).getTime();
      const dateB = new Date(b.createdAt || b.dateCreated || 0).getTime();
      return dateB - dateA;
    });
  }, [users]);

  // User management handlers
  const handleToggleBan = async (user) => {
    const updated = await adminUsers.updateUser(user.id, { 
      IsActive: user.isActive === false ? true : false 
    });
    setUsers((s) => s.map((x) => (x.id === updated.id ? updated : x)));
  };

  const handleSaveUser = async (editedUser) => {
    const updatePayload = {
      name: editedUser.name,
      email: editedUser.email,
      role: editedUser.role,
      username: editedUser.username,
    };
    
    // Only include password if it's being changed
    if (editedUser.newPassword) {
      updatePayload.password = editedUser.newPassword;
    }
    
    const updated = await adminUsers.updateUser(editedUser.id, updatePayload);
    if (updated) {
      setUsers((s) => s.map((u) => (u.id === updated.id ? updated : u)));
      setEditingUser(null);
    }
  };

  const handleDeleteUser = async (id) => {
    await adminUsers.deleteUser(id);
    setUsers((s) => s.filter((u) => u.id !== id));
  };

  const handleApproveClubOwner = async (user) => {
    const updated = await adminUsers.updateUser(user.id, { role: 'club_owner' });
    setUsers((s) => s.map((u) => (u.id === updated.id ? updated : u)));
  };

  const handleRejectClubOwner = async (user) => {
    const updated = await adminUsers.updateUser(user.id, { role: 'user' });
    setUsers((s) => s.map((u) => (u.id === updated.id ? updated : u)));
  };

  // Listing management handlers
  const handleFlagListing = async (item) => {
    if (item.itemType === 'cue') {
      const res = await cueService.updateCue(item.id, { flagged: true });
      setCues((s) => s.map((c) => (c.id === res.id ? res : c)));
    } else if (item.itemType === 'case') {
      const res = await cueCaseService.updateCueCase(item.id, { flagged: true });
      setCases((s) => s.map((c) => (c.id === res.id ? res : c)));
    } else if (item.itemType === 'table') {
      const res = await billiardTableService.updateTable(item.id, { flagged: true });
      setTables((s) => s.map((c) => (c.id === res.id ? res : c)));
    } else if (item.itemType === 'accessory') {
      const res = await accessoryService.updateAccessory(item.id, { flagged: true });
      setAccessories((s) => s.map((c) => (c.id === res.id ? res : c)));
    }
  };

  const handleDeleteListing = async (item) => {
    if (item.itemType === 'cue') {
      await cueService.deleteCue(item.id);
      setCues((s) => s.filter((c) => c.id !== item.id));
    } else if (item.itemType === 'case') {
      await cueCaseService.deleteCueCase(item.id);
      setCases((s) => s.filter((c) => c.id !== item.id));
    } else if (item.itemType === 'table') {
      await billiardTableService.deleteTable(item.id);
      setTables((s) => s.filter((c) => c.id !== item.id));
    } else if (item.itemType === 'accessory') {
      await accessoryService.deleteAccessory(item.id);
      setAccessories((s) => s.filter((c) => c.id !== item.id));
    }
  };

  // Moderation handlers
  const handleApproveFlaggedImage = async (flag) => {
    try {
      // Call your moderation API to approve
      // await moderationService.updateFlaggedImage(flag.id, { status: 'approved' });
      setFlaggedImages((s) => s.map((f) => 
        (f.id === flag.id || f.image_id === flag.image_id) 
          ? { ...f, status: 'approved' } 
          : f
      ));
      // Update stats
      const updated = [...flaggedImages];
      const idx = updated.findIndex(f => f.id === flag.id || f.image_id === flag.image_id);
      if (idx >= 0 && updated[idx].status === 'pending') {
        setModerationStats(s => ({ ...s, pending: Math.max(0, s.pending - 1), approved: s.approved + 1 }));
      }
    } catch (err) {
      console.error('Error approving flag:', err);
    }
  };

  const handleRejectFlaggedImage = async (flag) => {
    try {
      // Call your moderation API to reject
      // await moderationService.updateFlaggedImage(flag.id, { status: 'rejected' });
      setFlaggedImages((s) => s.map((f) => 
        (f.id === flag.id || f.image_id === flag.image_id) 
          ? { ...f, status: 'rejected' } 
          : f
      ));
      // Update stats
      const updated = [...flaggedImages];
      const idx = updated.findIndex(f => f.id === flag.id || f.image_id === flag.image_id);
      if (idx >= 0 && updated[idx].status === 'pending') {
        setModerationStats(s => ({ ...s, pending: Math.max(0, s.pending - 1), rejected: s.rejected + 1 }));
      }
    } catch (err) {
      console.error('Error rejecting flag:', err);
    }
  };

  const getFlagReason = (flag) => flag?.flagReason || flag?.reason || flag?.flag_reason || '-';
  const getConfidence = (flag) => {
    const value = flag?.aiConfidenceScore ?? flag?.confidence ?? flag?.confidence_score;
    return typeof value === 'number' ? value.toFixed(2) : '-';
  };

  // Toggle section expansion
  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Calculate dashboard stats
  const dashboardStats = useMemo(() => {
    const activeUsers = users.filter(u => u.isActive !== false).length;
    const bannedCount = users.filter(u => u.isActive === false).length;
    const totalListings = listings.length;
    const flaggedListings = listings.filter(l => l.flagged).length;
    const totalCues = cues.length;
    const totalCases = cases.length;
    const totalTables = tables.length;
    const totalAccessories = accessories.length;
    const pendingClubOwners = users.filter(u => (u.role || '').toLowerCase() === 'club_owner_pending').length;
    const approvedClubOwners = users.filter(u => (u.role || '').toLowerCase() === 'club_owner').length;
    
    return {
      activeUsers,
      bannedCount,
      totalUsers: users.length,
      totalListings,
      flaggedListings,
      totalCues,
      totalCases,
      totalTables,
      totalAccessories,
      pendingClubOwners,
      approvedClubOwners,
      moderationPending: moderationStats.pending,
      moderationTotal: moderationStats.total
    };
  }, [users, listings, cues, cases, tables, accessories, moderationStats]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-4 sticky top-0 z-50">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-2 bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">Admin — Dashboard</h2>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* DASHBOARD SECTION - Key Metrics */}
        <Card className="border border-slate-600 shadow-lg bg-gradient-to-br from-slate-800 to-slate-900">
          <button
            onClick={() => toggleSection('dashboard')}
            className="w-full"
          >
            <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg cursor-pointer hover:opacity-90 transition-opacity">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6" />
                  <CardTitle className="text-xl">📊 Key Metrics</CardTitle>
                </div>
                {expandedSections.dashboard ? 
                  <ChevronUp className="w-5 h-5" /> : 
                  <ChevronDown className="w-5 h-5" />
                }
              </div>
            </CardHeader>
          </button>

          {expandedSections.dashboard && (
            <CardContent className="p-4 sm:p-6">
              {/* Stats Grid - Responsive */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Users Stats */}
                <div className="bg-slate-700/80 rounded-lg p-3 sm:p-4 border-l-4 border-blue-500 hover:bg-slate-700 transition-colors">
                  <Users className="w-5 h-5 text-blue-400 mb-2" />
                  <div className="text-2xl sm:text-3xl font-bold text-blue-400">{dashboardStats.totalUsers}</div>
                  <div className="text-xs sm:text-sm text-slate-300 mt-1">Total Users</div>
                </div>

                <div className="bg-slate-700/80 rounded-lg p-3 sm:p-4 border-l-4 border-green-500 hover:bg-slate-700 transition-colors">
                  <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
                  <div className="text-2xl sm:text-3xl font-bold text-green-400">{dashboardStats.activeUsers}</div>
                  <div className="text-xs sm:text-sm text-slate-300 mt-1">Active</div>
                </div>

                <div className="bg-slate-700/80 rounded-lg p-3 sm:p-4 border-l-4 border-red-500 hover:bg-slate-700 transition-colors">
                  <XCircle className="w-5 h-5 text-red-400 mb-2" />
                  <div className="text-2xl sm:text-3xl font-bold text-red-400">{dashboardStats.bannedCount}</div>
                  <div className="text-xs sm:text-sm text-slate-300 mt-1">Banned</div>
                </div>

                <div className="bg-slate-700/80 rounded-lg p-3 sm:p-4 border-l-4 border-yellow-500 hover:bg-slate-700 transition-colors">
                  <Clock className="w-5 h-5 text-yellow-400 mb-2" />
                  <div className="text-2xl sm:text-3xl font-bold text-yellow-400">{dashboardStats.pendingClubOwners}</div>
                  <div className="text-xs sm:text-sm text-slate-300 mt-1">Pending Owners</div>
                </div>

                {/* Listings Stats */}
                <div className="bg-slate-700/80 rounded-lg p-3 sm:p-4 border-l-4 border-purple-500 hover:bg-slate-700 transition-colors">
                  <ImageIcon className="w-5 h-5 text-purple-400 mb-2" />
                  <div className="text-2xl sm:text-3xl font-bold text-purple-400">{dashboardStats.totalListings}</div>
                  <div className="text-xs sm:text-sm text-slate-300 mt-1">Total Listings</div>
                </div>

                <div className="bg-slate-700/80 rounded-lg p-3 sm:p-4 border-l-4 border-orange-500 hover:bg-slate-700 transition-colors">
                  <AlertCircle className="w-5 h-5 text-orange-400 mb-2" />
                  <div className="text-2xl sm:text-3xl font-bold text-orange-400">{dashboardStats.flaggedListings}</div>
                  <div className="text-xs sm:text-sm text-slate-300 mt-1">Flagged</div>
                </div>

                {/* Item Type Breakdown */}
                <div className="bg-slate-700/80 rounded-lg p-3 sm:p-4 border-l-4 border-indigo-500 hover:bg-slate-700 transition-colors">
                  <div className="text-xs font-bold text-indigo-400 mb-2">CUES</div>
                  <div className="text-2xl sm:text-3xl font-bold text-indigo-400">{dashboardStats.totalCues}</div>
                  <div className="text-xs sm:text-sm text-slate-300 mt-1">Items</div>
                </div>

                <div className="bg-slate-700/80 rounded-lg p-3 sm:p-4 border-l-4 border-pink-500 hover:bg-slate-700 transition-colors">
                  <div className="text-xs font-bold text-pink-400 mb-2">CASES</div>
                  <div className="text-2xl sm:text-3xl font-bold text-pink-400">{dashboardStats.totalCases}</div>
                  <div className="text-xs sm:text-sm text-slate-300 mt-1">Items</div>
                </div>

                <div className="bg-slate-700/80 rounded-lg p-3 sm:p-4 border-l-4 border-cyan-500 hover:bg-slate-700 transition-colors">
                  <div className="text-xs font-bold text-cyan-400 mb-2">TABLES</div>
                  <div className="text-2xl sm:text-3xl font-bold text-cyan-400">{dashboardStats.totalTables}</div>
                  <div className="text-xs sm:text-sm text-slate-300 mt-1">Items</div>
                </div>

                <div className="bg-slate-700/80 rounded-lg p-3 sm:p-4 border-l-4 border-teal-500 hover:bg-slate-700 transition-colors">
                  <div className="text-xs font-bold text-teal-400 mb-2">ACCESSORIES</div>
                  <div className="text-2xl sm:text-3xl font-bold text-teal-400">{dashboardStats.totalAccessories}</div>
                  <div className="text-xs sm:text-sm text-slate-300 mt-1">Items</div>
                </div>

                {/* Moderation Stats */}
                <div className="bg-slate-700/80 rounded-lg p-3 sm:p-4 border-l-4 border-red-600 hover:bg-slate-700 transition-colors">
                  <Shield className="w-5 h-5 text-red-400 mb-2" />
                  <div className="text-2xl sm:text-3xl font-bold text-red-400">{dashboardStats.moderationPending}</div>
                  <div className="text-xs sm:text-sm text-slate-300 mt-1">Flagged - Pending</div>
                </div>

                <div className="bg-slate-700/80 rounded-lg p-3 sm:p-4 border-l-4 border-red-400 hover:bg-slate-700 transition-colors">
                  <Shield className="w-5 h-5 text-red-400 mb-2" />
                  <div className="text-2xl sm:text-3xl font-bold text-red-400">{dashboardStats.moderationTotal}</div>
                  <div className="text-xs sm:text-sm text-slate-300 mt-1">Flagged - Total</div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* MODERATION SECTION */}
        {(flaggedImages.length > 0 || bannedUsers.length > 0) && (
          <Card className="border border-slate-600 shadow-lg bg-gradient-to-br from-slate-800 to-slate-900">
            <button
              onClick={() => toggleSection('moderation')}
              className="w-full"
            >
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white cursor-pointer hover:opacity-90 transition-opacity rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6" />
                    <CardTitle className="text-xl">🛡️ Moderation Center</CardTitle>
                  </div>
                  {expandedSections.moderation ? 
                    <ChevronUp className="w-5 h-5" /> : 
                    <ChevronDown className="w-5 h-5" />
                  }
                </div>
              </CardHeader>
            </button>

            {expandedSections.moderation && (
              <CardContent className="p-4 sm:p-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-700 rounded-lg p-4 border-2 border-blue-500 shadow-sm">
                    <div className="text-2xl font-bold text-blue-400">{moderationStats.total}</div>
                    <div className="text-xs text-slate-300 font-medium mt-1">Total Flags</div>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4 border-2 border-yellow-500 shadow-sm">
                    <div className="text-2xl font-bold text-yellow-400">{moderationStats.pending}</div>
                    <div className="text-xs text-slate-300 font-medium mt-1">⏳ Pending</div>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4 border-2 border-green-500 shadow-sm">
                    <div className="text-2xl font-bold text-green-400">{moderationStats.approved}</div>
                    <div className="text-xs text-slate-300 font-medium mt-1">✓ Approved</div>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4 border-2 border-red-500 shadow-sm">
                    <div className="text-2xl font-bold text-red-400">{moderationStats.rejected}</div>
                    <div className="text-xs text-slate-300 font-medium mt-1">✕ Rejected</div>
                  </div>
                </div>

                <Tabs defaultValue="blocked" className="w-full">
                  <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-0 bg-slate-700">
                    <TabsTrigger value="blocked" className="data-[state=active]:bg-slate-600 data-[state=active]:text-blue-400">
                      🚫 Blocked Images ({flaggedImages.length})
                    </TabsTrigger>
                    <TabsTrigger value="banned" className="data-[state=active]:bg-slate-600 data-[state=active]:text-red-400">
                      👤 Banned Users ({bannedUsers.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="blocked" className="mt-4">
                    {flaggedImages.length > 0 ? (
                      <div className="rounded-lg border border-slate-600 overflow-x-auto bg-slate-800">
                        <Table className="min-w-[720px] text-xs sm:text-sm">
                          <TableHeader>
                            <TableRow className="bg-gradient-to-r from-slate-700 to-slate-600 border-b-2 border-slate-500">
                              <TableHead className="px-3 sm:px-4 py-3 text-xs uppercase font-bold text-slate-200 tracking-wider">Image</TableHead>
                              <TableHead className="px-3 sm:px-4 py-3 text-xs uppercase font-bold text-slate-200 tracking-wider">Reason</TableHead>
                              <TableHead className="px-3 sm:px-4 py-3 text-xs uppercase font-bold text-slate-200 tracking-wider">Status</TableHead>
                              <TableHead className="px-3 sm:px-4 py-3 text-xs uppercase font-bold text-slate-200 tracking-wider">Confidence</TableHead>
                              <TableHead className="px-3 sm:px-4 py-3 text-xs uppercase font-bold text-slate-200 tracking-wider">Reported By</TableHead>
                              <TableHead className="px-3 sm:px-4 py-3 text-xs uppercase font-bold text-slate-200 tracking-wider">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-slate-700">
                            {flaggedImages.slice(0, 10).map((flag, idx) => (
                              <TableRow key={flag.id || flag.image_id || flag.flag_id} className={idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750'}>
                                <TableCell className="px-3 sm:px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-purple-400" />
                                    <span className="text-xs font-medium text-slate-300">#{flag.id ?? flag.image_id ?? '-'}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-3 sm:px-4 py-3 text-xs text-slate-400">{getFlagReason(flag)}</TableCell>
                                <TableCell className="px-3 sm:px-4 py-3">
                                  <Badge 
                                    className={`text-xs font-bold capitalize ${
                                      (flag.status || 'pending') === 'approved' ? 'bg-green-900 text-green-300 border border-green-700' :
                                      (flag.status || 'pending') === 'rejected' ? 'bg-red-900 text-red-300 border border-red-700' :
                                      'bg-yellow-900 text-yellow-300 border border-yellow-700'
                                    }`}
                                  >
                                    {(flag.status || 'pending') === 'pending' && '⏳ '}{flag.status || 'pending'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="px-3 sm:px-4 py-3">
                                  <span className="text-xs font-semibold text-slate-200">{getConfidence(flag)}</span>
                                </TableCell>
                                <TableCell className="px-3 sm:px-4 py-3 text-xs text-slate-400">{flag.userName || flag.username || flag.display_name || '—'}</TableCell>
                                <TableCell className="px-3 sm:px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    {(flag.status || 'pending') === 'pending' ? (
                                      <>
                                        <button
                                          onClick={() => handleApproveFlaggedImage(flag)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
                                        >
                                          ✓ Approve
                                        </button>
                                        <button
                                          onClick={() => handleRejectFlaggedImage(flag)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                                        >
                                          ✕ Reject
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-xs text-slate-500 italic">Resolved</span>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="py-12 text-center bg-slate-700 rounded-lg border-2 border-green-700">
                        <div className="text-5xl mb-3">✨</div>
                        <p className="text-green-400 font-semibold">No flagged images</p>
                        <p className="text-green-300 text-sm">All content is clean and approved!</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="banned" className="mt-4">
                    {bannedUsers.length > 0 ? (
                      <div className="rounded-lg border border-slate-600 overflow-x-auto bg-slate-800">
                        <Table className="min-w-[640px] text-xs sm:text-sm">
                          <TableHeader>
                            <TableRow className="bg-gradient-to-r from-slate-700 to-slate-600 border-b-2 border-slate-500">
                              <TableHead className="px-3 sm:px-4 py-3 text-xs uppercase font-bold text-slate-200 tracking-wider">User</TableHead>
                              <TableHead className="px-3 sm:px-4 py-3 text-xs uppercase font-bold text-slate-200 tracking-wider">Email</TableHead>
                              <TableHead className="px-3 sm:px-4 py-3 text-xs uppercase font-bold text-slate-200 tracking-wider">Total Flags</TableHead>
                              <TableHead className="px-3 sm:px-4 py-3 text-xs uppercase font-bold text-slate-200 tracking-wider">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-slate-700">
                            {bannedUsers.slice(0, 10).map((user, idx) => (
                              <TableRow key={user.id || user.user_id || user.email} className={idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750'}>
                                <TableCell className="px-3 sm:px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-red-400" />
                                    <span className="text-xs font-medium text-slate-300">{user.username || user.display_name || user.name || '—'}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-3 sm:px-4 py-3 text-xs text-slate-400">{user.email || '—'}</TableCell>
                                <TableCell className="px-3 sm:px-4 py-3">
                                  <span className="inline-block px-2.5 py-1 bg-red-900 text-red-300 text-xs font-bold rounded-full border border-red-700">
                                    {user.total_flags ?? user.flagCount ?? 0}
                                  </span>
                                </TableCell>
                                <TableCell className="px-3 sm:px-4 py-3">
                                  <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors">
                                    👁️ View
                                  </button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="py-12 text-center bg-slate-700 rounded-lg border-2 border-green-700">
                        <div className="text-5xl mb-3">😊</div>
                        <p className="text-green-400 font-semibold">No banned users</p>
                        <p className="text-green-300 text-sm">Community is in great shape!</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            )}
          </Card>
        )}

        {/* USERS MANAGEMENT SECTION - Collapsible on mobile */}
        <Card className="border border-slate-600 shadow-lg bg-gradient-to-br from-slate-800 to-slate-900">
          <button
            onClick={() => toggleSection('users')}
            className="w-full"
          >
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white cursor-pointer hover:opacity-90 transition-opacity rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  <CardTitle className="text-xl">👥 Users Management</CardTitle>
                </div>
                {expandedSections.users ? 
                  <ChevronUp className="w-5 h-5" /> : 
                  <ChevronDown className="w-5 h-5" />
                }
              </div>
            </CardHeader>
          </button>

          {expandedSections.users && (
            <CardContent className="p-0">
              <UsersManagementView
                users={sortedUsers}
                query={userQuery}
                onQueryChange={setUserQuery}
                page={userPage}
                onPageChange={setUserPage}
                onEdit={setEditingUser}
                onToggleBan={handleToggleBan}
                onDelete={handleDeleteUser}
                onApproveClubOwner={handleApproveClubOwner}
                onRejectClubOwner={handleRejectClubOwner}
              />
            </CardContent>
          )}
        </Card>

        {/* LISTINGS MANAGEMENT SECTION - Collapsible on mobile */}
        <Card className="border border-slate-600 shadow-lg bg-gradient-to-br from-slate-800 to-slate-900">
          <button
            onClick={() => toggleSection('listings')}
            className="w-full"
          >
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white cursor-pointer hover:opacity-90 transition-opacity rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-6 h-6" />
                  <CardTitle className="text-xl">📋 Listings Management</CardTitle>
                </div>
                {expandedSections.listings ? 
                  <ChevronUp className="w-5 h-5" /> : 
                  <ChevronDown className="w-5 h-5" />
                }
              </div>
            </CardHeader>
          </button>

          {expandedSections.listings && (
            <CardContent className="p-0">
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
            </CardContent>
          )}
        </Card>
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

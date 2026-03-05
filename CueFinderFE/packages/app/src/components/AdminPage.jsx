import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Trash2, Flag, UserCheck, UserX, Edit, Shield, Users, Package,
  AlertTriangle, ChevronLeft, ChevronRight, Ban, Image as ImageIcon, TrendingUp,
  ShoppingBag, CheckSquare, Activity, BadgeCheck,
} from 'lucide-react';
import VerifiedBadge from './VerifiedBadge';
import * as adminUsers from '../api/adminUsersService';
import * as cueService from '../api/cueService';
import * as cueCaseService from '../api/cueCaseService';
import * as billiardTableService from '../api/billiardTableService';
import * as accessoryService from '../api/accessoryService';
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
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';

/* ── helpers ───────────────────────────────────────────── */

function getMonthKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function last6MonthKeys() {
  const keys = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

function shortMonth(key) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString(undefined, { month: 'short' });
}

const PIE_COLORS = ['#1e9eff', '#22c55e', '#f59e0b', '#a855f7'];

/* ── Stat card ─────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, colorClass = '', borderClass = '' }) {
  return (
    <Card className={borderClass}>
      <CardContent className="pt-4 pb-4 px-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-xl font-bold ${colorClass}`}>{value}</p>
          </div>
          <Icon className={`w-7 h-7 ${colorClass || 'text-muted-foreground'}`} />
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Main component ────────────────────────────────────── */
export default function AdminPage({ onBack }) {
  const [users, setUsers] = useState([]);
  const [cues, setCues] = useState([]);
  const [cases, setCases] = useState([]);
  const [tables, setTables] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [query, setQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [userPage, setUserPage] = useState(1);
  const [listingPage, setListingPage] = useState(1);
  const [flaggedImages, setFlaggedImages] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [moderationStats, setModerationStats] = useState({ total: 0, pending: 0, rejected: 0, approved: 0 });
  const [actionError, setActionError] = useState(null);
  const itemsPerPage = 5;

  useEffect(() => {
    async function load() {
      try {
        const [u, c, k, t, a] = await Promise.all([
          adminUsers.getAllUsers().catch(() => []),
          cueService.getCues().catch(() => []),
          cueCaseService.getCueCases().catch(() => []),
          billiardTableService.getTables().catch(() => []),
          accessoryService.getAccessories().catch(() => []),
        ]);
        setUsers(u || []);
        setCues(c || []);
        setCases(k || []);
        setTables(Array.isArray(t) ? t : (t?.items || t?.data || []));
        setAccessories(Array.isArray(a) ? a : (a?.items || a?.data || []));

        try {
          const [flaggedData, bannedData] = await Promise.all([
            moderationService.getFlaggedImages().catch(() => ({ items: [], total: 0 })),
            moderationService.getBannedUsers().catch(() => ({ items: [], total: 0 })),
          ]);
          setFlaggedImages(flaggedData?.items || []);
          setBannedUsers(bannedData?.items || []);
          const pending  = flaggedData?.items?.filter(f => f.status === 'pending')?.length  || 0;
          const rejected = flaggedData?.items?.filter(f => f.status === 'rejected')?.length || 0;
          const approved = flaggedData?.items?.filter(f => f.status === 'approved')?.length || 0;
          setModerationStats({ total: flaggedData?.total || 0, pending, rejected, approved });
        } catch { /* non-fatal */ }
      } catch (error) {
        console.error('AdminPage: Fatal error loading data:', error);
      }
    }
    load();
  }, []);

  useEffect(() => { setUserPage(1); }, [userQuery]);
  useEffect(() => { setListingPage(1); }, [query]);

  /* ── derived data ──────────────────────────────────── */
  const listings = useMemo(() => {
    const map = (arr, type) => (arr || []).map(x => ({
      id: x.id,
      uid: `${type}-${x.id}`,
      title: x.title || `${x.brand ?? ''} ${x.model ?? x.type ?? ''}`.trim() || `${type} #${x.id}`,
      price: Number(x.price ?? 0),
      itemType: type,
      flagged: x.isFlagged || x.flagged || false,
      userId: x.userId,
      isSold: x.isSold || x.is_sold || false,
      createdAt: x.createdAt || x.created_at || null,
    }));
    return [
      ...map(cues, 'cue'),
      ...map(cases, 'case'),
      ...map(tables, 'table'),
      ...map(accessories, 'accessory'),
    ];
  }, [cues, cases, tables, accessories]);

  const flaggedListings = useMemo(() => listings.filter(l => l.flagged), [listings]);
  const activeListings  = useMemo(() => listings.filter(l => !l.isSold), [listings]);
  const soldListings    = useMemo(() => listings.filter(l => l.isSold), [listings]);

  const usersWithFlaggedContent = useMemo(() => {
    const ids = new Set(flaggedListings.map(l => l.userId).filter(Boolean));
    return users.filter(u => ids.has(u.id));
  }, [users, flaggedListings]);

  const filteredListings = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter(l => !q || l.title.toLowerCase().includes(q) || String(l.price).includes(q));
  }, [listings, query]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    return users
      .filter(u => !q || (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [users, userQuery]);

  /* ── chart data ────────────────────────────────────── */
  const monthKeys = last6MonthKeys();

  const listingsByMonth = useMemo(() => {
    const counts = Object.fromEntries(monthKeys.map(k => [k, 0]));
    listings.forEach(l => {
      const k = getMonthKey(l.createdAt);
      if (k && counts[k] !== undefined) counts[k]++;
    });
    return monthKeys.map(k => ({ month: shortMonth(k), listings: counts[k] }));
  }, [listings, monthKeys]);

  const listingsByType = useMemo(() => [
    { name: 'Cues',        value: cues.length },
    { name: 'Cases',       value: cases.length },
    { name: 'Tables',      value: tables.length },
    { name: 'Accessories', value: accessories.length },
  ], [cues, cases, tables, accessories]);

  const recentListings = useMemo(() =>
    [...listings]
      .filter(l => l.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8),
    [listings]
  );

  /* ── pagination ────────────────────────────────────── */
  const totalUserPages    = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers    = useMemo(() => filteredUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage), [filteredUsers, userPage]);
  const totalListingPages = Math.ceil(filteredListings.length / itemsPerPage);
  const paginatedListings = useMemo(() => filteredListings.slice((listingPage - 1) * itemsPerPage, listingPage * itemsPerPage), [filteredListings, listingPage]);

  /* ── actions ───────────────────────────────────────── */
  const toggleBan = async (u) => {
    try {
      const updated = await adminUsers.updateUser(u.id, { IsActive: u.isActive === false });
      setUsers(s => s.map(x => (x.id === updated.id ? updated : x)));
    } catch (err) {
      console.error('Error toggling user ban:', err);
      setActionError(err.message || 'Failed to update user status. Check the console for details.');
      setTimeout(() => setActionError(null), 6000);
    }
  };

  const toggleVerify = async (u) => {
    try {
      const updated = await adminUsers.updateUser(u.id, { IsVerified: !u.isVerified });
      setUsers(s => s.map(x => (x.id === updated.id ? updated : x)));
    } catch (err) {
      console.error('Error toggling user verification:', err);
      setActionError(err.message || 'Failed to update user verification. Check the console for details.');
      setTimeout(() => setActionError(null), 6000);
    }
  };

  const saveUser = async () => {
    if (!editingUser) return;
    const updated = await adminUsers.updateUser(editingUser.id, { name: editingUser.name, email: editingUser.email, role: editingUser.role });
    if (updated) { setUsers(s => s.map(u => (u.id === updated.id ? updated : u))); setEditingUser(null); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user and all their data permanently?')) return;
    await adminUsers.deleteUser(id);
    setUsers(s => s.filter(u => u.id !== id));
  };

  const removeListing = async (item) => {
    if (!window.confirm(`Delete this ${item.itemType} listing permanently?`)) return;
    if (item.itemType === 'cue')        { await cueService.deleteCue(item.id);             setCues(s => s.filter(c => c.id !== item.id)); }
    else if (item.itemType === 'case')  { await cueCaseService.deleteCueCase(item.id);      setCases(s => s.filter(c => c.id !== item.id)); }
    else if (item.itemType === 'table') { await billiardTableService.deleteTable(item.id);  setTables(s => s.filter(c => c.id !== item.id)); }
    else                                { await accessoryService.deleteAccessory(item.id);  setAccessories(s => s.filter(c => c.id !== item.id)); }
  };

  const flagListing = async (item) => {
    if (item.itemType === 'cue')       { const r = await cueService.updateCue(item.id, { flagged: true });           setCues(s => s.map(c => (c.id === r.id ? r : c))); }
    else if (item.itemType === 'case') { const r = await cueCaseService.updateCueCase(item.id, { flagged: true });   setCases(s => s.map(c => (c.id === r.id ? r : c))); }
  };

  /* ── listing table row (md+ screens) ──────────────── */
  const ListingRow = ({ item }) => (
    <TableRow key={item.uid}>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs shrink-0">{item.itemType.toUpperCase()}</Badge>
          <span className="font-medium truncate max-w-[180px]">{item.title}</span>
        </div>
      </TableCell>
      <TableCell>€{item.price.toFixed(2)}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          {item.flagged && <Badge variant="warning">FLAGGED</Badge>}
          {item.isSold && <Badge variant="secondary">SOLD</Badge>}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          {!item.flagged && (
            <Button variant="ghost" size="sm" onClick={() => flagListing(item)}>
              <Flag className="w-4 h-4 text-yellow-500" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => removeListing(item)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  /* ── mobile card: listing ──────────────────────────── */
  const MobileListingCard = ({ item }) => (
    <div className="p-3 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="text-xs shrink-0">{item.itemType.toUpperCase()}</Badge>
            <span className="font-medium text-sm truncate">{item.title}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-sm font-medium">€{item.price.toFixed(2)}</span>
            {item.flagged && <Badge variant="warning" className="text-xs">Flagged</Badge>}
            {item.isSold  && <Badge variant="secondary" className="text-xs">Sold</Badge>}
          </div>
        </div>
        <div className="flex gap-0.5 shrink-0">
          {!item.flagged && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => flagListing(item)}>
              <Flag className="w-4 h-4 text-yellow-500" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeListing(item)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );

  /* ── mobile card: user ─────────────────────────────── */
  const MobileUserCard = ({ u }) => (
    <div className="p-3 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-sm">{u.name}</span>
            <VerifiedBadge isVerified={u.isVerified} />
            {usersWithFlaggedContent.some(x => x.id === u.id) && (
              <Flag className="w-3.5 h-3.5 text-orange-500" title="Has flagged content" />
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">{u.email}</div>
          {u.createdAt && <div className="text-xs text-muted-foreground mt-0.5">Joined {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
              {u.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
              {u.role}
            </Badge>
            {u.isActive === false
              ? <Badge variant="destructive" className="text-xs">Inactive</Badge>
              : <Badge variant="success" className="text-xs">Active</Badge>}
          </div>
        </div>
        <div className="flex gap-0.5 shrink-0">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingUser({ ...u })}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleVerify(u)} title={u.isVerified ? 'Remove verification' : 'Verify seller'}>
            <BadgeCheck className={`w-4 h-4 ${u.isVerified ? 'text-amber-500' : 'text-muted-foreground'}`} />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleBan(u)}>
            {u.isActive === false
              ? <UserCheck className="w-4 h-4 text-green-500" />
              : <UserX className="w-4 h-4 text-orange-500" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => deleteUser(u.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );

  /* ── mobile card: blocked image ────────────────────── */
  const MobileBlockedImageCard = ({ img }) => (
    <div className="p-3 border-b border-border last:border-0 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-sm">{img.user_name || 'Unknown'}</div>
          {img.user_email && <div className="text-xs text-muted-foreground">{img.user_email}</div>}
          {img.user_is_banned && <Badge variant="destructive" className="text-xs mt-1">Banned</Badge>}
        </div>
        <div>
          {img.status === 'pending'  && <Badge variant="warning" className="text-xs">Pending</Badge>}
          {img.status === 'rejected' && <Badge variant="destructive" className="text-xs">Rejected</Badge>}
          {img.status === 'approved' && <Badge variant="success" className="text-xs">Approved</Badge>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs">{img.flag_reason || 'Unknown'}</Badge>
        {img.is_ai_flagged && <span className="text-xs text-muted-foreground">AI: {(img.ai_confidence * 100).toFixed(0)}%</span>}
        <span className="text-xs text-muted-foreground">{new Date(img.flagged_at).toLocaleDateString()}</span>
      </div>
      {(img.cue_id || img.cue_case_id) && (
        <div className="text-xs text-muted-foreground">
          {img.cue_id ? `Cue #${img.cue_id}` : `Case #${img.cue_case_id}`}
        </div>
      )}
    </div>
  );

  /* ── mobile card: banned user ──────────────────────── */
  const MobileBannedUserCard = ({ u }) => (
    <div className="p-3 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-sm">{u.username}</div>
          {u.display_name && <div className="text-xs text-muted-foreground">{u.display_name}</div>}
          <div className="text-xs text-muted-foreground">{u.email}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Joined {new Date(u.created_at).toLocaleDateString()}</div>
        </div>
        <div className="flex gap-3 shrink-0">
          <div className="text-center">
            <Badge variant="outline" className="text-xs">{u.flagged_images_count || 0}</Badge>
            <div className="text-xs text-muted-foreground mt-0.5">flagged</div>
          </div>
          <div className="text-center">
            <Badge variant="destructive" className="text-xs">{u.rejected_images_count || 0}</Badge>
            <div className="text-xs text-muted-foreground mt-0.5">rejected</div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── pagination controls ───────────────────────────── */
  const Pagination = ({ page, total, onChange }) => total <= 1 ? null : (
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm text-muted-foreground">Page {page} of {total}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onChange(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => onChange(p => Math.min(total, p + 1))} disabled={page === total}><ChevronRight className="w-4 h-4" /></Button>
      </div>
    </div>
  );

  const typeFilter = (type) => filteredListings.filter(l => l.itemType === type);

  /* ── render ────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 shrink-0">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary shrink-0" />
              <h1 className="text-lg md:text-2xl font-bold">Admin Dashboard</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6">

        {/* ── Row 1: Core stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Users"     value={users.length}          icon={Users}       />
          <StatCard label="Total Listings"  value={listings.length}       icon={Package}     />
          <StatCard label="Active"          value={activeListings.length} icon={Activity}    colorClass="text-green-500"   borderClass="border-green-500/30" />
          <StatCard label="Sold"            value={soldListings.length}   icon={CheckSquare} colorClass="text-blue-500"    borderClass="border-blue-500/30" />
        </div>

        {/* ── Row 2: Moderation stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Flagged"         value={flaggedListings.length}    icon={AlertTriangle} colorClass="text-orange-500" borderClass="border-orange-500/30" />
          <StatCard label="Pending Review"  value={moderationStats.pending}   icon={ImageIcon}     colorClass="text-yellow-500" borderClass="border-yellow-500/30" />
          <StatCard label="Banned Users"    value={bannedUsers.length}        icon={UserX}         colorClass="text-red-500"    borderClass="border-red-500/30" />
          <StatCard label="Blocked Images"  value={moderationStats.total}     icon={Ban}           colorClass="text-purple-500" borderClass="border-purple-500/30" />
        </div>

        {/* ── Flagged alert ── */}
        {flaggedListings.length > 0 && (
          <Alert className="border-orange-500/50 bg-orange-50 dark:bg-orange-950">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              <strong>{flaggedListings.length} listing(s)</strong> flagged for review.
              {usersWithFlaggedContent.length > 0 && (
                <span> <strong>{usersWithFlaggedContent.length} user(s)</strong> have uploaded flagged content.</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* ── Action error alert ── */}
        {actionError && (
          <Alert className="border-red-500/50 bg-red-50 dark:bg-red-950">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              <strong>Action failed:</strong> {actionError}
            </AlertDescription>
          </Alert>
        )}

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                Listings — Last 6 Months
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={listingsByMonth} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--foreground)' }}
                  />
                  <Line type="monotone" dataKey="listings" stroke="#1e9eff" strokeWidth={2.5} dot={{ r: 4, fill: '#1e9eff' }} name="Listings" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <ShoppingBag className="w-5 h-5 text-primary" />
                By Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={listingsByType}
                    cx="50%" cy="50%"
                    innerRadius={48} outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name} ${value}` : ''}
                    labelLine={false}
                  >
                    {listingsByType.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
                {listingsByType.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: PIE_COLORS[i] }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Bar chart + Recent Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Package className="w-5 h-5" />
                Listings by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={listingsByType} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                    {listingsByType.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Activity className="w-5 h-5" />
                Recent Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {recentListings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No listings yet.</p>
                ) : recentListings.map(item => (
                  <div key={item.uid} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-xs shrink-0">{item.itemType.toUpperCase()}</Badge>
                      <span className="text-sm font-medium truncate">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <span className="text-sm text-muted-foreground">€{item.price.toFixed(2)}</span>
                      {item.createdAt && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Image moderation overview ── */}
        {(flaggedImages.length > 0 || bannedUsers.length > 0) && (
          <Card className="border-purple-500/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Shield className="w-5 h-5 text-purple-500" />
                Image Moderation Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="blocked" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="blocked">Blocked ({flaggedImages.length})</TabsTrigger>
                  <TabsTrigger value="banned">Banned ({bannedUsers.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="blocked" className="mt-4">
                  {/* Desktop table */}
                  <div className="hidden md:block rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Image</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {flaggedImages.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No blocked images</TableCell></TableRow>
                        ) : flaggedImages.slice(0, 10).map((img) => (
                          <TableRow key={img.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{img.user_name || 'Unknown'}</div>
                                {img.user_email && <div className="text-sm text-muted-foreground">{img.user_email}</div>}
                                {img.user_is_banned && <Badge variant="destructive" className="mt-1">BANNED</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-mono text-muted-foreground">{img.file_name}</div>
                              {img.cue_id && <div className="text-xs">Cue #{img.cue_id}</div>}
                              {img.cue_case_id && <div className="text-xs">Case #{img.cue_case_id}</div>}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{img.flag_reason || 'Unknown'}</Badge>
                              {img.is_ai_flagged && <div className="text-xs text-muted-foreground mt-1">AI: {(img.ai_confidence * 100).toFixed(0)}%</div>}
                            </TableCell>
                            <TableCell>
                              {img.status === 'pending'  && <Badge variant="warning">PENDING</Badge>}
                              {img.status === 'rejected' && <Badge variant="destructive">REJECTED</Badge>}
                              {img.status === 'approved' && <Badge variant="success">APPROVED</Badge>}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{new Date(img.flagged_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {flaggedImages.length > 10 && (
                      <div className="p-4 text-center text-sm text-muted-foreground border-t">Showing 10 of {flaggedImages.length}</div>
                    )}
                  </div>
                  {/* Mobile cards */}
                  <div className="md:hidden rounded-md border divide-y-0">
                    {flaggedImages.length === 0
                      ? <p className="p-4 text-sm text-muted-foreground">No blocked images</p>
                      : flaggedImages.slice(0, 10).map(img => <MobileBlockedImageCard key={img.id} img={img} />)
                    }
                    {flaggedImages.length > 10 && (
                      <div className="p-3 text-center text-sm text-muted-foreground border-t">Showing 10 of {flaggedImages.length}</div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="banned" className="mt-4">
                  {/* Desktop table */}
                  <div className="hidden md:block rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Flagged</TableHead>
                          <TableHead>Rejected</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bannedUsers.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No banned users</TableCell></TableRow>
                        ) : bannedUsers.slice(0, 10).map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div className="font-medium">{u.username}</div>
                              {u.display_name && <div className="text-sm text-muted-foreground">{u.display_name}</div>}
                            </TableCell>
                            <TableCell className="text-sm">{u.email}</TableCell>
                            <TableCell><Badge variant="outline">{u.flagged_images_count || 0}</Badge></TableCell>
                            <TableCell><Badge variant="destructive">{u.rejected_images_count || 0}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Mobile cards */}
                  <div className="md:hidden rounded-md border">
                    {bannedUsers.length === 0
                      ? <p className="p-4 text-sm text-muted-foreground">No banned users</p>
                      : bannedUsers.slice(0, 10).map(u => <MobileBannedUserCard key={u.id} u={u} />)
                    }
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* ── Users + Listings management ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

          {/* Users */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Users className="w-5 h-5" />
                Users Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Input placeholder="Search by name or email" value={userQuery} onChange={e => setUserQuery(e.target.value)} className="flex-1" />
                <Badge variant="secondary" className="shrink-0">{filteredUsers.length}/{users.length}</Badge>
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No users found</TableCell></TableRow>
                    ) : paginatedUsers.map(u => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">{u.name}</span>
                              <VerifiedBadge isVerified={u.isVerified} />
                              {usersWithFlaggedContent.some(x => x.id === u.id) && (
                                <Flag className="w-4 h-4 text-orange-500" title="Has flagged content" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{u.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                            {u.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.isActive === false
                            ? <Badge variant="destructive">INACTIVE</Badge>
                            : <Badge variant="success">ACTIVE</Badge>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setEditingUser({ ...u })}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => toggleVerify(u)} title={u.isVerified ? 'Remove verification' : 'Verify seller'}>
                              <BadgeCheck className={`w-4 h-4 ${u.isVerified ? 'text-amber-500' : 'text-muted-foreground'}`} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => toggleBan(u)}>
                              {u.isActive === false
                                ? <UserCheck className="w-4 h-4 text-green-500" />
                                : <UserX className="w-4 h-4 text-orange-500" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteUser(u.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden rounded-md border">
                {paginatedUsers.length === 0
                  ? <p className="p-4 text-sm text-muted-foreground">No users found</p>
                  : paginatedUsers.map(u => <MobileUserCard key={u.id} u={u} />)
                }
              </div>

              <Pagination page={userPage} total={totalUserPages} onChange={setUserPage} />
            </CardContent>
          </Card>

          {/* Listings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Package className="w-5 h-5" />
                Listings Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Input placeholder="Search by title or price" value={query} onChange={e => setQuery(e.target.value)} className="flex-1" />
                <Badge variant="secondary" className="shrink-0">{filteredListings.length}/{listings.length}</Badge>
              </div>

              <Tabs defaultValue="all" className="w-full">
                {/* Scrollable tabs on mobile */}
                <div className="overflow-x-auto -mx-1 px-1">
                  <TabsList className="flex w-max min-w-full">
                    <TabsTrigger value="all"       className="flex-1 text-xs px-2">All</TabsTrigger>
                    <TabsTrigger value="cue"       className="flex-1 text-xs px-2">Cues</TabsTrigger>
                    <TabsTrigger value="case"      className="flex-1 text-xs px-2">Cases</TabsTrigger>
                    <TabsTrigger value="table"     className="flex-1 text-xs px-2">Tables</TabsTrigger>
                    <TabsTrigger value="accessory" className="flex-1 text-xs px-2">Acc.</TabsTrigger>
                  </TabsList>
                </div>

                {['all', 'cue', 'case', 'table', 'accessory'].map(tab => {
                  const items = tab === 'all' ? paginatedListings : typeFilter(tab);
                  return (
                    <TabsContent key={tab} value={tab} className="mt-3">
                      {/* Desktop table */}
                      <div className="hidden sm:block rounded-md border">
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
                            {items.length === 0 ? (
                              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No listings found</TableCell></TableRow>
                            ) : items.map(item => <ListingRow key={item.uid} item={item} />)}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile cards */}
                      <div className="sm:hidden rounded-md border">
                        {items.length === 0
                          ? <p className="p-4 text-sm text-muted-foreground">No listings found</p>
                          : items.map(item => <MobileListingCard key={item.uid} item={item} />)
                        }
                      </div>

                      {tab === 'all' && (
                        <Pagination page={listingPage} total={totalListingPages} onChange={setListingPage} />
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={true} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editingUser.role} onValueChange={value => setEditingUser({ ...editingUser, role: value })}>
                  <SelectTrigger id="edit-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setEditingUser(null)} className="w-full sm:w-auto">Cancel</Button>
              <Button onClick={saveUser} className="w-full sm:w-auto">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

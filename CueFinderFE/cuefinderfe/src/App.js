import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './App.css';
import CueList from './components/CueList';
import CueDetail from './components/CueDetail';
import CueFormModal from './components/CueFormModal';
import AdminPage from './components/AdminPage';
import LoginPage from './components/LoginPage';
import UserProfile from './components/UserProfile';
import OAuthCallback from './components/OAuthCallback';
import { AuthProvider, useAuth } from './auth/AuthContext';
import * as cueService from './api/cueService';

function AppInner() {
  const [cues, setCues] = useState([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showAddModal, setShowAddModal] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const data = await cueService.getCues();
      setCues(data);
    }
    load();
  }, []);

  const handleSelect = (id) => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }
    navigate(`/cue/${id}`);
  };
  
  const handleBack = () => navigate('/');
  
  const handleAdd = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowAddModal(true);
  };

  // Called when CueFormModal successfully saves a cue
  // The modal handles the API call internally, we just need to close it and refresh
  const handleModalSave = async () => {
    setShowAddModal(false);
    // Refresh the cues list
    try {
      const updatedCues = await cueService.getCues();
      setCues(updatedCues);
    } catch (err) {
      console.error('Error refreshing cues:', err);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/'); // Ensure we navigate to home page after logout
  };

  // Debug logging
  useEffect(() => {
    console.log('User state:', user);
    console.log('User is logged in:', !!user);
  }, [user]);

  return (
    <div className="App">
      <header className="App-header hero">
        <div className="hero-inner">
          <div className="hero-top">
            <div className="logo">CueFinder</div>
            <div className="account">
              {user ? (
                <>
                  <div className="muted">Signed in as {user.name} ({user.role})</div>
                  <button className="btn small" onClick={() => navigate('/profile')}>My Profile</button>
                  {user.role === 'admin' && <button className="btn small" onClick={() => navigate('/admin')}>Admin</button>}
                  <button className="btn small" onClick={handleLogout}>Sign out</button>
                </>
              ) : (
                <>
                  <button className="btn small primary" onClick={() => navigate('/login')}>Sign In</button>
                  <button className="btn small" onClick={() => navigate('/register')}>Register</button>
                </>
              )}
            </div>
          </div>

          <div className="hero-content">
            <h1>Billiard Cue Marketplace</h1>
            <p className="subtitle">Buy and sell premium billiard cues from players around the world</p>

            <div className="search-row">
              <input className="search-input" placeholder="Search cues, brands..." value={search} onChange={(e)=>setSearch(e.target.value)} />
              <select className="filter"> <option>All Conditions</option> <option>Like New</option> <option>Used</option> </select>
              <select className="sort"> <option>Newest First</option> <option>Lowest Price</option> <option>Highest Price</option> </select>
              {user && <button className="btn primary" onClick={handleAdd}>Add Cue</button>}
              {/* Debug: Show button state */}
              {console.log('Rendering Add Cue button?', !!user)}
            </div>
          </div>
        </div>
      </header>

      <main className="App-main">
        <Routes>
          <Route path="/" element={
            <CueList cues={cues} onSelect={handleSelect} onAdd={handleAdd} query={search} viewMode={viewMode} setViewMode={setViewMode} />
          } />
          
          <Route path="/login" element={
            user ? <Navigate to="/" /> : <LoginPage />
          } />
          
          <Route path="/register" element={
            user ? <Navigate to="/" /> : <LoginPage />
          } />
          
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          
          <Route path="/cue/:id" element={
            user ? <CueDetail onBack={handleBack} /> : <Navigate to="/login" />
          } />
          
          <Route path="/profile" element={
            user ? <UserProfile onBack={handleBack} /> : <Navigate to="/login" />
          } />
          
          <Route path="/admin" element={
            user && user.role === 'admin' ? <AdminPage onBack={handleBack} /> : <Navigate to="/" />
          } />
        </Routes>
      </main>

      <footer className="App-footer">Built with React — connect to /api/cues on your .NET backend</footer>

      {/* Add Cue Modal */}
      {showAddModal && (
        <CueFormModal
          onClose={handleCloseModal}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './App.css';
import CueList from './components/CueList';
import CueDetail from './components/CueDetail';
import CueForm from './components/CueForm';
import AdminPage from './components/AdminPage';
import LoginPage from './components/LoginPage';
import UserProfile from './components/UserProfile';
import { AuthProvider, useAuth } from './auth/AuthContext';
import * as cueService from './api/cueService';

function AppInner() {
  const [cues, setCues] = useState([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const data = await cueService.getCues();
      setCues(data);
    }
    load();
  }, []);

  const handleSelect = (id) => navigate(`/cue/${id}`);
  const handleBack = () => navigate('/');
  const handleAdd = () => navigate('/add-cue');

  const handleSave = async (cue) => {
    const created = await cueService.createCue(cue);
    setCues((s) => [created, ...s]);
    navigate('/');
  };

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="App">
      <header className="App-header hero">
        <div className="hero-inner">
          <div className="hero-top">
            <div className="logo">CueFinder</div>
            <div className="account">
              <div className="muted">Signed in as {user.name} ({user.role})</div>
              <button className="btn small" onClick={() => navigate('/profile')}>My Profile</button>
              {user.role === 'admin' && <button className="btn small" onClick={() => navigate('/admin')}>Admin</button>}
              <button className="btn small" onClick={logout}>Sign out</button>
            </div>
          </div>

          <div className="hero-content">
            <h1>Billiard Cue Marketplace</h1>
            <p className="subtitle">Buy and sell premium billiard cues from players around the world</p>

            <div className="search-row">
              <input className="search-input" placeholder="Search cues, brands..." value={search} onChange={(e)=>setSearch(e.target.value)} />
              <select className="filter"> <option>All Conditions</option> <option>Like New</option> <option>Used</option> </select>
              <select className="sort"> <option>Newest First</option> <option>Lowest Price</option> <option>Highest Price</option> </select>
              <button className="btn primary" onClick={() => navigate('/add-cue')}>Add Cue</button>
            </div>
          </div>
        </div>
      </header>

      <main className="App-main">
        <Routes>
          <Route path="/" element={
            <CueList cues={cues} onSelect={handleSelect} onAdd={handleAdd} query={search} viewMode={viewMode} setViewMode={setViewMode} />
          } />
          
          <Route path="/cue/:id" element={
            <CueDetail onBack={handleBack} />
          } />
          
          <Route path="/add-cue" element={
            <CueForm onCancel={handleBack} onSave={handleSave} />
          } />
          
          <Route path="/profile" element={
            <UserProfile onBack={handleBack} />
          } />
          
          <Route path="/admin" element={
            user.role === 'admin' ? <AdminPage onBack={handleBack} /> : <Navigate to="/" />
          } />
        </Routes>
      </main>

      <footer className="App-footer">Built with React — connect to /api/cues on your .NET backend</footer>
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

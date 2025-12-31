import React, { useEffect, useState } from 'react';
import './App.css';
import CueList from './components/CueList';
import CueDetail from './components/CueDetail';
import CueForm from './components/CueForm';
import AdminPage from './components/AdminPage';
import LoginPage from './components/LoginPage';
import { AuthProvider, useAuth } from './auth/AuthContext';
import * as cueService from './api/cueService';

function AppInner() {
  const [cues, setCues] = useState([]);
  const [view, setView] = useState({ name: 'list', cueId: null });
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const { user, logout } = useAuth();

  useEffect(() => {
    async function load() {
      const data = await cueService.getCues();
      setCues(data);
    }
    load();
  }, []);

  const handleSelect = (id) => setView({ name: 'detail', cueId: id });
  const handleBack = () => setView({ name: 'list', cueId: null });
  const handleAdd = () => setView({ name: 'form', cueId: null });

  const handleSave = async (cue) => {
    const created = await cueService.createCue(cue);
    setCues((s) => [created, ...s]);
    setView({ name: 'list', cueId: null });
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
              {user.role === 'admin' && <button className="btn small" onClick={() => setView({ name: 'admin' })}>Admin</button>}
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
              <button className="btn primary" onClick={() => setView({ name: 'form', cueId: null })}>Add Cue</button>
            </div>
          </div>
        </div>
      </header>

      <main className="App-main">
        {view.name === 'list' && (
          <CueList cues={cues} onSelect={handleSelect} onAdd={handleAdd} query={search} viewMode={viewMode} setViewMode={setViewMode} />
        )}

        {view.name === 'detail' && (
          <CueDetail id={view.cueId} onBack={handleBack} />
        )}

        {view.name === 'form' && (
          <CueForm onCancel={handleBack} onSave={handleSave} />
        )}

        {view.name === 'admin' && (
          <AdminPage onBack={handleBack} />
        )}
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

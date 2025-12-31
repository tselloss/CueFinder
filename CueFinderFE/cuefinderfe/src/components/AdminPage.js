import React, { useEffect, useState } from 'react';
import * as adminService from '../api/adminService';
import * as cueService from '../api/cueService';

export default function AdminPage({ onBack }) {
  const [users, setUsers] = useState([]);
  const [cues, setCues] = useState([]);

  useEffect(() => {
    async function load() {
      const [u, c] = await Promise.all([adminService.getUsers(), cueService.getCues()]);
      setUsers(u);
      setCues(c);
    }
    load();
  }, []);

  const toggleBan = async (user) => {
    const updated = user.banned ? await adminService.unbanUser(user.id) : await adminService.banUser(user.id);
    setUsers((s) => s.map((x) => (x.id === updated.id ? updated : x)));
  };

  const removeCue = async (id) => {
    await cueService.deleteCue(id);
    setCues((s) => s.filter((c) => c.id !== id));
  };

  const flagCue = async (id) => {
    // For demo: just add a 'flagged' property via updateCue
    const res = await cueService.updateCue(id, { flagged: true });
    setCues((s) => s.map((c) => (c.id === res.id ? res : c)));
  };

  return (
    <div className="admin-page">
      <button className="btn" onClick={onBack}>← Back</button>
      <h2>Admin — User Management</h2>
      <div className="admin-grid">
        <section className="admin-panel">
          <h3>Users</h3>
          <ul>
            {users.map((u) => (
              <li key={u.id} className="user-item">
                <div>
                  <strong>{u.name}</strong> <span className="muted">{u.email}</span>
                  {u.banned && <span className="badge">BANNED</span>}
                </div>
                <div className="actions">
                  <button className="btn" onClick={() => toggleBan(u)}>{u.banned ? 'Unban' : 'Ban'}</button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-panel">
          <h3>Cues</h3>
          <ul>
            {cues.map((c) => (
              <li key={c.id} className="cue-item admin-cue">
                <div>
                  <strong>{c.make} {c.model}</strong>
                  <div className="muted">${c.price.toFixed(2)}</div>
                  {c.flagged && <span className="badge warn">FLAGGED</span>}
                </div>
                <div className="actions">
                  <button className="btn" onClick={() => flagCue(c.id)}>Flag</button>
                  <button className="btn" onClick={() => removeCue(c.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

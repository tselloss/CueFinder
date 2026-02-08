import { Link } from 'react-router-dom';

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">BookBilliard</div>
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/book">Book</Link>
          <Link to="/my-bookings">My bookings</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}

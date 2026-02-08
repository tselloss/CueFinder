import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import BookTable from './pages/bookings/BookTable.jsx';
import BookingsDashboard from './pages/bookings/BookingsDashboard.jsx';
import MyBookings from './pages/bookings/MyBookings.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/book" element={<BookTable />} />
        <Route path="/dashboard" element={<BookingsDashboard />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

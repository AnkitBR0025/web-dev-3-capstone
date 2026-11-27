import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Movies from './pages/Movies.jsx';
import MovieShows from './pages/MovieShows.jsx';
import Theatres from './pages/Theatres.jsx';
import SeatMap from './pages/SeatMap.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import TheatreAdminRegister from './pages/TheatreAdminRegister.jsx';
import Admin from './pages/Admin.jsx';
import Reports from './pages/Reports.jsx';

const ADMINS = ['theatreAdmin', 'superAdmin'];

export default function App() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieShows />} />
          <Route path="/theatres" element={<Theatres />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/theatre-admin/register" element={<TheatreAdminRegister />} />
          <Route path="/book/:showId" element={<ProtectedRoute><SeatMap /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={ADMINS}><Admin /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute roles={ADMINS}><Reports /></ProtectedRoute>} />
          <Route path="*" element={<p className="muted pad">Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
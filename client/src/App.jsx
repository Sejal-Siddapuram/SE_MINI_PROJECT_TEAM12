import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import MyListings from './pages/recruiter/MyListings';
import ListingForm from './pages/recruiter/ListingForm';

export default function App() {
  return (
    <>
      <Navbar />
      <main id="main" className="container" tabIndex={-1}>
        <Routes>
          {/* Public pages + Account module (FR-01, FR-02) - Sejal */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Each module owner registers their pages below */}

          {/* Recruiter Portal (FR-07) - Sagar */}
          <Route
            path="/recruiter/listings"
            element={
              <ProtectedRoute roles={['Recruiter']}>
                <MyListings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/listings/new"
            element={
              <ProtectedRoute roles={['Recruiter']}>
                <ListingForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/listings/:id/edit"
            element={
              <ProtectedRoute roles={['Recruiter']}>
                <ListingForm />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}

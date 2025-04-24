import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import RegisterForEventPage from './pages/RegisterForEventPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ConfirmationPage from './pages/ConfirmationPage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/events/:id/register" element={<RegisterForEventPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes - require authentication */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/new" 
              element={
                <ProtectedRoute>
                  <CreateEventPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/:id/edit" 
              element={
                <ProtectedRoute>
                  <EditEventPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/confirmation" element={<ConfirmationPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <footer className="py-4 bg-gray-100 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} EventPoster. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App; 
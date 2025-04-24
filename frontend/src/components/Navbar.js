import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/api';
import { UserIcon, LogoutIcon } from './Icons';

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is logged in on component mount
    checkUserLoggedIn();
    
    // Set up an event listener for storage changes
    window.addEventListener('storage', checkUserLoggedIn);
    
    // Custom event for login/logout
    window.addEventListener('auth-change', checkUserLoggedIn);
    
    return () => {
      window.removeEventListener('storage', checkUserLoggedIn);
      window.removeEventListener('auth-change', checkUserLoggedIn);
    };
  }, []);
  
  const checkUserLoggedIn = () => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user data', e);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/');
    
    // Dispatch an auth-change event
    window.dispatchEvent(new Event('auth-change'));
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-blue-600 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-white text-xl font-bold">EventPoster</Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/events" className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">
              Events
            </Link>
            
            {user ? (
              <>
                <Link to="/dashboard" className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                <div className="flex items-center ml-4">
                  <div className="flex items-center bg-blue-700 rounded-full px-3 py-1 mr-2">
                    <UserIcon className="w-4 h-4 text-white mr-1" />
                    <span className="text-white">{user.username}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="bg-blue-700 text-white hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                  >
                    <LogoutIcon className="w-4 h-4 mr-1" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login" className="bg-white text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </Link>
                <Link to="/register" className="bg-blue-700 text-white hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium">
                  Register
                </Link>
              </div>
            )}
          </div>
          
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-white hover:text-blue-200 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-blue-700 px-2 pt-2 pb-3 space-y-1">
          <Link to="/events" className="text-white hover:bg-blue-800 block px-3 py-2 rounded-md text-base font-medium">
            Events
          </Link>
          
          {user ? (
            <>
              <Link to="/dashboard" className="text-white hover:bg-blue-800 block px-3 py-2 rounded-md text-base font-medium">
                Dashboard
              </Link>
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center">
                  <UserIcon className="w-4 h-4 text-white mr-1" />
                  <span className="text-white">{user.username}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="bg-blue-800 text-white hover:bg-blue-900 px-3 py-1 rounded-md text-sm font-medium flex items-center"
                >
                  <LogoutIcon className="w-4 h-4 mr-1" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col space-y-1">
              <Link to="/login" className="bg-white text-blue-600 hover:bg-blue-100 block px-3 py-2 rounded-md text-base font-medium">
                Login
              </Link>
              <Link to="/register" className="bg-blue-800 text-white hover:bg-blue-900 block px-3 py-2 rounded-md text-base font-medium">
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar; 
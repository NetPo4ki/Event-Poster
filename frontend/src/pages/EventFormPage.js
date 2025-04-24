import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getEvent, createEvent, updateEvent, getCurrentUser } from '../services/api';
import { CalendarIcon, ClockIcon, LocationIcon, UsersIcon } from '../components/Icons';

const EventFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: '',
    event_date: '',
    location: '',
    seats: '',
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setCheckingAuth(true);
        // First try to get from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
        
        // Then verify with the server
        const userData = await getCurrentUser();
        setCurrentUser(userData);
        setError(null);
      } catch (err) {
        console.error('Error checking authentication:', err);
        setError('You must be logged in to create or edit events.');
        // Clear potentially invalid tokens
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);
  
  useEffect(() => {
    if (isEditMode && !checkingAuth) {
      const fetchEvent = async () => {
        try {
          setLoading(true);
          const eventData = await getEvent(id);
          
          // Format date for input
          const eventDate = new Date(eventData.event_date);
          const formattedDate = eventDate.toISOString().slice(0, 16); // Format: "YYYY-MM-DDTHH:MM"
          
          setFormData({
            title: eventData.title || '',
            description: eventData.description || '',
            event_type: eventData.event_type || '',
            event_date: formattedDate,
            location: eventData.location || '',
            seats: eventData.seats || '',
          });
          
          setError(null);
        } catch (err) {
          console.error('Error fetching event:', err);
          setError('Failed to load event data. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchEvent();
    }
  }, [id, isEditMode, checkingAuth]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation error when field is updated
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title) errors.title = 'Title is required';
    if (!formData.event_type) errors.event_type = 'Event type is required';
    if (!formData.event_date) errors.event_date = 'Event date is required';
    if (!formData.location) errors.location = 'Location is required';
    
    if (!formData.seats) {
      errors.seats = 'Number of seats is required';
    } else if (isNaN(formData.seats) || parseInt(formData.seats) <= 0) {
      errors.seats = 'Seats must be a positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      // Prepare data for API - ensure proper date format and convert seats to number
      const eventData = {
        ...formData,
        seats: parseInt(formData.seats),
        // Ensure date is in ISO format with timezone
        event_date: new Date(formData.event_date).toISOString()
      };
      
      // Debug - log the request
      console.log('Creating event with data:', eventData);
      console.log('Auth token:', localStorage.getItem('token'));
      console.log('Current user:', currentUser);
      
      if (isEditMode) {
        await updateEvent(id, eventData);
        navigate('/dashboard');
      } else {
        await createEvent(eventData);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error saving event:', err);
      setError(`Failed to save event: ${err.response?.data?.error || err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (checkingAuth) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>You must be logged in to create or edit events.</p>
        </div>
        <div className="text-center">
          <Link to="/login" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Loading event data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {isEditMode ? 'Edit Event' : 'Create New Event'}
      </h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
        <p>Logged in as: {currentUser.username} (ID: {currentUser.id})</p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="title">
            Event Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${formErrors.title ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter event title"
          />
          {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="event_type">
            Event Type *
          </label>
          <select
            id="event_type"
            name="event_type"
            value={formData.event_type}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${formErrors.event_type ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select event type</option>
            <option value="Conference">Conference</option>
            <option value="Workshop">Workshop</option>
            <option value="Seminar">Seminar</option>
            <option value="Meetup">Meetup</option>
            <option value="Concert">Concert</option>
            <option value="Exhibition">Exhibition</option>
            <option value="Other">Other</option>
          </select>
          {formErrors.event_type && <p className="text-red-500 text-sm mt-1">{formErrors.event_type}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="event_date">
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                Date and Time *
              </div>
            </label>
            <input
              type="datetime-local"
              id="event_date"
              name="event_date"
              value={formData.event_date}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${formErrors.event_date ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.event_date && <p className="text-red-500 text-sm mt-1">{formErrors.event_date}</p>}
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="seats">
              <div className="flex items-center">
                <UsersIcon className="w-4 h-4 mr-1" />
                Available Seats *
              </div>
            </label>
            <input
              type="number"
              id="seats"
              name="seats"
              value={formData.seats}
              onChange={handleChange}
              min="1"
              className={`w-full px-3 py-2 border rounded-md ${formErrors.seats ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Number of available seats"
            />
            {formErrors.seats && <p className="text-red-500 text-sm mt-1">{formErrors.seats}</p>}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="location">
            <div className="flex items-center">
              <LocationIcon className="w-4 h-4 mr-1" />
              Location *
            </div>
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${formErrors.location ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter event location"
          />
          {formErrors.location && <p className="text-red-500 text-sm mt-1">{formErrors.location}</p>}
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter event description"
          ></textarea>
        </div>
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {submitting ? 'Saving...' : isEditMode ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventFormPage; 
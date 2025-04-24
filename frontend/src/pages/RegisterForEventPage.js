import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEvent, createRegistration } from '../services/api';

const RegisterForEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    notes: ''
  });
  
  useEffect(() => {
    // Check both user and token for authentication
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!userData || !token) {
      // Save current URL to redirect back after login
      const returnUrl = `/events/${id}/register`;
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    
    setUser(userData);
    
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const eventData = await getEvent(id);
        setEvent(eventData);
        
        // Check if event is in the past
        const eventDate = eventData.date || eventData.event_date;
        if (eventDate && new Date(eventDate) < new Date()) {
          setError('Registration for this event has closed as the event date has passed.');
        }
        
        // Check if event is at capacity
        const capacity = eventData.capacity || eventData.seats || 0;
        const registered = eventData.registrations_count || eventData.registrations || 0;
        if (capacity && registered >= capacity) {
          setError('This event has reached its capacity. No more registrations are being accepted.');
        }
        
        // Check if user is the event creator
        if (userData.id === (eventData.creator_id || eventData.created_by || eventData.userId)) {
          setError('You cannot register for your own event.');
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [id, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      const registrationData = {
        event_id: parseInt(id),
        notes: formData.notes || null
      };
      
      await createRegistration(registrationData);
      navigate(`/confirmation?action=registration-successful&event=${event.title}`);
    } catch (err) {
      console.error('Error registering for event:', err);
      setError(err.response?.data?.error || 'Failed to register for this event. Please try again later.');
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Registration Error</h2>
            <p className="text-gray-700 mb-6">{error}</p>
            <div className="flex justify-between">
              <Link
                to={`/events/${id}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Back to Event
              </Link>
              <Link
                to="/events"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Browse Other Events
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Event Not Found</h2>
            <p className="text-gray-700 mb-6">The event you're trying to register for doesn't exist or has been removed.</p>
            <Link
              to="/events"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link to={`/events/${id}`} className="text-blue-600 hover:underline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Event
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Register for Event</h1>
            <h2 className="text-xl text-gray-700 mb-6">{event.title}</h2>
            
            <div className="mb-6">
              <p className="text-gray-700">
                You'll be registered with your account name: <span className="font-semibold">{user.username}</span>
              </p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="notes" className="block text-gray-700 font-medium mb-2">
                  Special Requirements/Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special requirements or notes"
                  rows={3}
                ></textarea>
              </div>
              
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                    submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {submitting ? 'Processing...' : 'Register for Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForEventPage; 
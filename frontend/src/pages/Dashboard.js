import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserEvents, getUserRegistrations, deleteEvent, deleteRegistration } from '../services/api';
import { UserIcon, CalendarIcon, TrashIcon, EditIcon } from '../components/Icons';

const Dashboard = () => {
  const navigate = useNavigate();
  const [myEvents, setMyEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [activeTab, setActiveTab] = useState('myEvents');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (activeTab === 'myEvents') {
          const eventsData = await getUserEvents();
          setMyEvents(eventsData || []);
        } else {
          const registrationsData = await getUserRegistrations();
          setMyRegistrations(registrationsData || []);
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab === 'myEvents' ? 'events' : 'registrations'}:`, err);
        setError(`Failed to load ${activeTab === 'myEvents' ? 'your events' : 'your registrations'}. Please try again.`);
        // Initialize to empty array on error
        if (activeTab === 'myEvents') {
          setMyEvents([]);
        } else {
          setMyRegistrations([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(id);
        setMyEvents((currentEvents) => currentEvents.filter(event => event.id !== id));
      } catch (err) {
        console.error('Error deleting event:', err);
        setError('Failed to delete event. Please try again.');
      }
    }
  };

  const handleDeleteRegistration = async (id) => {
    if (window.confirm('Are you sure you want to cancel this registration?')) {
      try {
        await deleteRegistration(id);
        setMyRegistrations((currentRegistrations) => 
          currentRegistrations.filter(registration => registration.id !== id)
        );
      } catch (err) {
        console.error('Error canceling registration:', err);
        setError('Failed to cancel registration. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Date not available';
      }
      
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date not available';
    }
  };

  const renderMyEvents = () => {
    // Ensure myEvents is an array
    const events = Array.isArray(myEvents) ? myEvents : [];
    
    if (events.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">You haven't created any events yet.</p>
          <Link 
            to="/events/new"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create an Event
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event?.id || Math.random()} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{event?.title || 'Untitled Event'}</h3>
              <p className="text-gray-500 mb-2">{event?.event_type || 'No type specified'}</p>
              <p className="text-gray-700 mb-2">
                <CalendarIcon className="w-5 h-5 inline-block mr-1" />
                {formatDate(event?.event_date)}
              </p>
              <p className="text-gray-700 mb-4">
                <span className="font-medium">{event?.available_seats || 0}</span> seats available 
                ({event?.registrations || 0} registered)
              </p>
              <div className="flex justify-between">
                <Link 
                  to={`/events/${event?.id}/edit`}
                  className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  <EditIcon className="w-4 h-4 mr-1" />
                  Edit
                </Link>
                <button 
                  onClick={() => handleDeleteEvent(event?.id)}
                  className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMyRegistrations = () => {
    // Ensure myRegistrations is an array
    const registrations = Array.isArray(myRegistrations) ? myRegistrations : [];
    
    if (registrations.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">You haven't registered for any events yet.</p>
          <Link 
            to="/events" 
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Browse Events
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {registrations.map((registration) => (
          <div key={registration?.id || Math.random()} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{registration?.event_title || 'Untitled Event'}</h3>
              <p className="text-gray-500 mb-2">{registration?.event_type || 'No type specified'}</p>
              
              {registration?.event_description && (
                <p className="text-gray-700 mb-2 line-clamp-2">{registration.event_description}</p>
              )}
              
              {registration?.event_location && (
                <p className="text-gray-700 mb-2">
                  <span className="font-medium">Location:</span> {registration.event_location}
                </p>
              )}
              
              <p className="text-gray-700 mb-2">
                <CalendarIcon className="w-5 h-5 inline-block mr-1" />
                {formatDate(registration?.event_date)}
              </p>
              
              <p className="text-gray-700 mb-4">
                Registered on: {formatDate(registration?.created_at)}
              </p>
              
              <button 
                onClick={() => handleDeleteRegistration(registration?.id)}
                className="w-full flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                <TrashIcon className="w-4 h-4 mr-1" />
                Cancel Registration
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <Link 
          to="/events/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create New Event
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'myEvents' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('myEvents')}
          >
            My Events
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'myRegistrations' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('myRegistrations')}
          >
            My Registrations
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : (
        <>
          {activeTab === 'myEvents' ? renderMyEvents() : renderMyRegistrations()}
        </>
      )}
    </div>
  );
};

export default Dashboard; 
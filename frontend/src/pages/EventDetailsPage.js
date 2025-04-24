import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEvent, deleteEvent } from '../services/api';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Fetch event data
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const data = await getEvent(id);
        setEvent(data);
      } catch (err) {
        setError(err.message || 'Failed to load event');
        console.error('Error fetching event:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleDeleteEvent = async () => {
    try {
      await deleteEvent(id);
      navigate('/confirmation?action=event-deleted');
    } catch (err) {
      setError(err.message || 'Failed to delete event');
      console.error('Error deleting event:', err);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-600" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
        <Link to="/events" className="text-blue-600 hover:underline">
          &larr; Back to events
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>Event not found</p>
        </div>
        <Link to="/events" className="text-blue-600 hover:underline">
          &larr; Back to events
        </Link>
      </div>
    );
  }

  const isEventCreator = user && event && user.id === (event.creator_id || event.created_by || event.userId);
  const isEventPast = event && event.date ? new Date(event.date) < new Date() : false;
  const isFullyBooked = event && event.capacity ? 
    ((event.registrations_count || event.registrations || 0) >= event.capacity) : false;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <Link to="/events" className="text-blue-600 hover:underline mb-4 inline-block">
            &larr; Back to events
          </Link>
          <h1 className="text-3xl font-bold">{event.title}</h1>
        </div>
        
        {isEventCreator && (
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Link 
              to={`/events/${id}/edit`}
              className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Edit Event
            </Link>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{event.description || 'No description available'}</p>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Location</h2>
                <p className="text-gray-700">{event.location || 'No location specified'}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="mb-4">
                <h3 className="font-medium text-gray-900">Date and Time</h3>
                <p className="text-gray-700">{formatDate(event.date || event.event_date || new Date())}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-900">Capacity</h3>
                <p className="text-gray-700">
                  {event.registrations_count || event.registrations || 0} / {event.capacity || event.seats || 'Unlimited'} registered
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${(event.capacity || event.seats) ? 
                                      ((event.registrations_count || event.registrations || 0) / (event.capacity || event.seats)) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-900">Organizer</h3>
                <p className="text-gray-700">{event.username || 'Anonymous'}</p>
              </div>

              {!isEventCreator && (
                <div className="mt-6">
                  {isEventPast ? (
                    <div className="bg-gray-100 border border-gray-300 text-gray-700 py-2 px-4 rounded text-center">
                      Event has ended
                    </div>
                  ) : isFullyBooked ? (
                    <div className="bg-yellow-100 border border-yellow-300 text-yellow-700 py-2 px-4 rounded text-center">
                      Fully booked
                    </div>
                  ) : (
                    <Link 
                      to={`/events/${id}/register`}
                      className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded hover:bg-green-700"
                    >
                      Register for Event
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">Are you sure you want to delete this event? This action cannot be undone and will cancel all registrations.</p>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteEvent}
                className="px-4 py-2 bg-red-600 rounded text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailsPage; 
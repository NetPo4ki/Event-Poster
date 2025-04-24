import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEvents } from '../services/api';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPastEvents, setShowPastEvents] = useState(false);
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await getEvents();
        setEvents(data);
        setFilteredEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);
  
  useEffect(() => {
    // Filter events based on search term and past events toggle
    const currentDate = new Date();
    
    const filtered = events.filter(event => {
      // Skip filtering if event is missing critical data
      if (!event) return false;
      
      // Check if date exists and is valid
      const eventDate = event.date || event.event_date ? new Date(event.date || event.event_date) : null;
      
      // Safe string search with null checks
      const matchesSearch = searchTerm === '' || (
        (event.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (event.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (event.location?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (event.event_type?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
      
      // Only include past events if showPastEvents is true
      const isNotPast = !eventDate || showPastEvents || eventDate >= currentDate;
      
      return matchesSearch && isNotPast;
    });
    
    setFilteredEvents(filtered);
  }, [searchTerm, showPastEvents, events]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Upcoming Events</h1>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="form-checkbox h-5 w-5 text-blue-600" 
                checked={showPastEvents} 
                onChange={() => setShowPastEvents(!showPastEvents)}
              />
              <span className="ml-2 text-gray-700">Show past events</span>
            </label>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}
      </div>
      
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-lg text-gray-600">No events found that match your criteria.</p>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => {
            const eventDate = event.date ? new Date(event.date) : new Date();
            const isPastEvent = eventDate < new Date();
            
            return (
              <div 
                key={event.id || Math.random()} 
                className={`bg-white rounded-lg shadow-md overflow-hidden ${isPastEvent ? 'opacity-75' : ''}`}
              >
                <div className="p-6">
                  {isPastEvent && (
                    <div className="inline-block bg-gray-500 text-white text-xs px-2 py-1 rounded mb-2">
                      Past Event
                    </div>
                  )}
                  
                  <h2 className="text-xl font-semibold mb-2 line-clamp-2">{event.title || 'Untitled Event'}</h2>
                  
                  <div className="flex items-center text-gray-600 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(event.date || event.event_date)}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{event.registrations_count || event.registrations || 0}/{event.capacity || event.seats || 'Unlimited'} Registered</span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">{event.description || 'No description available'}</p>
                  
                  <Link 
                    to={`/events/${event.id}`}
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsPage; 
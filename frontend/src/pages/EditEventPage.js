import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEvent, updateEvent } from '../services/api';

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [eventTypes] = useState(['Conference', 'Workshop', 'Meetup', 'Webinar', 'Other']);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    event_type: '',
    event_date: '',
    seats: ''
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const eventData = await getEvent(id);
        
        // Format the date for the input field
        const eventDate = new Date(eventData.event_date);
        const formattedDate = eventDate.toISOString().slice(0, 16);
        
        setFormData({
          title: eventData.title || '',
          description: eventData.description || '',
          location: eventData.location || '',
          event_type: eventData.event_type || '',
          event_date: formattedDate,
          seats: eventData.seats || 0
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event details. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Convert to number for number inputs
    const processedValue = type === 'number' ? Number(value) : value;
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.event_date) {
      newErrors.event_date = 'Event date is required';
    } else {
      // Check if date is in the future
      const eventDate = new Date(formData.event_date);
      const now = new Date();
      if (eventDate <= now) {
        newErrors.event_date = 'Event date must be in the future';
      }
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!formData.event_type) {
      newErrors.event_type = 'Event type is required';
    }
    
    if (formData.seats <= 0) {
      newErrors.seats = 'Available seats must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Format the date properly for the backend
      const eventData = {
        ...formData,
        event_date: new Date(formData.event_date).toISOString()
      };
      
      await updateEvent(id, eventData);
      navigate(`/events/${id}`);
    } catch (err) {
      console.error('Error updating event:', err);
      setError(err.response?.data?.message || 'Failed to update event. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Edit Event</h1>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                Event Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label htmlFor="location" className="block text-gray-700 font-medium mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="event_type" className="block text-gray-700 font-medium mb-2">
                Event Type <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="event_type"
                name="event_type"
                value={formData.event_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="mb-6">
                <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Date and Time*
                </label>
                <input
                  type="datetime-local"
                  id="event_date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.event_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.event_date && <p className="mt-1 text-sm text-red-600">{errors.event_date}</p>}
              </div>
              
              <div className="mb-6">
                <label htmlFor="seats" className="block text-sm font-medium text-gray-700 mb-1">
                  Available Seats*
                </label>
                <input
                  type="number"
                  id="seats"
                  name="seats"
                  min="1"
                  value={formData.seats}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.seats ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter number of available seats"
                />
                {errors.seats && <p className="mt-1 text-sm text-red-600">{errors.seats}</p>}
              </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="py-2 px-6 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`py-2 px-6 rounded-md text-white ${
                  submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {submitting ? 'Updating...' : 'Update Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEventPage; 
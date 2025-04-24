import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

// Configure axios to send credentials with requests
axios.defaults.withCredentials = true;

// Set up auth token for requests
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Authentication
export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    const { token, user } = response.data;
    
    // Store the token and user in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Set the auth token for all future requests
    setAuthToken(token);
    
    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const logout = () => {
  // Clear token and user from localStorage and axios headers
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setAuthToken(null);
};

export const getCurrentUser = async () => {
  try {
    const response = await axios.get(`${API_URL}/me`);
    return response.data;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

// Initialize auth token from localStorage
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

// Event API calls
export const getEvents = async () => {
  try {
    const response = await axios.get(`${API_URL}/events`);
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const getUserEvents = async () => {
  try {
    const response = await axios.get(`${API_URL}/my-events`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user events:', error);
    throw error;
  }
};

export const getEvent = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/events/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching event ${id}:`, error);
    throw error;
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await axios.post(`${API_URL}/events`, eventData);
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (id, eventData) => {
  try {
    const response = await axios.put(`${API_URL}/events/${id}`, eventData);
    return response.data;
  } catch (error) {
    console.error(`Error updating event ${id}:`, error);
    throw error;
  }
};

export const deleteEvent = async (id) => {
  try {
    await axios.delete(`${API_URL}/events/${id}`);
  } catch (error) {
    console.error(`Error deleting event ${id}:`, error);
    throw error;
  }
};

// Registration API calls
export const getRegistrations = async (eventId) => {
  try {
    let url = `${API_URL}/registrations`;
    if (eventId) {
      url += `?event_id=${eventId}`;
    }
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching registrations:', error);
    throw error;
  }
};

export const getUserRegistrations = async () => {
  try {
    const response = await axios.get(`${API_URL}/my-registrations`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    throw error;
  }
};

export const getRegistration = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/registrations/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching registration ${id}:`, error);
    throw error;
  }
};

export const createRegistration = async (registrationData) => {
  try {
    // Make sure the token is set
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    }
    
    const response = await axios.post(`${API_URL}/registrations`, registrationData);
    return response.data;
  } catch (error) {
    console.error('Error creating registration:', error);
    throw error;
  }
};

export const updateRegistration = async (id, registrationData) => {
  try {
    const response = await axios.put(`${API_URL}/registrations/${id}`, registrationData);
    return response.data;
  } catch (error) {
    console.error(`Error updating registration ${id}:`, error);
    throw error;
  }
};

export const deleteRegistration = async (id) => {
  try {
    await axios.delete(`${API_URL}/registrations/${id}`);
  } catch (error) {
    console.error(`Error deleting registration ${id}:`, error);
    throw error;
  }
}; 
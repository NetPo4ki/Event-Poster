import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';

const ConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  
  const action = searchParams.get('action');
  const event = searchParams.get('event');
  const eventId = searchParams.get('eventId');
  
  useEffect(() => {
    // Auto-redirect after 5 seconds
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Determine where to redirect based on the action
      if (action === 'registration-successful') {
        navigate('/dashboard');
      } else if (action === 'event-created' || action === 'event-updated') {
        navigate(eventId ? `/events/${eventId}` : '/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [countdown, action, eventId, navigate]);
  
  // Determine confirmation content based on the action
  const getConfirmationContent = () => {
    switch (action) {
      case 'registration-successful':
        return {
          title: 'Registration Successful!',
          message: `You've successfully registered for ${event || 'the event'}.`,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          primaryButton: {
            text: 'View My Registrations',
            link: '/dashboard?tab=registrations'
          },
          secondaryButton: {
            text: 'Browse More Events',
            link: '/events'
          }
        };
        
      case 'event-created':
        return {
          title: 'Event Created Successfully!',
          message: `Your event ${event || ''} has been created and is now live.`,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          primaryButton: {
            text: 'View Event',
            link: eventId ? `/events/${eventId}` : '/dashboard'
          },
          secondaryButton: {
            text: 'My Events Dashboard',
            link: '/dashboard'
          }
        };
        
      case 'event-updated':
        return {
          title: 'Event Updated Successfully!',
          message: `Your event ${event || ''} has been updated.`,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          primaryButton: {
            text: 'View Event',
            link: eventId ? `/events/${eventId}` : '/dashboard'
          },
          secondaryButton: {
            text: 'My Events Dashboard',
            link: '/dashboard'
          }
        };
        
      case 'event-deleted':
        return {
          title: 'Event Deleted',
          message: 'Your event has been successfully deleted.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ),
          primaryButton: {
            text: 'My Events Dashboard',
            link: '/dashboard'
          },
          secondaryButton: {
            text: 'Create New Event',
            link: '/events/create'
          }
        };
        
      case 'registration-deleted':
        return {
          title: 'Registration Cancelled',
          message: 'Your registration has been successfully cancelled.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ),
          primaryButton: {
            text: 'My Registrations',
            link: '/dashboard?tab=registrations'
          },
          secondaryButton: {
            text: 'Browse Events',
            link: '/events'
          }
        };
        
      default:
        return {
          title: 'Action Completed',
          message: 'Your request has been processed successfully.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          primaryButton: {
            text: 'Go to Dashboard',
            link: '/dashboard'
          },
          secondaryButton: {
            text: 'Go to Home',
            link: '/'
          }
        };
    }
  };
  
  const confirmationContent = getConfirmationContent();
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="flex flex-col items-center text-center">
          {confirmationContent.icon}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {confirmationContent.title}
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            {confirmationContent.message}
          </p>
        </div>
        
        <div className="mt-8 flex flex-col space-y-3">
          <Link
            to={confirmationContent.primaryButton.link}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {confirmationContent.primaryButton.text}
          </Link>
          
          <Link
            to={confirmationContent.secondaryButton.link}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {confirmationContent.secondaryButton.text}
          </Link>
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-500">
          Auto-redirecting in {countdown} seconds...
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage; 
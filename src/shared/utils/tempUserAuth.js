/**
 * Temporary authentication utility - replace with actual auth when implemented
 * This will be replaced with a proper authentication system in the future
 */

// Get temp user from localStorage or create a new one if it doesn't exist
export const getTempUser = () => {
  // Check if a temporary user already exists in localStorage
  let tempUser = localStorage.getItem('tempUser');
  
  if (!tempUser) {
    // Create a new temporary user with a fixed ID
    tempUser = {
      id: 'tempUserId456', // Using fixed ID instead of random
      name: 'Temporary User',
      email: 'temp@example.com',
      role: 'user'
    };
    
    // Store in localStorage
    localStorage.setItem('tempUser', JSON.stringify(tempUser));
  } else {
    // Parse the JSON string from localStorage
    tempUser = JSON.parse(tempUser);
  }
  
  return tempUser;
};

// Check if the current user owns a specific item
export const isItemOwner = (item) => {
  const tempUser = getTempUser();
  return item.userId === tempUser.id;
};

/**
 * COMMENTED CODE FOR FUTURE IMPLEMENTATION WITH REAL AUTH
 */
/*
import { useAuth } from '../context/AuthContext'; // Future auth context

export const getUser = () => {
  const { currentUser } = useAuth();
  return currentUser;
};

export const isItemOwner = (item) => {
  const user = getUser();
  return user && (item.userId === user.id || user.role === 'admin');
};

export const isAdmin = () => {
  const user = getUser();
  return user && user.role === 'admin';
};
*/
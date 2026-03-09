// utils/userValidation.js

export const validateUserForm = (userData, isNewUser = true) => {
  const errors = {};

  // Name validation
  if (!userData.name.trim()) {
    errors.name = "Name is required";
  } else if (userData.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters long";
  } else if (userData.name.trim().length > 50) {
    errors.name = "Name must be less than 50 characters";
  }

  // Email validation
  if (!userData.email.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(userData.email)) {
    errors.email = "Please enter a valid email address";
  }

  // Password validation (only for new users)
  if (isNewUser) {
    if (!userData.password) {
      errors.password = "Password is required";
    } else if (userData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    } else if (userData.password.length > 100) {
      errors.password = "Password must be less than 100 characters";
    }

    // Confirm password validation
    if (!userData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (userData.password !== userData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
  }

  // Role validation
  if (!userData.role) {
    errors.role = "Role is required";
  } else if (!["User", "Admin"].includes(userData.role)) {
    errors.role = "Please select a valid role";
  }

  // Status validation
  if (!userData.status) {
    errors.status = "Status is required";
  } else if (!["Active", "Inactive"].includes(userData.status)) {
    errors.status = "Please select a valid status";
  }

  return errors;
};

export const getFieldClassName = (fieldName, touched, errors) => {
  const baseClasses = "w-full p-2 border rounded-md focus:ring-2 focus:outline-none transition-colors duration-200";
  
  if (!touched[fieldName]) {
    return `${baseClasses} border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
  }
  
  if (errors[fieldName]) {
    return `${baseClasses} border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50`;
  }
  
  return `${baseClasses} border-green-500 focus:ring-green-500 focus:border-green-500 bg-green-50`;
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to check if form has errors
export const hasFormErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

// Helper function to get first error message
export const getFirstError = (errors) => {
  const firstErrorKey = Object.keys(errors)[0];
  return firstErrorKey ? errors[firstErrorKey] : null;
};
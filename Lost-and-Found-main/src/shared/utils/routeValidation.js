// utils/routeValidation.js

export const validateRouteForm = (routeData) => {
  const errors = {};

  // Route Number validation
  if (!routeData.routeNumber.trim()) {
    errors.routeNumber = "Route number is required";
  } else if (!/^[A-Z]{1}[0-9]{2,4}$/.test(routeData.routeNumber.trim())) {
    errors.routeNumber = "Route number must start with a letter followed by 2-4 digits (e.g., R101)";
  }

  // Name validation
  if (!routeData.name.trim()) {
    errors.name = "Route name is required";
  } else if (routeData.name.trim().length < 3) {
    errors.name = "Route name must be at least 3 characters long";
  } else if (routeData.name.trim().length > 100) {
    errors.name = "Route name must be less than 100 characters";
  }

  // Start Location validation
  if (!routeData.startLocation.trim()) {
    errors.startLocation = "Start location is required";
  } else if (routeData.startLocation.trim().length < 2) {
    errors.startLocation = "Start location must be at least 2 characters long";
  } else if (routeData.startLocation.trim().length > 100) {
    errors.startLocation = "Start location must be less than 100 characters";
  }

  // End Location validation
  if (!routeData.endLocation.trim()) {
    errors.endLocation = "End location is required";
  } else if (routeData.endLocation.trim().length < 2) {
    errors.endLocation = "End location must be at least 2 characters long";
  } else if (routeData.endLocation.trim().length > 100) {
    errors.endLocation = "End location must be less than 100 characters";
  }

  // Check if start and end locations are the same
  if (routeData.startLocation.trim() && routeData.endLocation.trim() && 
      routeData.startLocation.trim().toLowerCase() === routeData.endLocation.trim().toLowerCase()) {
    errors.endLocation = "End location must be different from start location";
  }

  // Distance validation
  if (!routeData.distanceKm || routeData.distanceKm <= 0) {
    errors.distanceKm = "Distance must be greater than 0";
  } else if (routeData.distanceKm > 1000) {
    errors.distanceKm = "Distance must be less than 1000 km";
  }

  // Stops validation
  if (!routeData.stops || routeData.stops < 1) {
    errors.stops = "Number of stops must be at least 1";
  } else if (routeData.stops > 100) {
    errors.stops = "Number of stops must be less than 100";
  } else if (!Number.isInteger(Number(routeData.stops))) {
    errors.stops = "Number of stops must be a whole number";
  }

  // Status validation
  if (!routeData.status) {
    errors.status = "Status is required";
  } else if (!["Active", "Inactive"].includes(routeData.status)) {
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

// Helper function to check if form has errors
export const hasFormErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

// Helper function to get first error message
export const getFirstError = (errors) => {
  const firstErrorKey = Object.keys(errors)[0];
  return firstErrorKey ? errors[firstErrorKey] : null;
};
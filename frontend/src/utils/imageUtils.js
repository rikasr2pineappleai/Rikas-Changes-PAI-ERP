// Utility functions for image handling across different environments
// All image URL construction should use these functions for consistency

import defaultEmployeeProfileImage from "../assets/icons/img.png";

/**
 * Constructs image URL from image path using environment configuration
 * @param {string} imagePath - The image path (relative or absolute)
 * @param {string|null} defaultImage - Fallback image URL
 * @returns {string} Complete image URL
 */
export const getImageUrl = (imagePath, defaultImage = null) => {
  // Handle null/undefined/empty paths
  if (!imagePath || imagePath === '') {
    return defaultImage || getDefaultProfileImage();
  }
  
  // Handle absolute URLs (external images)
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  const normalizedImagePath = imagePath.replace(/^\/+/, '');

  // Get base URL from environment variable
  const apiBaseUrl = 'http://localhost:5001/api';
  
  // Remove trailing slashes and normalize
  const normalizedBaseUrl = apiBaseUrl.replace(/\/\/+$/, '');
  
  // For all environments (both localhost and production):
  // Images are served from the same domain at /uploads/ path
  // We remove /api from the base URL to get the root domain
  const baseUrlWithoutApi = normalizedBaseUrl.replace('/api', '');
  
  let imageUrl;
  
  if (normalizedImagePath.startsWith('uploads/')) {
    // Path already includes uploads directory
    imageUrl = `${baseUrlWithoutApi}/${normalizedImagePath}`;
  } else {
    // Path doesn't include uploads directory, prepend it
    imageUrl = `${baseUrlWithoutApi}/uploads/${normalizedImagePath}`;
  }
  
  return imageUrl;
};

/**
 * Gets employee profile image URL with proper fallback chain
 * @param {Object} employeeData - Employee data object containing profile_image or EmployeeDetail.image_path
 * @param {string|null} defaultImage - Custom default image
 * @returns {string} Complete image URL
 */
export const getEmployeeImageUrl = (employeeData, defaultImage = null) => {
  // Try profile_image first (newer field)
  if (employeeData?.profile_image) {
    return getImageUrl(employeeData.profile_image, defaultImage);
  }
  
  // Fallback to EmployeeDetail.image_path (legacy field)
  if (employeeData?.EmployeeDetail?.image_path) {
    return getImageUrl(employeeData.EmployeeDetail.image_path, defaultImage);
  }
  
  // Return default image if no image data found
  return defaultImage || getDefaultProfileImage();
};

/**
 * Gets default profile image URL
 * @returns {string} Default profile image URL
 */
export const getDefaultProfileImage = () => {
  // Try to get from environment, fallback to the app's default employee avatar
  return process.env.REACT_APP_DEFAULT_PROFILE_IMAGE || defaultEmployeeProfileImage;
};

export const DEFAULT_EMPLOYEE_PROFILE_IMAGE = defaultEmployeeProfileImage;

/**
 * Validates if an image URL is accessible
 * @param {string} url - Image URL to validate
 * @returns {Promise<boolean>} Whether the image is accessible
 */
export const isImageAccessible = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('Image accessibility check failed:', error);
    return false;
  }
};

/**
 * Preloads an image and returns a promise
 * @param {string} url - Image URL to preload
 * @returns {Promise<HTMLImageElement>} Loaded image element
 */
export const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

const imageUtils = {
  getImageUrl,
  getEmployeeImageUrl,
  getDefaultProfileImage,
  DEFAULT_EMPLOYEE_PROFILE_IMAGE,
  isImageAccessible,
  preloadImage
};

export default imageUtils;

/**
 * Utility functions for employee form management
 */

/**
 * Clears all stored employee form data from localStorage
 */
export const clearEmployeeFormData = () => {
  localStorage.removeItem('employeeFormData');
};

/**
 * Gets stored employee form data from localStorage
 */
export const getEmployeeFormData = () => {
  const savedData = localStorage.getItem('employeeFormData');
  return savedData ? JSON.parse(savedData) : null;
};

/**
 * Sets employee form data in localStorage
 */
export const setEmployeeFormData = (data) => {
  localStorage.setItem('employeeFormData', JSON.stringify(data));
};
// Sidebar API Layer
import apiClient from '../utils/apiClient';

// Get sidebar menu items based on user role
export const getSidebarMenu = async () => {
  try {
    const { data } = await apiClient.get('/sidebar/menu');
    return data;
  } catch (error) {
    throw error;
  }
};
// // Placeholder API layer - leaves
// export const fetchLeaves = async () => {
//   console.log('fetchLeaves called');
//   return Promise.resolve({ data: [], message: 'leaves placeholder' });
// };

// API layer for leaves
import apiClient from '../utils/apiClient';

export const fetchLeaves = async () => {
  console.log('fetchLeaves called');
  return Promise.resolve({ data: [], message: 'leaves placeholder' });
};

// Create a new full day leave request with file upload
export const createFullDayLeaveRequest = async (leaveData) => {
  try {
    // Get the API base URL and token from the apiClient
    const token = apiClient.getToken();
    const baseURL = apiClient.baseURL;
    
    // Create FormData for file upload
    const formData = new FormData();
    
    // Append all the data to FormData
    Object.keys(leaveData).forEach(key => {
      if (leaveData[key] !== undefined && leaveData[key] !== null) {
        // Handle file differently if it's a File object
        if (key === 'document' && leaveData[key] instanceof File) {
          formData.append('document', leaveData[key], leaveData[key].name);
        } else {
          // Convert values to string as needed for form data
          formData.append(key, leaveData[key]);
        }
      }
    });
    
    // Log FormData contents for debugging (remove in production)
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
    
    // Make the request directly with fetch for file upload
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    // Remove Content-Type header so browser can set it with the correct boundary for FormData
    const response = await fetch(`${baseURL}/leave-request`, {
      method: 'POST',
      body: formData,
      headers: headers
    });
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      throw new Error('Invalid response from server');
    }
    
    if (!response.ok) {
      console.error('Backend error response:', data);
      const errorMessage = (data && (data.error || data.message)) || 'Failed to create full day leave request';
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating full day leave request:', error);
    throw error;
  }
};

// Create a new half day leave request with file upload
export const createHalfdayLeaveRequest = async (leaveData) => {
  try {
    // Get the API base URL and token from the apiClient
    const token = apiClient.getToken();
    const baseURL = apiClient.baseURL;
    
    // Create FormData for file upload
    const formData = new FormData();
    
    // Append all the data to FormData
    Object.keys(leaveData).forEach(key => {
      if (leaveData[key] !== undefined && leaveData[key] !== null) {
        // Handle file differently if it's a File object
        if (key === 'document' && leaveData[key] instanceof File) {
          formData.append('document', leaveData[key], leaveData[key].name);
        } else {
          // Convert values to string as needed for form data
          formData.append(key, leaveData[key]);
        }
      }
    });
    
    // Log FormData contents for debugging (remove in production)
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
    
    // Make the request directly with fetch for file upload
    // When using FormData, don't set Content-Type header as it will be set automatically with boundary
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    // Remove Content-Type header so browser can set it with the correct boundary for FormData
    const response = await fetch(`${baseURL}/leave-request/halfday`, {
      method: 'POST',
      body: formData,
      headers: headers
    });
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      throw new Error('Invalid response from server');
    }
    
    if (!response.ok) {
      console.error('Backend error response:', data);
      const errorMessage = (data && (data.error || data.message)) || 'Failed to create half day leave request';
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating half day leave request:', error);
    throw error;
  }
};

// Create a new hours permission leave request with file upload
export const createHoursPermissionLeaveRequest = async (leaveData) => {
  try {
    // Get the API base URL and token from the apiClient
    const token = apiClient.getToken();
    const baseURL = apiClient.baseURL;
    
    // Create FormData for file upload
    const formData = new FormData();
    
    // Append all the data to FormData
    Object.keys(leaveData).forEach(key => {
      if (leaveData[key] !== undefined && leaveData[key] !== null) {
        // Handle file differently if it's a File object
        if (key === 'document' && leaveData[key] instanceof File) {
          formData.append('document', leaveData[key], leaveData[key].name);
        } else {
          // Convert values to string as needed for form data
          formData.append(key, leaveData[key]);
        }
      }
    });
    
    // Log FormData contents for debugging (remove in production)
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
    
    // Make the request directly with fetch for file upload
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    // Remove Content-Type header so browser can set it with the correct boundary for FormData
    const response = await fetch(`${baseURL}/leave-request/hours-permission`, {
      method: 'POST',
      body: formData,
      headers: headers
    });
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      throw new Error('Invalid response from server');
    }
    
    if (!response.ok) {
      console.error('Backend error response:', data);
      const errorMessage = (data && (data.error || data.message)) || 'Failed to create hours permission leave request';
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating hours permission leave request:', error);
    throw error;
  }
};

// Update the existing createLeaveRequest to handle FormData
export const createLeaveRequest = async (leaveData) => {
  // If leaveData contains a file, use the FormData approach
  if (leaveData.document instanceof File) {
    return createFullDayLeaveRequest(leaveData);
  }
  
  // Otherwise, use the regular approach
  try {
    const response = await apiClient.post('/leave-request', leaveData);
    return response.data;
  } catch (error) {
    console.error('Error creating leave request:', error);
    throw error;
  }
};

// Get user's leave balance summary for pie charts
export const getUserLeaveBalanceSummary = async (userId) => {
  try {
    const response = await apiClient.get(`/leave-balance/user/${userId}/summary`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user leave balance summary:', error);
    throw error;
  }
};

// Get user's calendar data for leave calendar
export const getUserCalendarData = async (userId) => {
  try {
    const response = await apiClient.get(`/leave-request/user/${userId}/calendar`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user calendar data:', error);
    throw error;
  }
};

// Update leave request status (for admin approval/rejection)
export const updateLeaveStatus = async (leaveId, statusData) => {
  try {
    const response = await apiClient.put(`/leave-request/${leaveId}/status`, statusData);
    return response.data;
  } catch (error) {
    console.error('Error updating leave request status:', error);
    const serverMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.response?.data?.details;
    if (serverMessage) {
      error.message = serverMessage;
    }
    throw error;
  }
};

// Update admin reason for a leave request (for admin rejection)
export const updateLeaveAdminReason = async (leaveId, adminReason) => {
  try {
    const response = await apiClient.put(`/leave-request/${leaveId}/admin-reason`, { adminReason });
    return response.data;
  } catch (error) {
    console.error('Error updating admin reason:', error);
    throw error;
  }
};

// Get all leave requests (for admin)
export const getAllLeaveRequests = async (params = {}) => {
  try {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && String(value).trim()) {
        query.set(key, String(value).trim());
      }
    });

    const endpoint = query.toString()
      ? `/leave-request?${query.toString()}`
      : '/leave-request';
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching all leave requests:', error);
    throw error;
  }
};

// Get leave request by ID
export const getLeaveRequestById = async (leaveId) => {
  try {
    const response = await apiClient.get(`/leave-request/${leaveId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching leave request by ID:', error);
    throw error;
  }
};

// Get leave request document URL
export const getLeaveDocumentUrl = async (leaveId) => {
  try {
    const baseURL = apiClient.baseURL;
    return `${baseURL}/leave-request/${leaveId}/document`;
  } catch (error) {
    console.error('Error getting document URL:', error);
    throw error;
  }
};

export const openLeaveDocument = async (leaveId) => {
  try {
    const documentUrl = await getLeaveDocumentUrl(leaveId);
    const token = apiClient.getToken();
    const response = await fetch(documentUrl, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    });

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json();
      return {
        success: false,
        message: data?.message || data?.error || "No document found",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: "Failed to open document",
      };
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);

    return { success: true };
  } catch (error) {
    console.error("Error opening leave document:", error);
    return {
      success: false,
      message: error?.message || "Failed to open document",
    };
  }
};

// Delete leave request (admin only)
export const deleteLeaveRequest = async (leaveId) => {
  try {
    const response = await apiClient.delete(`/leave-request/${leaveId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting leave request:', error);
    throw error;
  }
};

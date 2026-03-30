// Authentication API Layer
import apiClient from '../utils/apiClient';

// Login user
export const login = async (identifier, password, rememberMe = false) => {
  try {
    const { data } = await apiClient.post('/auth/login', {
      identifier,
      password,
      rememberMe
    }, { includeAuth: false });
    
    if (data.success && data.token) {
      apiClient.setToken(data.token);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    apiClient.removeToken();
    return { success: true, message: 'Logged out successfully' };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, message: 'Logout failed' };
  }
};

// Forgot password
export const forgotPassword = async (email) => {
  try {
    const { data } = await apiClient.post('/auth/forgot-password', {
      email
    }, { includeAuth: false });
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Resend OTP (same as forgot password)
export const resendOtp = async (email) => {
  try {
    const { data } = await apiClient.post('/auth/forgot-password', {
      email
    }, { includeAuth: false });
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Verify OTP
export const verifyOtp = async (email, otp) => {
  try {
    const { data } = await apiClient.post('/auth/verify-otp', {
      email,
      otp
    }, { includeAuth: false });
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Reset password
export const resetPassword = async (email, otp, newPassword, confirmPassword) => {
  try {
    const { data } = await apiClient.post('/auth/reset-password', {
      email,
      otp,
      newPassword,
      confirmPassword
    }, { includeAuth: false });
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Change password (authenticated)
export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  try {
    const { data } = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword
    });
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data } = await apiClient.get('/auth/me');
    return data;
  } catch (error) {
    throw error;
  }
};


// // API Client Utility for PAI ERP
// // Handles HTTP requests with automatic token management

// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

// class ApiClient {
//   constructor() {
//     this.baseURL = API_BASE_URL;
//     // Initialize token property
//     this.token = null;
//   }


//   // Get token from localStorage
//   getToken() {
//     // First check if we have it in memory
//     if (this.token) {
//       return this.token;
//     }
//     // Otherwise get from localStorage
//     return localStorage.getItem('token');
//   }

//   // Set token in localStorage
//   setToken(token) {
//     localStorage.setItem('token', token);
//     // Also store in memory for faster access
//     this.token = token;
//   }

//   // Remove token from localStorage
//   removeToken() {
//     localStorage.removeItem('token');
//     // Also clear the token from memory
//     this.token = null;
//   }

//   // Create headers for requests
//   getHeaders(includeAuth = true) {
//     const headers = {
//       'Content-Type': 'application/json',
//     };

//     if (includeAuth) {
//       const token = this.getToken();
//       if (token) {
//         headers['Authorization'] = `Bearer ${token}`;

//         // Add user details to headers if available
//         const user = JSON.parse(localStorage.getItem('user') || '{}');
//         if (user.id) {
//           headers['X-User-ID'] = user.id;
//           headers['X-User-Role'] = user.role;
//           headers['X-Employee-ID'] = user.emp_id;
//         }
//       }
//     }

//     return headers;
//   }

//   // Generic request method
//   async request(endpoint, options = {}) {
//     const url = `${this.baseURL}${endpoint}`;
//     const config = {
//       headers: this.getHeaders(options.includeAuth !== false),
//       ...options,
//     };

//     try {
//       const response = await fetch(url, config);

//       // Handle 401 Unauthorized responses
//       if (response.status === 401) {
//         this.removeToken();
//         window.location.href = '/login';
//         throw new Error('Unauthorized');
//       }

//       const data = await response.json();
//       return { data, response };
//     } catch (error) {
//       console.error('API Request Error:', error);
//       throw error;
//     }
//   }

//   // GET request
//   get(endpoint, options = {}) {
//     return this.request(endpoint, { method: 'GET', ...options });
//   }

//   // POST request
//   post(endpoint, body, options = {}) {
//     return this.request(endpoint, {
//       method: 'POST',
//       body: JSON.stringify(body),
//       ...options,
//     });
//   }

//   // PUT request
//   put(endpoint, body, options = {}) {
//     return this.request(endpoint, {
//       method: 'PUT',
//       body: JSON.stringify(body),
//       ...options,
//     });
//   }

//   // DELETE request
//   delete(endpoint, options = {}) {
//     return this.request(endpoint, { method: 'DELETE', ...options });
//   }
// }

// // Create singleton instance
// const apiClient = new ApiClient();

// export default apiClient;

// API Client Utility for PAI ERP
// Handles HTTP requests with automatic token management
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api";

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    // Initialize token property
    this.token = null;
  }

  // Get token from localStorage
  getToken() {
    // First check if we have it in memory
    if (this.token) {
      return this.token;
    }
    // Otherwise get from localStorage
    const token = localStorage.getItem("token");

    // Remove only tokens that have actually expired.
    if (token && this.isTokenExpired(token)) {
      console.warn('Expired token found, removing it');
      this.removeToken();
      return null;
    }

    return token;
  }

  // Helper function to decode JWT token
  decodeToken(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        console.warn('Token missing exp claim, treating as non-expired for safety');
        return false; // If we can't decode or there's no expiration, treat as non-expired to avoid locking users out
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = decoded.exp <= currentTime;
      
      if (isExpired) {
        console.log('Token is expired');
      }
      
      return isExpired;
    } catch (error) {
      console.error("Error checking token expiration:", error);
      return false; // If there's an error, treat as non-expired to avoid locking users out
    }
  }

  // Set token in localStorage
  setToken(token) {
    localStorage.setItem("token", token);
    // Also store in memory for faster access
    this.token = token;
  }

  getTokenRemainingMs(token = this.token || localStorage.getItem("token")) {
    const decoded = token ? this.decodeToken(token) : null;
    return decoded?.exp ? decoded.exp * 1000 - Date.now() : null;
  }

  async refreshSession() {
    const token = this.token || localStorage.getItem("token");
    if (!token || this.isTokenExpired(token)) return false;
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = fetch(`${this.baseURL}/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data?.token) return false;
        this.setToken(data.token);
        window.dispatchEvent(new CustomEvent("session-refreshed"));
        return true;
      })
      .catch(() => false)
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  async refreshSessionIfNeeded(thresholdMs = 60 * 60 * 1000) {
    const remainingMs = this.getTokenRemainingMs();
    if (remainingMs === null || remainingMs > thresholdMs) return true;
    return this.refreshSession();
  }

  // Remove token from localStorage
  removeToken() {
    localStorage.removeItem("token");
    // Also clear the token from memory
    this.token = null;
  }

  // Create headers for requests
  getHeaders(includeAuth = true) {
    const headers = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;

        // Add user details to headers if available
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.id) {
          headers["X-User-ID"] = user.id;
          headers["X-User-Role"] = user.role;
          headers["X-Employee-ID"] = user.emp_id;
        }
      } else {
        console.warn('No token available for authenticated request');
      }
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    if (options.includeAuth !== false && endpoint !== "/auth/refresh") {
      await this.refreshSessionIfNeeded();
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      ...this.getHeaders(options.includeAuth !== false),
      ...(options.headers || {}),
    };
    const config = {
      ...options,
      headers,
    };

    if (typeof FormData !== "undefined" && config.body instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    console.log(`📡 API Request: ${options.method || 'GET'} ${endpoint}`);
    console.log('Token status:', this.getToken() ? '✓ Present' : '✗ Missing');

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      let data;
      if (isJson) {
        data = await response.json();
      } else {
        const text = await response.text();
        const snippet = (text || "").slice(0, 160).replace(/\s+/g, " ").trim();
        throw new Error(
          `API returned non-JSON response (${response.status}) for ${url}. ${snippet || "Empty response body."}`
        );
      }

      // Handle 401 Unauthorized responses
      if (response.status === 401) {
        console.error("401 Unauthorized - Token may be invalid");
        console.error("Response details:", data || "No response body");
        window.dispatchEvent(new CustomEvent("session-expired"));
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        const error = new Error(
          data?.message ||
            data?.error ||
            `Request failed with status ${response.status}`
        );
        error.response = { status: response.status, data };
        throw error;
      }

      return { data, response };
    } catch (error) {
      console.error("API Request Error:", error);

      // Handle network errors specifically
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Network error: Unable to connect to server. Please check your internet connection and ensure the backend server is running."
        );
      }

      throw error;
    }
  }

  // GET request
  get(endpoint, options = {}) {
    return this.request(endpoint, { method: "GET", ...options });
  }

  // POST request
  post(endpoint, body, options = {}) {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    return this.request(endpoint, {
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
      ...options,
    });
  }

  // PUT request
  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
    });
  }

  // DELETE request
  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: "DELETE", ...options });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;

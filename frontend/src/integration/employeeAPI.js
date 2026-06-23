// Employee API Service
import apiClient from "../utils/apiClient";

class EmployeeAPI {
  // Step 1: Create employee personal information
  async createEmployeePersonal(data) {
    try {
      const { data: response } = await apiClient.post("/employees/personal", data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Step 1: Update employee personal information
  async updateEmployeePersonal(employeeId, data) {
    try {
      const { data: response } = await apiClient.put(
        `/employees/${employeeId}/personal`,
        data
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Step 2: Add employee education information
  async addEmployeeEducation(employeeId, data) {
    try {
      const { data: response } = await apiClient.post(
        `/employees/${employeeId}/education`,
        data
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update employee education information
  async updateEmployeeEducation(employeeId, educationId, data) {
    try {
      const { data: response } = await apiClient.put(
        `/employees/${employeeId}/education/${educationId}`,
        data
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Step 2: Add employee professional information
  async addEmployeeProfessional(employeeId, data) {
    try {
      const { data: response } = await apiClient.post(
        `/employees/${employeeId}/professional`,
        data
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update employee professional information
  async updateEmployeeProfessional(employeeId, professionalId, data) {
    try {
      const { data: response } = await apiClient.put(
        `/employees/${employeeId}/professional/${professionalId}`,
        data
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Step 3: Upload employee document
  async uploadEmployeeDocument(employeeId, formData) {
    try {
      const url = `${apiClient.baseURL}/employees/${employeeId}/documents`;

      const token = apiClient.getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.status === 401) {
        apiClient.removeToken();
        window.location.href = "/login";
        throw new Error(data.message || "Unauthorized. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload document");
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Step 3: Set employee work information 
 async setEmployeeWorkInfo(employeeId, data) {
  const { data: response } = await apiClient.post(
    `/employees/${employeeId}/work-info`,
    data
  );
  return response;
}

  // Add employee project allocation
  async addEmployeeProjectAllocation(employeeId, data) {
    const { data: response } = await apiClient.post(
      `/employees/${employeeId}/project-allocation`,
      data
    );
    if (!response.success) {
      throw new Error(response.error || response.message || 'Failed to create project allocation');
    }
    return response;
  }

  async updateEmployeeProjectAllocation(employeeId, allocationId, data) {
    const { data: response } = await apiClient.put(
      `/employees/${employeeId}/project-allocation/${allocationId}`,
      data
    );
    if (!response.success) {
      throw new Error(response.error || response.message || 'Failed to update project allocation');
    }
    return response;
  }

  // Get employee by ID
  async getEmployeeById(employeeId, timestamp = null) {
    try {
      // Add cache-busting parameter to prevent browser caching
      const cacheBuster = timestamp || new Date().getTime();
      const { data: response } = await apiClient.get(`/employees/${employeeId}?_t=${cacheBuster}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get all employees with optional server-side filters
  async getAllEmployees(page = 1, limit = 10, status = null, filters = {}) {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (status) params.set("status", status);

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && String(value).trim()) {
          params.set(key, String(value).trim());
        }
      });

      const { data: response } = await apiClient.get(
        `/employees?${params.toString()}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get next available employee ID
  async getNextEmployeeId() {
    try {
      const { data: response } = await apiClient.get("/employees/next-emp-id");
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Upload employee profile photo
  async uploadEmployeeProfilePhoto(employeeId, imageFile) {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const url = `${apiClient.baseURL}/employees/${employeeId}/profile-photo`;
      const token = apiClient.getToken();

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload profile photo");
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Get total employee count
  async getEmployeeCount(status = null) {
    try {
      const query = status ? `?status=${encodeURIComponent(status)}` : "";
      const { data: response } = await apiClient.get(`/employees/count${query}`);
      return response;
    } catch (error) {
      console.error("Error fetching employee count:", error);
      throw error;
    }
  }

  // Get all departments
  async getAllDepartments() {
    try {
      const { data: response } = await apiClient.get("/departments");
      return response;
    } catch (error) {
      console.error("Error fetching departments:", error);
      throw error;
    }
  }
}

// Create singleton instance
const employeeAPI = new EmployeeAPI();
export default employeeAPI;

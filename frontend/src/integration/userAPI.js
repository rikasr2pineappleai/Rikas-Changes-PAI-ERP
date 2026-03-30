// User API Service
import apiClient from "../utils/apiClient";

class UserAPI {
  // Get all users for assignment purposes (with first_name and relevant fields)
  async getUsersForAssignment() {
    try {
      const { data: response } = await apiClient.get("/users/for-assignment");
      return response;
    } catch (error) {
      console.error("Error fetching users for assignment:", error);
      throw error;
    }
  }
}

// Create singleton instance
const userAPI = new UserAPI();

export default userAPI;
// Rating API Service
import apiClient from "../utils/apiClient";

class RatingAPI {
  // Submit ratings for an employee
  async submitRatings(employeeId, ratings) {
    try {
      const { data: response } = await apiClient.post(
        `/ratings/employee/${employeeId}`,
        { ratings }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get all ratings for an employee
  async getEmployeeRatings(employeeId) {
    try {
      const { data: response } = await apiClient.get(
        `/ratings/employee/${employeeId}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get remarks for a specific criteria
  async getRatingRemarks(employeeId, criteria) {
    try {
      const { data: response } = await apiClient.get(
        `/ratings/employee/${employeeId}/remarks/${encodeURIComponent(criteria)}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get all ratings given by current user
  async getRaterRatings() {
    try {
      const { data: response } = await apiClient.get(
        `/ratings/my-ratings`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update a specific rating
  async updateRating(ratingId, updateData) {
    try {
      const { data: response } = await apiClient.put(
        `/ratings/${ratingId}`,
        updateData
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Delete a rating
  async deleteRating(ratingId) {
    try {
      const { data: response } = await apiClient.delete(
        `/ratings/${ratingId}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new RatingAPI();
import apiClient from "../utils/apiClient";

const apiRequest = async (endpoint, options = {}) => {
  const response = await apiClient.get(endpoint, options);
  return response.data;
};

export const fetchProjectsDashboard = async () => {
  return await apiRequest("/projects");
};

export const fetchProjectById = async (projectId) => {
  // Validate projectId before making API call
  if (!projectId || isNaN(projectId) || parseInt(projectId) <= 0) {
    throw new Error("Invalid project ID provided");
  }
  return await apiRequest(`/projects/${projectId}`);
};

export const createProject = async (projectData) => {
  const response = await apiClient.post("/projects", projectData);
  return response.data;
};

export const deleteProject = async (projectId) => {
  // Validate projectId before making API call
  if (!projectId || isNaN(projectId) || parseInt(projectId) <= 0) {
    throw new Error("Invalid project ID provided");
  }
  const response = await apiClient.delete(`/projects/${projectId}`);
  return response.data;
};

// ✅ NEW (DB): tasks under project
export const fetchTasksByProject = async (projectId) => {
  // Validate projectId before making API call
  if (!projectId || isNaN(projectId) || parseInt(projectId) <= 0) {
    throw new Error("Invalid project ID provided");
  }
  return await apiRequest(`/projects/${projectId}/tasks`);
};

export const createTaskForProject = async (projectId, payload) => {
  // Validate projectId before making API call
  if (!projectId || isNaN(projectId) || parseInt(projectId) <= 0) {
    throw new Error("Invalid project ID provided");
  }
  const response = await apiClient.post(
    `/projects/${projectId}/tasks`,
    payload,
  );
  return response.data;
};

export const fetchProjectAssignees = async (projectId) => {
  // Validate projectId before making API call
  if (!projectId || isNaN(projectId) || parseInt(projectId) <= 0) {
    throw new Error("Invalid project ID provided");
  }
  return await apiRequest(`/projects/${projectId}/assignees`);
};
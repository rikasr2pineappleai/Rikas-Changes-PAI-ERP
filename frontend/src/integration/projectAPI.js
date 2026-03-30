import apiClient from "../utils/apiClient";

const apiRequest = async (endpoint, options = {}) => {
  const response = await apiClient.get(endpoint, options);
  return response.data;
};

export const fetchProjectsDashboard = async () => {
  return await apiRequest("/projects");
};

export const fetchProjectById = async (projectId) => {
  return await apiRequest(`/projects/${projectId}`);
};

export const createProject = async (projectData) => {
  const response = await apiClient.post("/projects", projectData);
  return response.data;
};

export const deleteProject = async (projectId) => {
  const response = await apiClient.delete(`/projects/${projectId}`);
  return response.data;
};

// ✅ IMPORTANT: Save members to DB (project_allocation)
export const replaceProjectAllocations = async (projectId, userIds = []) => {
  const payload = { user_ids: (userIds || []).map((x) => Number(x)) };
  const response = await apiClient.post(
    `/projects/${projectId}/allocations`,
    payload,
  );
  return response.data;
};
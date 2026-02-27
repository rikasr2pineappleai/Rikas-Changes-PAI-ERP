import apiClient from "../utils/apiClient";

export const fetchTasksByProject = async (projectId) => {
  const res = await apiClient.get(`/tasks/project/${projectId}`);
  return res.data;
};

export const createTask = async (payload) => {
  const res = await apiClient.post("/tasks", payload);
  return res.data;
};

export const updateTask = async (taskId, payload) => {
  const res = await apiClient.put(`/tasks/${taskId}`, payload);
  return res.data;
};

export const deleteTask = async (taskId) => {
  const res = await apiClient.delete(`/tasks/${taskId}`);
  return res.data;
};
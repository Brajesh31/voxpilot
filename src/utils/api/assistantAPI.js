// Assistant API Services for VoxPilot
import { getAllAssistantUrl, assistantUrl, baseBackendURL } from '../config';
import { apiClient } from '../../services/api/apiClient';

/**
 * Fetch all assistants for the current account/organization
 * @param {string} [userOrgId]
 * @returns {Promise<any>}
 */
export const getAllAssistant = async (userOrgId) => {
  const url = userOrgId ? `${getAllAssistantUrl}?organizationId=${userOrgId}` : getAllAssistantUrl;
  return apiClient.get(url);
};

/**
 * Fetch single assistant details by ID
 * @param {string} id
 * @returns {Promise<any>}
 */
export const getAssistantFetchExternal = async (id) => {
  if (!id) throw new Error('Assistant ID is required');
  const url = `${baseBackendURL}assistants/${id}`;
  return apiClient.get(url);
};

/**
 * Update assistant details by ID
 * @param {string} id
 * @param {Record<string, any>} data
 * @returns {Promise<any>}
 */
export const updateAssistant = async (id, data) => {
  if (!id) throw new Error('Assistant ID is required for update');
  const url = `${assistantUrl}/${id}`;
  return apiClient.patch(url, data);
};

/**
 * Create a new assistant
 * @param {Record<string, any>} data
 * @returns {Promise<any>}
 */
export const createAssistant = async (data) => {
  return apiClient.post(assistantUrl, data);
};

/**
 * Delete an assistant by ID
 * @param {string} id
 * @returns {Promise<any>}
 */
export const deleteAssistantApi = async (id) => {
  if (!id) throw new Error('Assistant ID is required for deletion');
  const url = `${assistantUrl}/${id}`;
  return apiClient.delete(url);
};

/**
 * Reassign an assistant to an organization
 * @param {string} assistantID
 * @param {string} organizationId
 * @returns {Promise<any>}
 */
export const reassignOrganization = async (assistantID, organizationId) => {
  const url = `${assistantUrl}/${assistantID}/assign-organization`;
  return apiClient.patch(url, { organizationId });
};

/**
 * Get assistant by organization ID
 * @param {string} orgId
 * @returns {Promise<any>}
 */
export const getAssistantWithOrgId = async (orgId) => {
  const url = `${assistantUrl}?organizationId=${orgId}`;
  return apiClient.get(url);
};
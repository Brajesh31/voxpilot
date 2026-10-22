// Interactive Chat API Services for VoxPilot
import { chatApiUrl } from '../config';
import { apiClient } from '../../services/api/apiClient';

/**
 * Send an interaction message to a chat session
 * @param {Record<string, any>} payload
 * @returns {Promise<any>}
 */
export const chatApi = async (payload) => {
  return apiClient.post(chatApiUrl, payload);
};

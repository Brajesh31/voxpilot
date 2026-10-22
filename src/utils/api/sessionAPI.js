// Interactive Session API Services for VoxPilot
import { sessionApiUrl } from '../config';
import { apiClient } from '../../services/api/apiClient';

/**
 * Initialize a new chat session for testing an assistant
 * @param {Record<string, any>} payload
 * @returns {Promise<any>}
 */
export const createSession = async (payload) => {
  return apiClient.post(sessionApiUrl, payload);
};

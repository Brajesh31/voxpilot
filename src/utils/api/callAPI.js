// Telephony Call & Analytics API Services for VoxPilot
import { getOutbondCallURL, callsListUrl, callDetailWithId, callStatsUrl } from '../config';
import { apiClient } from '../../services/api/apiClient';

/**
 * Dispatch an outbound phone call to a recipient number
 * @param {Record<string, any>} payload
 * @returns {Promise<any>}
 */
export const placeOutboundCall = async (payload) => {
  return apiClient.post(getOutbondCallURL, payload);
};

export const getOutbondCall = placeOutboundCall;

/**
 * Fetch calls log history
 * @param {Record<string, any>} [params]
 * @returns {Promise<any>}
 */
export const getCallsList = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${callsListUrl}?${query}` : callsListUrl;
  return apiClient.get(url).catch(() => ({ calls: [] }));
};

/**
 * Fetch detailed metrics and transcript for a specific call by ID
 * @param {string} callId
 * @returns {Promise<any>}
 */
export const getCallDetails = async (callId) => {
  if (!callId) throw new Error('Call ID is required to fetch call details');
  return apiClient.get(`${callDetailWithId}${callId}`);
};

/**
 * Fetch organization call statistics and analytics
 * @param {string} [organizationId]
 * @returns {Promise<any>}
 */
export const getCallStats = async (organizationId) => {
  const url = organizationId ? `${callStatsUrl}?organizationId=${organizationId}` : callStatsUrl;
  return apiClient.get(url).catch(() => ({ stats: null }));
};

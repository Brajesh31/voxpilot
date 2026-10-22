// Phone Number Management API Services for VoxPilot
import { phoneNumberURL } from '../config';
import { apiClient } from '../../services/api/apiClient';

/**
 * Fetch all available caller phone numbers for outbound telephony
 * @returns {Promise<any>}
 */
export const getAllPhoneNumber = async () => {
  return apiClient.get(phoneNumberURL);
};
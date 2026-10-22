// VoxPilot API Configuration
import { getApiKey } from './apiKeyManager';

// Base API URL with environment fallback (Vite proxy default: /api/)
const envBaseUrl = import.meta.env.VITE_API_URL || '/api';
export const baseBackendURL = envBaseUrl.endsWith('/') ? envBaseUrl : `${envBaseUrl}/`;

// Dynamic token retrieval function to prevent stale closures
export const getApiToken = () => getApiKey();

// Backward compatibility accessor (warns if used directly where dynamic token is needed)
export const apiToken = getApiKey();

// Assistants Endpoints
export const getAllAssistantUrl = `${baseBackendURL}assistants`;
export const assistantUrl = `${baseBackendURL}assistants`;

// Phone Number Endpoints
export const phoneNumberURL = `${baseBackendURL}phone-numbers`;
export const phoneNumberByOrgIdURL = `${baseBackendURL}phone-numbers/organization/`;

// Telephony & Call Endpoints
export const getOutbondCallURL = `${baseBackendURL}calls/outbound`;
export const callsListUrl = `${baseBackendURL}calls`;
export const callDetailWithId = `${baseBackendURL}calls/details?id=`;
export const callStatsUrl = `${baseBackendURL}analytics/org-call-stats`;

// Session Endpoints
export const sessionApiUrl = `${baseBackendURL}sessions`;

// Chat Endpoints
export const chatApiUrl = `${baseBackendURL}chats`;
export const chatSessionURl = `${chatApiUrl}/session/`;

// API Key Validation Endpoint
export const testApiKeyUrl = `${baseBackendURL}api-keys/test`;

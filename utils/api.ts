import AsyncStorage from '@react-native-async-storage/async-storage';
import { getItem } from './storage';

// @ts-ignore
const API_BASE = process.env.API_BASE || 'https://laundrybackend-573d.onrender.com/api';

// Helper function to get MIME type from file extension
export function getMimeType(fileName: string): string {
  const extension = fileName.toLowerCase().split('.').pop();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream';
  }
}

export async function apiRequest(endpoint: string, options: RequestInit = {}, auth = true) {
  let headers: any = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (auth) {
    const token = await getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API Error');
  return data;
}

// File upload API request with multipart/form-data support
export async function apiUploadRequest(endpoint: string, formData: FormData, auth = true) {
  let headers: any = {
    // Don't set Content-Type for FormData - let the browser set it with boundary
  };
  if (auth) {
    const token = await getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    body: formData,
    headers
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API Error');
  return data;
}

// Auth APIs
export const loginPartner = (body: any) => apiRequest('/partner/login', { method: 'POST', body: JSON.stringify(body) }, false);
export const registerPartner = async (body: any, bannerUri?: string, bannerFileName?: string) => {
  if (bannerUri) {
    const formData = new FormData();
    for (const key in body) {
      formData.append(key, body[key]);
    }
    formData.append('banner', {
      uri: bannerUri,
      type: getMimeType(bannerFileName || 'banner.jpg'),
      name: bannerFileName || 'banner.jpg',
    } as any);
    return apiUploadRequest('/partner/register', formData, false);
  } else {
    return apiRequest('/partner/register', { method: 'POST', body: JSON.stringify(body) }, false);
  }
};
export const verifyPartner = (body: any) => apiRequest('/partner/verify', { method: 'POST', body: JSON.stringify(body) }, false);

// Area APIs
export const getAreas = () => apiRequest('/areas', {method: 'GET'}, false);

// Orders
export const getPartnerOrders = (params = '') => apiRequest(`/partner/orders${params ? '?' + params : ''}`);
export const getOrderById = (id: string) => apiRequest(`/partner/orders/${id}`);
export const updateOrderStatus = (id: string, body: any) => apiRequest(`/partner/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) });

// Partner Profile
export const getPartnerProfile = () => apiRequest('/partner/profile', { method: 'GET' });
export const updatePartnerProfile = (body: any) => apiRequest('/partner/profile', { method: 'PATCH', body: JSON.stringify(body) });

// File Upload APIs
export const uploadPartnerBanner = (imageUri: string, fileName?: string) => {
  const formData = new FormData();
  const finalFileName = fileName || 'banner.jpg';
  formData.append('banner', {
    uri: imageUri,
    type: getMimeType(finalFileName),
    name: finalFileName,
  } as any);
  return apiUploadRequest('/partner/banner', formData);
};

export const uploadPartnerbanner = (imageUri: string, fileName?: string) => {
  const formData = new FormData();
  const finalFileName = fileName || 'banner.jpg';
  formData.append('banner', {
    uri: imageUri,
    type: getMimeType(finalFileName),
    name: finalFileName,
  } as any);
  return apiUploadRequest('/partner/banner', formData);
};

// Generic file upload function
export const uploadFile = (endpoint: string, fileUri: string, fieldName: string, fileName?: string, mimeType?: string) => {
  const formData = new FormData();
  const finalFileName = fileName || 'file.jpg';
  const finalMimeType = mimeType || getMimeType(finalFileName);
  
  formData.append(fieldName, {
    uri: fileUri,
    type: finalMimeType,
    name: finalFileName,
  } as any);
  return apiUploadRequest(endpoint, formData);
};

// Laundry Item APIs
export const getAllLaundryItems = () => apiRequest('/partner/laundry-items', { method: 'GET' });
export const createLaundryItem = (body: any) => apiRequest('/partner/laundry-items', { method: 'POST', body: JSON.stringify(body) });
export const updateLaundryItem = (id: string, body: any) => apiRequest(`/partner/laundry-items/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteLaundryItem = (id: string) => apiRequest(`/partner/laundry-items/${id}`, { method: 'DELETE' });
export const toggleLaundryItemAvailability = (id: string, body: any) => apiRequest(`/partner/laundry-items/${id}/availability`, { method: 'PATCH', body: JSON.stringify(body) });

// Analytics APIs (need to be implemented in backend)
export const getRevenueAnalytics = (period = '7days') => apiRequest(`/partner/analytics/revenue?period=${period}`);
export const getOrderAnalytics = (period = '7days') => apiRequest(`/partner/analytics/orders?period=${period}`);
export const getServiceAnalytics = (period = '7days') => apiRequest(`/partner/analytics/services?period=${period}`);
export const getPerformanceMetrics = (period = '7days') => apiRequest(`/partner/analytics/performance?period=${period}`);

// Profile management
export const updatePartnerHours = (body: any) => apiRequest('/partner/hours', { method: 'PATCH', body: JSON.stringify(body) });
export const updatePartnerStatus = (body: any) => apiRequest('/partner/status', { method: 'PATCH', body: JSON.stringify(body) });
export const updatePartnerRadius = (body: any) => apiRequest('/partner/radius', { method: 'PATCH', body: JSON.stringify(body) });

// Apparel Types
export const getAllApparelTypes = () => apiRequest('/partner/apparel-types', { method: 'GET' });
export const updatePartnerApparelTypes = (body: any) => apiRequest('/partner/apparel-types', { method: 'PATCH', body: JSON.stringify(body) });

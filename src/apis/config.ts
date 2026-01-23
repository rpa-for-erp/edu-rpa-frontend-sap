import { LocalStorage } from '@/constants/localStorage';
import { getLocalStorageObject } from '@/utils/localStorageService';
import axios from 'axios';

const apiBase = axios.create();
apiBase.interceptors.request.use((config) => {
  const accessToken = getLocalStorageObject(LocalStorage.ACCESS_TOKEN);
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiBase.interceptors.response.use(
  (config) => {
    return config;
  },
  (error) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      // Clear all auth data from localStorage
      localStorage.removeItem(LocalStorage.ACCESS_TOKEN);
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      
      return Promise.reject(error);
    }
    
    // Handle 400 Bad Request
    if (error.response?.status === 400) {
      if (error.response.data?.error?.details?.length > 0) {
        console.error(error.response.data?.error?.details[0]?.vi?.message);
      } else {
        console.error(error.response.data?.error?.message);
      }
    }
    
    throw error;
  }
);

export default apiBase;

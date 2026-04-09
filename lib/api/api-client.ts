import axios from "axios";
import { useAuthStore } from "../auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

/**
 * Layer 1: API Client
 * Centralized Axios instance with base configuration and interceptors
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request Interceptor: Attach the access token to every request
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage as set by the useAuthStore
    const token = typeof window !== "undefined" ? localStorage.getItem("auth-storage") : null;

    if (token) {
      try {
        const parsed = JSON.parse(token);
        const accessToken = parsed.state?.accessToken;
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      } catch (e) {
        console.error("Error parsing auth-token from localStorage", e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Calls the backend logout endpoint to expire the HttpOnly refreshToken cookie,
 * then clears local auth state and redirects to login.
 * This prevents the stale-cookie loop where a revoked/expired refreshToken
 * stays in the browser and causes infinite 4xx refresh retries.
 */
const forceLogout = async () => {
  try {
    // Tell backend to expire the HttpOnly cookie — JS cannot do this itself
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
  } catch {
    // Best-effort: even if this fails, still clear local state
  }
  useAuthStore.getState().logout();
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
};

// Response Interceptor: Handle global errors (like 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already retried this original request
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
        
        const newAccessToken = data.accessToken;
        
        if (newAccessToken) {
          useAuthStore.getState().setAccessToken(newAccessToken);
          
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        }
      } catch (err) {
        processQueue(err, null);
        // Call backend logout to expire the HttpOnly cookie, then clear local state
        await forceLogout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

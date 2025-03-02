//export const API_URL = 'https://ysg-driver-backend.onrender.com/api';
export const API_URL = 'http://localhost:2000/api';

// Configuration des endpoints de l'API
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me'
  },
  USERS: {
    BASE: '/users',
    DETAIL: (id) => `/users/${id}`
  },
  TIMELOGS: {
    BASE: '/timelogs',
    DETAIL: (id) => `/timelogs/${id}`,
    ACTIVE: '/timelogs/active'
  },
  MOVEMENTS: {
    BASE: '/movements',
    DETAIL: (id) => `/movements/${id}`,
    PHOTOS: (id) => `/movements/${id}/photos`
  }
};
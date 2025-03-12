export const API_URL = process.env.REACT_APP_API_URL;

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
  },
  PREPARATIONS: {
    BASE: '/preparations',
    DETAIL: (id) => `/preparations/${id}`,
    PHOTOS: (id) => `/preparations/${id}/photos`,
    TASKS: (id) => `/preparations/${id}/tasks`
  },
  REPORTS: {
    MOVEMENTS: '/reports/movements',
    PREPARATIONS: '/reports/preparations'
  },
  SCHEDULES: {
    BASE: '/schedules',
    USER: (userId) => `/schedules/user/${userId}`,
    ALL: '/schedules/all',
    PREPARATORS: '/schedules/preparators'
  },
  ANALYTICS_ENDPOINTS: {
    PREPARATOR_PERFORMANCE: '/api/analytics/preparator-performance',
    TASK_METRICS: '/api/analytics/task-metrics',
    DAILY_METRICS: '/api/analytics/daily-metrics',
    COMPARATIVE_METRICS: '/api/analytics/comparative-metrics',
    GLOBAL_METRICS: '/api/analytics/global-metrics',
    VEHICLE_MODEL_STATS: '/api/analytics/vehicle-model-stats',
    PEAK_HOURS: '/api/analytics/peak-hours'
  }
};
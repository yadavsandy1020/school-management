import axios from 'axios'

const API_URL = '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add tenant ID header
api.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('tenantId')
  if (tenantId) {
    config.headers['x-tenant-id'] = tenantId
  }
  return config
})

// Add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const refreshToken = localStorage.getItem('refreshToken')

    if (error.response?.status === 401 && refreshToken && !originalRequest?._retry && !originalRequest?.url?.includes('/auth/refresh')) {
      originalRequest._retry = true

      try {
        const response = await api.post('/auth/refresh', { refreshToken })
        const { token } = response.data
        localStorage.setItem('token', token)
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('refreshToken')
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('tenantId')
      window.location.href = '/login'
    }

    if (error.response?.status === 403 && error.response?.data?.error?.includes('module is not enabled')) {
      window.dispatchEvent(new CustomEvent('module-disabled', {
        detail: { message: error.response.data.error, readOnly: error.response.data.readOnly }
      }))
    }

    return Promise.reject(error)
  }
)

export default api

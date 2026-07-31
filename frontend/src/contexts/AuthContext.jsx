import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, refreshToken, user: userData } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(userData))
      if (userData.tenantId) localStorage.setItem('tenantId', userData.tenantId)
      if (userData.schoolId) localStorage.setItem('schoolId', userData.schoolId)

      setUser(userData)
      toast.success('Login successful')
      return { success: true }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed')
      return { success: false, error: error.response?.data?.error }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      const { token, user: newUser } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(newUser))
      if (newUser.tenantId) localStorage.setItem('tenantId', newUser.tenantId)
      if (newUser.schoolId) localStorage.setItem('schoolId', newUser.schoolId)

      setUser(newUser)
      toast.success('Registration successful')
      return { success: true }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed')
      return { success: false, error: error.response?.data?.error }
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Failed to revoke the current session:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('tenantId')
      localStorage.removeItem('schoolId')
      setUser(null)
      toast.success('Logged out successfully')
      window.location.href = '/login'
    }
  }

  const hasPermission = (permission) => {
    if (!user) return false
    if (user.role === 'super_admin' || user.role === 'organization_owner') return true
    const permissions = user.permissions || []
    return permissions.includes('*') || permissions.includes(permission)
  }

  const hasRole = (...roles) => {
    if (!user) return false
    return roles.includes(user.role) || user.role === 'super_admin'
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    hasPermission,
    hasRole
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

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

  const login = async (email, password, tenantId) => {
    try {
      const response = await api.post('/auth/login', { email, password, tenantId })
      const { token, user: userData } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('tenantId', userData.tenantId)

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
      localStorage.setItem('tenantId', newUser.tenantId)

      setUser(newUser)
      toast.success('Registration successful')
      return { success: true }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed')
      return { success: false, error: error.response?.data?.error }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('tenantId')
    setUser(null)
    toast.success('Logged out successfully')
    window.location.href = '/login'
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
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

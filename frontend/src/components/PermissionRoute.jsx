import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const PermissionRoute = ({ permission, children, fallback = <Navigate to="/dashboard" replace /> }) => {
  const { hasPermission } = useAuth()

  return hasPermission(permission) ? children : fallback
}

export default PermissionRoute

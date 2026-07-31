import { useAuth } from '../contexts/AuthContext'

export default function Can({ permission, roles, children, fallback = null }) {
  const { hasPermission, hasRole } = useAuth()

  const hasAccess = () => {
    if (permission) return hasPermission(permission)
    if (roles) return hasRole(...roles)
    return true
  }

  return hasAccess() ? children : fallback
}

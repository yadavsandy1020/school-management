import { useAuth } from '../contexts/AuthContext'

export const usePermissions = () => {
  const { hasPermission, hasRole, user } = useAuth()

  return {
    can: hasPermission,
    is: hasRole,
    isSuperAdmin: user?.role === 'super_admin',
    permissions: user?.permissions || []
  }
}

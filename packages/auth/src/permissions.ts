import type { UserRole } from './types';

export enum Permission {
  // Organization
  ORG_VIEW = 'org:view',
  ORG_EDIT = 'org:edit',
  ORG_DELETE = 'org:delete',
  ORG_BILLING = 'org:billing',

  // Projects
  PROJECT_CREATE = 'project:create',
  PROJECT_VIEW = 'project:view',
  PROJECT_EDIT = 'project:edit',
  PROJECT_DELETE = 'project:delete',

  // Queries
  QUERY_CREATE = 'query:create',
  QUERY_VIEW = 'query:view',
  QUERY_EDIT = 'query:edit',
  QUERY_DELETE = 'query:delete',
  QUERY_RUN = 'query:run',

  // Reports
  REPORT_VIEW = 'report:view',
  REPORT_CREATE = 'report:create',
  REPORT_EXPORT = 'report:export',

  // Users
  USER_INVITE = 'user:invite',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',

  // API Keys
  API_KEY_CREATE = 'api:create',
  API_KEY_VIEW = 'api:view',
  API_KEY_DELETE = 'api:delete',
}

const rolePermissions: Record<UserRole, Permission[]> = {
  OWNER: Object.values(Permission), // All permissions
  ADMIN: [
    Permission.ORG_VIEW,
    Permission.ORG_EDIT,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_VIEW,
    Permission.PROJECT_EDIT,
    Permission.PROJECT_DELETE,
    Permission.QUERY_CREATE,
    Permission.QUERY_VIEW,
    Permission.QUERY_EDIT,
    Permission.QUERY_DELETE,
    Permission.QUERY_RUN,
    Permission.REPORT_VIEW,
    Permission.REPORT_CREATE,
    Permission.REPORT_EXPORT,
    Permission.USER_INVITE,
    Permission.USER_EDIT,
    Permission.API_KEY_CREATE,
    Permission.API_KEY_VIEW,
    Permission.API_KEY_DELETE,
  ],
  MEMBER: [
    Permission.ORG_VIEW,
    Permission.PROJECT_VIEW,
    Permission.PROJECT_EDIT,
    Permission.QUERY_CREATE,
    Permission.QUERY_VIEW,
    Permission.QUERY_EDIT,
    Permission.QUERY_RUN,
    Permission.REPORT_VIEW,
    Permission.REPORT_CREATE,
    Permission.API_KEY_CREATE,
    Permission.API_KEY_VIEW,
  ],
  VIEWER: [
    Permission.ORG_VIEW,
    Permission.PROJECT_VIEW,
    Permission.QUERY_VIEW,
    Permission.REPORT_VIEW,
  ],
};

export function hasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  return rolePermissions[role].includes(permission);
}

export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  const userPermissions = rolePermissions[role];
  return permissions.some((permission) => userPermissions.includes(permission));
}

export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  const userPermissions = rolePermissions[role];
  return permissions.every((permission) => userPermissions.includes(permission));
}

export function getRolePermissions(role: UserRole): Permission[] {
  return [...rolePermissions[role]];
}
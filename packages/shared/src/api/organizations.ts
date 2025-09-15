import { ApiClient } from './client';
import type { Organization } from './types';

export interface OrganizationMember {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface InviteUserRequest {
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  website?: string;
  logoUrl?: string;
}

export interface UpdateUserRoleRequest {
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export class OrganizationsApi {
  constructor(private client: ApiClient) {}

  async getOrganization() {
    return this.client.get<Organization & {
      description?: string;
      website?: string;
      logoUrl?: string;
      _count: {
        users: number;
        projects: number;
      };
    }>('/api/organization');
  }

  async updateOrganization(data: UpdateOrganizationRequest) {
    return this.client.patch<Organization>('/api/organization', data);
  }

  async getMembers() {
    return this.client.get<OrganizationMember[]>('/api/organization/members');
  }

  async inviteUser(data: InviteUserRequest) {
    return this.client.post<{
      message: string;
      invitation: {
        id: string;
        email: string;
        role: string;
        expiresAt: string;
      };
    }>('/api/organization/members/invite', data);
  }

  async updateUserRole(userId: string, data: UpdateUserRoleRequest) {
    return this.client.patch<OrganizationMember>(
      `/api/organization/members/${userId}/role`,
      data
    );
  }

  async removeMember(userId: string) {
    return this.client.delete(`/api/organization/members/${userId}`);
  }
}
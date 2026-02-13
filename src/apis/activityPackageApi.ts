import apiBase from './config';
import { 
  ActivityPackage, 
  CreatePackageRequest, 
  SuggestedTemplate 
} from '@/interfaces/activity-package';

const activityPackageApi = {
  // Get all active activity packages
  getAllPackages: async (filters?: { name?: string; parseStatus?: string }): Promise<ActivityPackage[]> => {
    const params = new URLSearchParams();
    if (filters?.name) params.append('name', filters.name);
    if (filters?.parseStatus) params.append('parseStatus', filters.parseStatus);
    
    // Use /activity-packages as requested by "package service"
    const response = await apiBase.get(
      `${process.env.NEXT_PUBLIC_DEV_API}/activity-packages`, { params }
    );
    
    // Support both formats for backward compatibility
    return response.data.data || response.data; 
  },

  // Create package (Upload library)
  createPackage: async (data: CreatePackageRequest): Promise<ActivityPackage> => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('name', data.name);
    formData.append('displayName', data.displayName);
    formData.append('version', data.version);
    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await apiBase.post(
      `${process.env.NEXT_PUBLIC_DEV_API}/activity-packages/upload`, 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Get single package
  getPackageById: async (id: string): Promise<ActivityPackage> => {
    const response = await apiBase.get(
      `${process.env.NEXT_PUBLIC_DEV_API}/activity-packages/${id}`
    );
    return response.data;
  },

  // Get suggested templates
  getSuggestedTemplates: async (id: string): Promise<SuggestedTemplate[]> => {
    const response = await apiBase.get(
      `${process.env.NEXT_PUBLIC_DEV_API}/activity-packages/${id}/suggested-templates`
    );
    return response.data;
  },

  // Reparse package library
  reparsePackage: async (id: string): Promise<ActivityPackage> => {
    const response = await apiBase.put(
      `${process.env.NEXT_PUBLIC_DEV_API}/activity-packages/${id}/reparse`
    );
    return response.data;
  },

  // Delete package
  deletePackage: async (id: string): Promise<void> => {
    await apiBase.delete(
      `${process.env.NEXT_PUBLIC_DEV_API}/activity-packages/${id}`
    );
  },

  // Get activity packages accessible by team
  getPackagesByTeam: async (teamId: string): Promise<ActivityPackage[]> => {
    const response = await apiBase.get(
      `${process.env.NEXT_PUBLIC_DEV_API}/activity-packages/team/${teamId}`
    );
    return response.data.data;
  },
};

export default activityPackageApi;

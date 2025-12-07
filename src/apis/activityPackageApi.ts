import apiBase from './config';
import { ActivityPackage } from '@/interfaces/activity-package';
const activityPackageApi = {
  // Get all active activity packages
  getAllPackages: async (): Promise<ActivityPackage[]> => {
    const response = await apiBase.get(
      `${process.env.NEXT_PUBLIC_DEV_API}/activity-packages`
    );
    return response.data.data;
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

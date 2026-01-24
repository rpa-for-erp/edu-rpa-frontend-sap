import { useRouter } from 'next/router';
import TeamLayout from '@/components/Layouts/TeamLayout';
import SidebarContent from '@/components/Sidebar/SidebarContent/SidebarContent';
import { Box, Text } from '@chakra-ui/react';

export default function TeamSettings() {
  const router = useRouter();
  const { workspaceId, teamId } = router.query;

  return (
    <TeamLayout>
      <div className="mb-[200px]">
        <SidebarContent>
          <h1 className="pl-[20px] ml-[35px] font-bold text-2xl text-[#319795]">
            Team Settings
          </h1>
          
          <div className="w-90 mx-auto my-[30px]">
            <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
              <Text fontSize="lg" mb={4}>
                Team Configuration
              </Text>
              <Text color="gray.600">
                Configure team settings here
              </Text>
            </Box>
          </div>
        </SidebarContent>
      </div>
    </TeamLayout>
  );
}

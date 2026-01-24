import { useRouter } from 'next/router';
import TeamLayout from '@/components/Layouts/TeamLayout';
import SidebarContent from '@/components/Sidebar/SidebarContent/SidebarContent';
import { Box, Text } from '@chakra-ui/react';

export default function TeamDashboard() {
  const router = useRouter();
  const { workspaceId, teamId } = router.query;

  return (
    <TeamLayout>
      <div className="mb-[200px]">
        <SidebarContent>
          <h1 className="pl-[20px] ml-[35px] font-bold text-2xl text-[#319795]">
            Team Dashboard
          </h1>
          
          <div className="w-90 mx-auto my-[30px]">
            <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
              <Text fontSize="lg" mb={4}>
                Welcome to Team Dashboard
              </Text>
              <Text color="gray.600">
                Team ID: {teamId}
              </Text>
              <Text color="gray.600">
                Workspace ID: {workspaceId}
              </Text>
            </Box>
          </div>
        </SidebarContent>
      </div>
    </TeamLayout>
  );
}

import React from 'react';
import { HStack, Avatar, Tooltip, Badge, Box, Text } from '@chakra-ui/react';

export interface ActiveUser {
  userId: string;
  userName: string;
  color: string;
}

interface Props {
  users: ActiveUser[];
  isConnected: boolean;
}

export const ActiveUsers: React.FC<Props> = ({ users, isConnected }) => {
  return (
    <Box
      position="fixed"
      top={4}
      right={4}
      zIndex={1000}
      bg="white"
      p={3}
      borderRadius="lg"
      boxShadow="lg"
      border="1px solid"
      borderColor="gray.200"
    >
      <HStack spacing={3}>
        <Badge
          colorScheme={isConnected ? 'green' : 'red'}
          fontSize="sm"
          px={2}
          py={1}
          borderRadius="md"
        >
          {isConnected ? '🟢 Online' : '🔴 Offline'}
        </Badge>
        
        {users.length > 0 && (
          <>
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              {users.length} {users.length === 1 ? 'user' : 'users'} online
            </Text>
            <HStack spacing={-2}>
              {users.slice(0, 5).map((user) => (
                <Tooltip key={user.userId} label={user.userName} placement="bottom">
                  <Avatar
                    size="sm"
                    name={user.userName}
                    bg={user.color}
                    cursor="pointer"
                    border="2px solid white"
                    _hover={{ transform: 'scale(1.1)', zIndex: 10 }}
                    transition="transform 0.2s"
                  />
                </Tooltip>
              ))}
              {users.length > 5 && (
                <Tooltip
                  label={users.slice(5).map(u => u.userName).join(', ')}
                  placement="bottom"
                >
                  <Avatar
                    size="sm"
                    name={`+${users.length - 5}`}
                    bg="gray.400"
                    cursor="pointer"
                    border="2px solid white"
                  />
                </Tooltip>
              )}
            </HStack>
          </>
        )}
      </HStack>
    </Box>
  );
};

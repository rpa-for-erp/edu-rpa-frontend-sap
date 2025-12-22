import React from 'react';
import { Box, Flex, Breadcrumb, BreadcrumbItem, BreadcrumbLink, IconButton, Avatar, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import { ChevronRightIcon, BellIcon, QuestionIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';

interface BpmnTopHeaderProps {
  processID: string;
  processName: string;
}

export default function BpmnTopHeader({ processID, processName }: BpmnTopHeaderProps) {
  const router = useRouter();

  return (
    <Box
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.200"
      px={4}
      py={2}
    >
      <Flex justify="space-between" align="center">
        {/* Breadcrumbs */}
        <Breadcrumb spacing="8px" separator={<ChevronRightIcon color="gray.500" />}>
          <BreadcrumbItem>
            <BreadcrumbLink 
              onClick={() => router.push('/studio')}
              fontSize="sm"
              color="gray.600"
              _hover={{ color: 'teal.500' }}
            >
              Homepage
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem>
            <BreadcrumbLink 
              onClick={() => router.push('/studio')}
              fontSize="sm"
              color="gray.600"
              _hover={{ color: 'teal.500' }}
            >
              Project
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink fontSize="sm" color="gray.900" fontWeight="medium">
              {processName || 'Name project'}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        {/* Right Icons */}
        <Flex align="center" gap={2}>
          <IconButton
            aria-label="Notifications"
            icon={<BellIcon />}
            variant="ghost"
            size="sm"
            colorScheme="gray"
          />
          
          <IconButton
            aria-label="Help"
            icon={<QuestionIcon />}
            variant="ghost"
            size="sm"
            colorScheme="gray"
          />

          <Menu>
            <MenuButton>
              <Avatar size="sm" name="User" bg="teal.500" />
            </MenuButton>
            <MenuList>
              <MenuItem>Profile</MenuItem>
              <MenuItem>Settings</MenuItem>
              <MenuItem>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
}


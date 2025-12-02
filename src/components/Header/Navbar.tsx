import { toggleSidebar } from '@/redux/slice/homeSlice';
import {
  Avatar,
  AvatarBadge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import Image from 'next/image';
import { FiMenu, FiBell, FiChevronDown } from 'react-icons/fi';
import { Md10K, MdArrowDropDown } from 'react-icons/md';
import Logo from '@/assets/images/logo.png';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '@/redux/slice/userSlice';
import { userSelector } from '@/redux/selector';
import { usePubNub } from 'pubnub-react';

import userApi from '@/apis/userApi';
import { useEffect, useState } from 'react';
import { getLocalStorageObject } from '@/utils/localStorageService';
import { LocalStorage } from '@/constants/localStorage';
import NotificationMenu from './NotificationMenu';
import { toastInfo } from '@/utils/common';
import { Notification } from '@/interfaces/notification';
import { refetchNotifications } from '@/redux/slice/notificationSlice';
import {
  MdClose,
  MdPerson,
  MdGroups,
  MdAdd,
  MdWorkspaces,
} from 'react-icons/md';
const privateNotiChannelPrefix = 'notification.';

const Navbar = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const pubnub = usePubNub();
  const toast = useToast();
  const user = useSelector(userSelector);

  const [userInfo, setUserInfo] = useState<any>(null);

  const removeAuthToken = () => {
    localStorage.removeItem(LocalStorage.ACCESS_TOKEN);
    localStorage.removeItem(LocalStorage.PROCESS_LIST);
    localStorage.removeItem(LocalStorage.VARIABLE_LIST);
  };

  useEffect(() => {
    const accessToken = getLocalStorageObject(LocalStorage.ACCESS_TOKEN);
    if (accessToken.length != 0) {
      const fetchUserData = async () => {
        try {
          const userData = await userApi.getMe();
          setUserInfo(userData);
        } catch (error) {
          console.error('Failed to fetch user data', error);
        }
      };
      fetchUserData();
    }
  }, []);

  const onReceiveNotification = (message) => {
    const notification: Notification = message.message;
    toastInfo(toast, `You have a new notification: ${notification.title}`);
    dispatch(refetchNotifications() as any);
  };

  useEffect(() => {
    if (userInfo && userInfo.length != 0) {
      dispatch(setUser(userInfo));
      dispatch(refetchNotifications() as any);
      // update user id for pubnub
      pubnub.setUUID(userInfo.id.toString());
      pubnub.subscribe({
        channels: [`${privateNotiChannelPrefix}${userInfo.id}`],
      });
      pubnub.addListener({
        message: (message) => {
          onReceiveNotification(message);
        },
      });

      return () => {
        pubnub.unsubscribeAll();
      };
    }
  }, [userInfo]);

  return (
    <Flex
      px={{ base: 4, md: 4 }}
      height="20"
      pos="fixed"
      top="0"
      left="0"
      style={{ zIndex: 1000 }}
      width="100vw"
      alignItems="center"
      bg={useColorModeValue('white', 'gray.900')}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
      justifyContent="space-between"
    >
      <Menu>
        {/* Button chính là toàn bộ Flex */}
        <MenuButton as={Box} _hover={{ cursor: 'pointer' }} pr={10}>
          <Flex align="center" position="relative">
            <IconButton
              aria-label="Toggle Sidebar"
              icon={<FiMenu fontSize="20" color="#319795" />}
              variant="outline"
              onClick={(e) => {
                e.stopPropagation(); // để menu không mở khi click vào menu icon
                dispatch(toggleSidebar());
              }}
            />

            <Avatar ml={4} size="xs" bg="gray.500" src={user.avatarUrl} />

            <VStack
              display={{ base: 'none', md: 'flex' }}
              alignItems="flex-start"
              spacing="1px"
              ml="2"
            >
              <Text fontSize="sm">{user.email}</Text>
            </VStack>

            {/* Arrow drop */}
            <Box
              display={{ base: 'none', md: 'flex' }}
              position="absolute"
              left="235px"
              mt="0.5"
            >
              <MdArrowDropDown size={24} />
            </Box>
          </Flex>
        </MenuButton>

        {/* MENU DROPDOWN */}
        <MenuList
          w="260px"
          p="0"
          border="1px solid #A8A8A8"
          borderRadius="8px"
          boxShadow="0px 4px 4px rgba(0, 0, 0, 0.25)"
          overflow="hidden"
        >
          {/* HEADER */}
          <Flex
            justify="space-between"
            align="center"
            px="16px"
            py="12px"
            borderBottom="1px solid #E5E5E5"
          >
            <Text fontWeight="600" fontSize="15px">
              Switch dashboard context
            </Text>

            <MdClose size={20} cursor="pointer" />
          </Flex>

          {/* USERS LIST */}
          <Box py="6px">
            {['username', 'username', 'username', 'username', 'username'].map(
              (name, idx) => (
                <Flex
                  key={idx}
                  align="center"
                  px="16px"
                  py="8px"
                  cursor="pointer"
                  _hover={{ bg: '#F7F7F7' }}
                >
                  {idx === 0 ? (
                    <Box color="teal.500" fontSize="18px" mr="8px">
                      ✓
                    </Box>
                  ) : (
                    <Box w="18px" mr="8px" />
                  )}

                  <MdPerson size={20} />
                  <Text ml="10px" fontSize="15px">
                    {name}
                  </Text>
                </Flex>
              )
            )}
          </Box>

          {/* WORKSPACE BUTTONS */}
          <Box px="16px" pb="12px" mt="4px">
            {/* Manage workspaces */}
            <Flex
              align="center"
              border="1px solid #D0D0D0"
              borderRadius="10px"
              px="12px"
              py="10px"
              mb="10px"
              cursor="pointer"
              _hover={{ bg: '#F7F7F7' }}
            >
              <MdWorkspaces size={20} />
              <Text ml="10px" fontSize="15px" fontWeight="500">
                Manage workspaces
              </Text>
            </Flex>

            {/* Create workspace */}
            <Flex
              align="center"
              border="1px solid #D0D0D0"
              borderRadius="10px"
              px="12px"
              py="10px"
              cursor="pointer"
              _hover={{ bg: '#F7F7F7' }}
            >
              <MdAdd size={20} />
              <Text ml="10px" fontSize="15px" fontWeight="500">
                Create workspace
              </Text>
            </Flex>
          </Box>
        </MenuList>
      </Menu>

      <HStack spacing={{ base: '0', md: '6' }}>
        <NotificationMenu />

        <Flex alignItems="center" mr={8}>
          <Menu>
            <MenuButton py={2} transition="all 0.3s">
              <HStack>
                <Avatar size="sm" bg="gray.500" src={user.avatarUrl} />
              </HStack>
            </MenuButton>
            <MenuList
              bg={useColorModeValue('white', 'gray.900')}
              borderColor={useColorModeValue('gray.200', 'gray.700')}
            >
              <MenuItem onClick={() => router.push('/profile')}>
                Profile
              </MenuItem>
              <MenuItem>Settings</MenuItem>
              <MenuDivider />
              <MenuItem
                onClick={() => {
                  router.push('/');
                  removeAuthToken();
                }}
              >
                Sign out
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  );
};

export default Navbar;

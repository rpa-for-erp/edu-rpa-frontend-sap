import {
  toggleSidebar,
  setCurrentWorkspace,
  clearCurrentWorkspace,
  setWorkspaces,
} from '@/redux/slice/homeSlice';
import { homeSelector } from '@/redux/selector';
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
import { FiMenu } from 'react-icons/fi';
import { MdArrowDropDown, MdOutlinePerson } from 'react-icons/md';
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
  MdMail,
} from 'react-icons/md';
import { GrAnalytics } from 'react-icons/gr';
import { COLORS } from '@/constants/colors';
import workspaceApi from '@/apis/workspaceApi';
import { Workspace } from '@/interfaces/workspace';
import { RiArrowGoBackFill } from 'react-icons/ri';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import { useTranslation } from 'next-i18next';

const privateNotiChannelPrefix = 'notification.';

const Navbar = () => {
  const router = useRouter();
  const { t } = useTranslation('navbar');
  const dispatch = useDispatch();
  const pubnub = usePubNub();
  const toast = useToast();
  const user = useSelector(userSelector);
  const { currentWorkspaceId, workspaces } = useSelector(homeSelector);

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
          dispatch(setUser(userData));
        } catch (error) {
          console.error('Failed to fetch user data', error);
        }
      };
      fetchUserData();

      const fetchWorkspaces = async () => {
        try {
          const workspacesData = await workspaceApi.getAllWorkspaces();
          dispatch(setWorkspaces(workspacesData));
        } catch (error) {
          console.error('Failed to fetch workspaces', error);
          // Don't show toast error, just log it
          dispatch(setWorkspaces([]));
        }
      };
      fetchWorkspaces();
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
      right="0"
      style={{ zIndex: 1000 }}
      alignItems="center"
      bg={useColorModeValue('white', 'gray.900')}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
      justifyContent="space-between"
    >
      <Flex align="center" gap={2}>
        {/* Toggle Sidebar Button - Tách riêng */}
        <IconButton
          aria-label="Toggle Sidebar"
          icon={<FiMenu fontSize="20" color={COLORS.primary} />}
          variant="outline"
          onClick={() => dispatch(toggleSidebar())}
        />

        {/* Workspace Switcher Menu */}
        <Menu strategy="fixed">
          {({ onClose }) => (
            <>
              <MenuButton as={Box} _hover={{ cursor: 'pointer' }}>
                <Flex align="center" position="relative">
                  <Avatar
                    ml={2}
                    size="xs"
                    bg="gray.500"
                    src={user.avatarUrl}
                    icon={currentWorkspaceId ? <MdWorkspaces /> : <MdPerson />}
                  />

                  <VStack
                    display={{ base: 'none', md: 'flex' }}
                    alignItems="flex-start"
                    spacing="1px"
                    ml="2"
                  >
                    <Text fontSize="sm">
                      {currentWorkspaceId
                        ? workspaces.find((w) => w.id === currentWorkspaceId)
                            ?.name || 'Workspace'
                        : user.name || user.email}
                    </Text>
                  </VStack>

                  {/* Arrow drop */}
                  <Box display={{ base: 'none', md: 'flex' }}>
                    <MdArrowDropDown size={24} />
                  </Box>
                </Flex>
              </MenuButton>

              {/* MENU DROPDOWN */}
              <MenuList
                w="320px"
                p={0}
                pl={2}
                border={`1px solid ${COLORS.borderDark}`}
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
                  borderBottom={`1px solid ${COLORS.borderDivider}`}
                >
                  <Text fontWeight="600" fontSize="15px">
                    {t('switchDashboardContext')}
                  </Text>
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    _hover={{
                      cursor: 'pointer',
                      backgroundColor: COLORS.bgGray,
                    }}
                  >
                    <MdClose size={20} cursor="pointer" />
                  </Box>
                </Flex>

                {/* Workspace*/}
                <Box py="6px">
                  {/* Current User */}
                  <Flex
                    align="center"
                    px="16px"
                    py="8px"
                    cursor="pointer"
                    _hover={{ bg: COLORS.bgGray }}
                    onClick={() => {
                      dispatch(clearCurrentWorkspace());
                      router.push('/home');
                    }}
                  >
                    {currentWorkspaceId === null ? (
                      <Box color="teal.500" fontSize="18px" mr="8px">
                        ✓
                      </Box>
                    ) : (
                      <Box color="rgba(0, 0, 0, 0.0)" fontSize="18px" mr="8px">
                        ✓
                      </Box>
                    )}
                    <MdPerson size={20} />
                    <Text ml="10px" fontSize="15px">
                      {user.name || user.email}
                    </Text>
                  </Flex>

                  {/* Workspaces List */}
                  {Array.isArray(workspaces) &&
                    workspaces.map((workspace) => (
                      <Flex
                        key={workspace.id}
                        align="center"
                        px="16px"
                        py="8px"
                        cursor="pointer"
                        _hover={{ bg: COLORS.bgGray }}
                        onClick={() => {
                          dispatch(setCurrentWorkspace(workspace.id));
                          router.push(`/workspace/${workspace.id}`);
                        }}
                      >
                        {currentWorkspaceId === workspace.id ? (
                          <Box color="teal.500" fontSize="18px" mr="8px">
                            ✓
                          </Box>
                        ) : (
                          <Box
                            color="rgba(0, 0, 0, 0.0)"
                            fontSize="18px"
                            mr="8px"
                          >
                            ✓
                          </Box>
                        )}
                        <MdWorkspaces size={20} />
                        <Text ml="10px" fontSize="15px">
                          {workspace.name}
                        </Text>
                      </Flex>
                    ))}
                </Box>

                {/* WORKSPACE BUTTONS */}
                <Box px="16px" pb="12px" mt="4px">
                  {/* Manage workspaces */}
                  <Flex
                    justify="center"
                    align="center"
                    border={`1px solid ${COLORS.borderGray}`}
                    borderRadius="10px"
                    px="12px"
                    py="4px"
                    mb="10px"
                    cursor="pointer"
                    _hover={{ bg: COLORS.bgGray }}
                    onClick={() => router.push('/workspace')}
                  >
                    <MdWorkspaces size={20} />
                    <Text ml="10px" fontSize="14px" fontWeight="500">
                      {t('manageWorkspaces')}
                    </Text>
                  </Flex>

                  {/* Create workspace */}
                  <Flex
                    justify="center"
                    align="center"
                    border={`1px solid ${COLORS.borderGray}`}
                    borderRadius="10px"
                    px="12px"
                    py="5px"
                    cursor="pointer"
                    _hover={{ bg: COLORS.bgGray }}
                    onClick={() => router.push('/workspace/create')}
                  >
                    <MdAdd size={20} />
                    <Text ml="10px" fontSize="14px" fontWeight="500">
                      {t('createWorkspace')}
                    </Text>
                  </Flex>
                </Box>
              </MenuList>
            </>
          )}
        </Menu>
      </Flex>

      <HStack spacing={{ base: '0', md: '6' }}>
        <LanguageSwitcher />
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
              <MenuDivider />

              <MenuItem onClick={() => router.push('/profile')}>
                <Flex
                  align="center"
                  justify="center"
                  onClick={() => router.push('/invitation')}
                >
                  <MdOutlinePerson size={20} />
                  <Text ml="10px">{t('profile')}</Text>
                </Flex>
              </MenuItem>
              {/* Invitations */}
              <MenuItem onClick={() => router.push('/invitation')}>
                <Flex
                  align="center"
                  justify="center"
                  onClick={() => router.push('/invitation')}
                >
                  <MdMail size={20} />
                  <Text ml="10px">{t('invitations')}</Text>
                </Flex>
              </MenuItem>
              <MenuDivider />
              <MenuItem
                onClick={() => {
                  router.push('/');
                  removeAuthToken();
                }}
              >
                <Flex align="center" justify="center">
                  <MdMail size={20} />
                  <Text ml="10px">{t('signOut')}</Text>
                </Flex>
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  );
};

export default Navbar;

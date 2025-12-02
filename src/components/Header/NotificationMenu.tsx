import {
  Menu,
  MenuButton,
  Avatar,
  AvatarBadge,
  MenuList,
  MenuItem,
  Button,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  Box,
} from '@chakra-ui/react';
import { NotificationType, Notification } from '@/interfaces/notification';
import { FiAlertCircle } from 'react-icons/fi';
import { FaShareSquare, FaPlay } from 'react-icons/fa';
import { GrIntegration } from 'react-icons/gr';
import { BsFillLightningFill } from 'react-icons/bs';
import { useEffect, useState } from 'react';
import { MdNotifications } from 'react-icons/md';

import { useRouter } from 'next/router';
import {
  fetchMoreNotifications,
  markAsRead,
} from '@/redux/slice/notificationSlice';
import { useDispatch, useSelector } from 'react-redux';
import { notificationSelector } from '@/redux/selector';

const NotificationMenu = () => {
  const [selectedNotification, setSelectedNotification] =
    useState<Notification>({
      id: 0,
      title: '',
      content: '',
      isRead: false,
      type: NotificationType.ROBOT_EXECUTION,
      createdAt: new Date(),
    });
  const dispatch = useDispatch();
  const { notifications, countUnread, hasMore, curPage, isLoading } =
    useSelector(notificationSelector);
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const readNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    onOpen();
    if (!notification.isRead) {
      dispatch(markAsRead(notification.id) as any);
    }
  };

  const handleActionOfNoti = () => {
    onClose();
    switch (selectedNotification.type) {
      case NotificationType.ROBOT_EXECUTION:
      case NotificationType.ROBOT_TRIGGER:
        router.push('/robot');
        break;
      case NotificationType.PROCESS_SHARED:
        router.push('/studio');
        break;
      case NotificationType.CONNECTION_CHECK:
        router.push('/integration-service');
        break;
      default:
        break;
    }
  };

  const mapNotificationTypeToIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ROBOT_EXECUTION:
        return FaPlay;
      case NotificationType.ROBOT_TRIGGER:
        return BsFillLightningFill;
      case NotificationType.PROCESS_SHARED:
        return FaShareSquare;
      case NotificationType.CONNECTION_CHECK:
        return GrIntegration;
      default:
        return FiAlertCircle;
    }
  };

  return (
    <Box>
      <Menu>
        <MenuButton
          position="relative"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box position="relative" cursor="pointer">
            {/* Icon chuông */}
            <MdNotifications size={26} />

            {/* Badge số lượng chưa đọc */}
            {countUnread > 0 && (
              <Box
                position="absolute"
                top="-4px"
                right="-4px"
                bg="red.500"
                color="white"
                fontSize="10px"
                minW="18px"
                h="18px"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontWeight="bold"
              >
                {countUnread}
              </Box>
            )}
          </Box>
        </MenuButton>
        <MenuList
          style={{ width: '300px', maxHeight: '300px', overflowY: 'scroll' }}
        >
          {notifications.length === 0 && (
            <Text className="mt-5 mb-5" textAlign="center">
              No notifications
            </Text>
          )}
          {notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => readNotification(notification)}
            >
              <Icon
                as={mapNotificationTypeToIcon(notification.type)}
                color={notification.isRead ? 'gray.400' : 'blue.500'}
                mr={2}
              />
              <div className="flex flex-col w-100">
                {!notification.isRead ? (
                  <b>
                    {notification.title.length > 30
                      ? notification.title.slice(0, 27) + '...'
                      : notification.title}
                  </b>
                ) : notification.title.length > 30 ? (
                  notification.title.slice(0, 27) + '...'
                ) : (
                  notification.title
                )}
                <p>{notification.createdAt.toLocaleString()}</p>
              </div>
            </MenuItem>
          ))}
          {hasMore && (
            <Button
              style={{ width: '100%', marginTop: '10px' }}
              onClick={() =>
                dispatch(fetchMoreNotifications(curPage + 1) as any)
              }
              isLoading={isLoading}
            >
              Load more
            </Button>
          )}
        </MenuList>
      </Menu>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Notification detail</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Title: <b>{selectedNotification.title}</b>
            <br />
            Type: {NotificationType[selectedNotification.type]}
            <br />
            Content: {selectedNotification.content}
            <br />
            Created at: {selectedNotification.createdAt.toLocaleString()}
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="teal"
              className="mr-3"
              onClick={handleActionOfNoti}
            >
              Go to{' '}
              {NotificationType[selectedNotification.type]
                .split('_')[0]
                .toLowerCase()}
            </Button>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default NotificationMenu;

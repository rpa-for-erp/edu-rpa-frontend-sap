import IconImage from "@/components/IconImage/IconImage";
import { AuthorizationProvider } from "@/interfaces/enums/provider.enum";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import React from "react";
import { providerData } from "@/constants/providerData";
import { userSelector } from "@/redux/selector";
import { useSelector } from "react-redux";
import CreateMoodleConnectionModal from "./CreateMoodleConnectionModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  workspaceId?: string;
}

const CreateNewConnectionModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, workspaceId }) => {
  const user = useSelector(userSelector);
  const {
    isOpen: isMoodleModalOpen,
    onOpen: onMoodleModalOpen,
    onClose: onMoodleModalClose,
  } = useDisclosure();

  const handleCreateNewConnection = (provider: typeof providerData[0]) => {
    if (provider.name === AuthorizationProvider.MOODLE) {
      onClose();
      onMoodleModalOpen();
    } else {
      if (workspaceId) {
        // Workspace OAuth flow - use workspace-specific endpoints
        window.open(
          `${process.env.NEXT_PUBLIC_DEV_API}/auth/workspace/${workspaceId}/${provider.slug}?fromUser=${user.id}&reconnect=false`,
          "_self"
        );
      } else {
        // User OAuth flow - keep original behavior
        window.open(
          `${process.env.NEXT_PUBLIC_DEV_API}/auth/${provider.slug}?fromUser=${user.id}`,
          "_self"
        );
      }
    }
  };

  const handleMoodleSuccess = () => {
    onMoodleModalClose();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create new connection</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <div className="grid grid-cols-3 gap-[15px]">
              {providerData.map((provider) => (
                <div
                  key={provider.name}
                  className="flex flex-col items-center justify-center"
                >
                  <IconImage
                    icon={provider.icon}
                    label={provider.name}
                    onClick={() => handleCreateNewConnection(provider)}
                  />
                </div>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Moodle Connection Modal */}
      <CreateMoodleConnectionModal
        isOpen={isMoodleModalOpen}
        onClose={onMoodleModalClose}
        onSuccess={handleMoodleSuccess}
        workspaceId={workspaceId}
      />
    </>
  );
};

export default CreateNewConnectionModal;

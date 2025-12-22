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
}

const CreateNewConnectionModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const user = useSelector(userSelector);
  const {
    isOpen: isMoodleModalOpen,
    onOpen: onMoodleModalOpen,
    onClose: onMoodleModalClose,
  } = useDisclosure();

  const handleCreateNewConnection = (provider: typeof providerData[0]) => {
    // If it's Moodle, open the custom modal
    if (provider.name === AuthorizationProvider.MOODLE) {
      onClose(); // Close the provider selection modal
      onMoodleModalOpen(); // Open Moodle connection modal
    } else {
      // For OAuth providers (Google, etc.), use the existing flow
      window.open(
        `${process.env.NEXT_PUBLIC_DEV_API}/auth/${provider.slug}?fromUser=${user.id}`,
        "_self"
      );
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
      />
    </>
  );
};

export default CreateNewConnectionModal;

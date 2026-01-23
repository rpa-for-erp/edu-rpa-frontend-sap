import { TriggerType } from "@/interfaces/robot";
import {
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormControl,
  FormLabel,
  Select,
  ModalFooter,
  Button,
  Input,
  useToast,
  Box,
  Progress,
  Step,
  StepIcon,
  StepIndicator,
  StepStatus,
  Stepper,
  StepNumber,
  Modal,
  ModalOverlay,
  Container,
  Heading,
} from "@chakra-ui/react";
import { useEffect, useState, useRef } from "react";
import { toastSuccess } from "@/utils/common";
import { useRouter } from "next/router";
import robotApi from "@/apis/robotApi";
import workspaceApi from "@/apis/workspaceApi";
import { BpmnParseError, BpmnParseErrorCode } from "@/utils/bpmn-parser/error";
import { dryrun, handleCheckDryrunError } from "@/apis/robotCodeValidateApi";
import {
  RobotCreationError,
  UserCredentialError,
  ValidationError,
} from "@/apis/ErrorMessage";
import RobotExecutionComponent from "./DisplayError/DisplayValidationError";
import connectionApi from "@/apis/connectionApi";
import { AxiosError } from "axios";
import ConnectionTable from "@/components/Connection/ConnectionTable";
import _ from "lodash";

interface Props {
  processID: string;
  genRobotCode: any;
  onSaveAll: any;
  onClose: () => void;
}

const delay = async (delay) => {
  await new Promise((resolve) => setTimeout(resolve, delay));
};

const steps = [
  { description: "Validate..." },
  { description: "Check Connection ..." },
  { description: "Publishing ..." },
];

export const PublishRobotModal = (props: Props) => {
  const [robotName, setRobotName] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>(
    TriggerType.MANUAL
  );
  const toast = useToast();
  const router = useRouter();
  const [isOpenErrorDetail, setIsOpenErrorDetail] = useState(false);
  const onClose = () => setIsOpenErrorDetail(false);

  // Track if we're currently executing a step to prevent duplicate calls
  const isExecutingRef = useRef(false);

  const [result, setResult] = useState<{
    code: any;
    credentials: string[];
  }>(() => {
    const result = props.genRobotCode(props.processID);
    if (!result?.code || !result.credentials) {
      throw new BpmnParseError(BpmnParseErrorCode["Unknown"], "");
    }
    return result;
  });

  const [activeStep, setActiveStep] = useState(0); // Initialize active step to 0
  const [loading, setLoading] = useState(false); // State to track loading status of API call
  const [publishClicked, setPublishClicked] = useState(false); // State to track whether publish button is clicked
  const activeStepText = steps[activeStep]?.description ?? "Done !!!";
  const [error, setError] = useState(null); // State to track errors

  // Handler for publish button click
  const handlePublishClick = (option: boolean = true) => {
    setPublishClicked(option);
    setActiveStep(0);
    setError(null);
    isExecutingRef.current = false;
  };

  // Function to simulate API call for the current step
  const simulateAPICallForCurrentStep = async () => {
    if (isExecutingRef.current) {
      return;
    }

    isExecutingRef.current = true;
    setLoading(true);

    try {
      switch (activeStep) {
        case 0:
          break;

        case 1:
          let connections = await connectionApi.getConnectionsByConnectionKey(
            result.credentials.map((k: any) => k.connectionKey)
          );

          let nonMoodleConnections = connections.filter(
            (conn) => conn.provider !== 'Moodle'
          );

          let refreshConnectionPromises = nonMoodleConnections.map(async (conn) => {
            try {
              await connectionApi.refreshConnection(conn.provider, conn.name);
              return true;
            } catch (error) {
              return false;
            }
          });

          let connectionExpiredMask = await Promise.all(
            refreshConnectionPromises
          );

          let expiredConnections = nonMoodleConnections.filter(
            (conn, index) => !connectionExpiredMask[index]
          );

          if (expiredConnections.length) {
            throw new UserCredentialError(
              "Connection expired",
              expiredConnections
            );
          }
          break;

        case 2:
          try {
            const publishPayload = {
              name: robotName,
              processId: props.processID as string,
              code: JSON.stringify(result?.code),
              providers: result.credentials,
              triggerType: triggerType,
            };
            
            // Check if we're in workspace context
            const workspaceId = router.query.workspaceId as string;
            
            if (workspaceId) {
              // Publish to WORKSPACE
              await workspaceApi.createWorkspaceRobot(workspaceId, publishPayload);
              toastSuccess(toast, "Robot published to workspace successfully!");
              
              // Redirect to workspace robot page
              router.push(`/workspace/${workspaceId}/robot`);
            } else {
              // Publish to USER (old behavior)
              await robotApi.createRobot(publishPayload);
              toastSuccess(toast, "Create robot successfully!");
              
              // Redirect to user robot page
              router.push("/robot");
            }
          } catch (error) {
            throw new RobotCreationError(error.message, error.response);
          }
          break;

        default:
          break;
      }

      setActiveStep((prevStep) => prevStep + 1);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
      isExecutingRef.current = false;
    }
  };

  // Calculate progress percentage
  const max = steps.length - 1;
  const progressPercent = (activeStep / max) * 100;

  useEffect(() => {
    if (publishClicked && activeStep < steps.length) {
      simulateAPICallForCurrentStep();
    }
  }, [publishClicked, activeStep]);

  const handleDisplayError = (error: Error) => {
    if (error instanceof ValidationError) {
      const txt = JSON.stringify(error.errorResponse, null, 2);
      return (
        <RobotExecutionComponent
          data={error.errorResponse}
        ></RobotExecutionComponent>
      );
    } else if (error instanceof RobotCreationError) {
      return (
        <Box mt={4} p={4} bg="red.100" borderRadius="md">
          <Heading as="h2" size="md">
            Error Details:
          </Heading>
          <p>
            <strong>Status:</strong> {error.errorResponse.status}
          </p>
          <p>
            <strong>Error:</strong> {error.errorResponse.data.error}
          </p>
          <p>
            <strong>Message:</strong>{" "}
            {Array.isArray(error?.errorResponse?.data?.message)
              ? error.errorResponse.data.message.join(", ")
              : error?.errorResponse?.data?.message}
          </p>
        </Box>
      );
    } else if (error instanceof UserCredentialError) {
      const tableProps = {
        header: [
          "Service",
          "Connection name",
          "Created at",
          "Status",
          "Action",
        ],
        data: _.map(error.expiredConnectionList, (conn) =>
          _.omit(conn, ["connectionKey", "refreshToken", "accessToken"])
        ),
      };
      return <ConnectionTable {...tableProps}></ConnectionTable>;
    } else if (error instanceof AxiosError) {
      <Box mt={4} p={4} bg="red.100" borderRadius="md">
        <Heading as="h2" size="md">
          Error Details:
        </Heading>
        <p>
          <strong>Status:</strong> {error.status}
        </p>
        <p>
          <strong>Error:</strong> {error.response.data.error}
        </p>
        <p>
          <strong>Message:</strong>{" "}
          {error.response.data
            ? "Unknown Error"
            : error.response.data.message.join(", ")}
        </p>
      </Box>;
    }
  };
  return (
    <ModalContent>
      <ModalHeader>Publish Robot</ModalHeader>
      <ModalCloseButton />
      <ModalBody pb={6}>
        <FormControl>
          <FormLabel>Robot name</FormLabel>
          <Input
            value={robotName}
            placeholder="Your robot name"
            onChange={(e) => setRobotName(e.target.value)}
          />
        </FormControl>

        <FormControl mt={4}>
          <FormLabel>Process ID</FormLabel>
          <Input
            placeholder="Process ID"
            disabled={true}
            backgroundColor="gray.200"
            value={props.processID}
          />
        </FormControl>

        <FormControl mt={4}>
          <FormLabel>Trigger type</FormLabel>
          <Select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value as TriggerType)}
          >
            <option value={TriggerType.MANUAL}>Manual</option>
            <option value={TriggerType.SCHEDULE}>Schedule</option>
            <option value={TriggerType.EVENT_GMAIL}>New emails (Gmail)</option>
            <option value={TriggerType.EVENT_DRIVE}>
              New files (Google Drive)
            </option>
            <option value={TriggerType.EVENT_FORMS}>
              New forms (Google Forms)
            </option>
          </Select>
        </FormControl>

        {publishClicked && ( // Render progress and stepper only if publish button is clicked
          <Box position="relative">
            <Stepper
              size="sm"
              colorScheme={error ? "red" : "green"}
              index={activeStep}
              gap="0"
            >
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepIndicator bg="white">
                    {index === activeStep ? (
                      error ? ( // Display error message if error occurred
                        <StepStatus complete={<StepIcon />} />
                      ) : (
                        <StepStatus complete={<StepIcon />} />
                      )
                    ) : (
                      <StepNumber />
                    )}
                  </StepIndicator>
                </Step>
              ))}
            </Stepper>
            {error ? (
              <div>
                <b style={{ color: "red", display: "block" }}>
                  Error: {error.message}
                </b>
                <Button
                  size="sm"
                  style={{ display: "block" }}
                  onClick={() => setIsOpenErrorDetail(true)}
                >
                  Show Detail
                </Button>
                <Modal
                  isOpen={isOpenErrorDetail}
                  onClose={onClose}
                  size={activeStep == 0 ? "full" : "xl"}
                >
                  <ModalOverlay />
                  <ModalContent>
                    <ModalCloseButton />
                    <ModalBody>{handleDisplayError(error)}</ModalBody>

                    <ModalFooter>
                      <Button colorScheme="blue" mr={3} onClick={onClose}>
                        Close
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
              </div>
            ) : (
              <div style={{ color: "red" }}>
                Step {activeStep + 1}: <b>{activeStepText}</b>
              </div>
            )}
            <Progress
              value={(activeStep / (steps.length - 1)) * 100}
              position="absolute"
              height="3px"
              width="full"
              top="10px"
              zIndex={-1}
            />
          </Box>
        )}
      </ModalBody>

      <ModalFooter>
        <Button
          mr={3}
          colorScheme="teal"
          variant="outline"
          onClick={props.onClose}
        >
          Cancel
        </Button>
        {!publishClicked ? (
          <Button colorScheme="teal" onClick={(e) => handlePublishClick()}>
            Publish
          </Button>
        ) : (
          <Button colorScheme="teal" onClick={() => handlePublishClick(false)}>
            Run again
          </Button>
        )}
      </ModalFooter>
    </ModalContent>
  );
};

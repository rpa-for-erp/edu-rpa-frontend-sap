import { ActivityPackages } from "@/constants/activityPackage";
import { Activity } from "@/types/activity";
import { setLocalStorageObject } from "@/utils/localStorageService";
import {
  getActivityInProcess,
  getProcessFromLocalStorage,
  updateActivityInProcess,
  updateLocalStorage,
} from "@/utils/processService";
import {
  Button,
  Input,
  FormControl,
  FormLabel,
  Select,
  Switch,
  Tooltip,
  Box,
  Text,
  VStack,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import CustomDatePicker from "@/components/CustomDatePicker/ CustomDatePicker";
import { LocalStorage } from "@/constants/localStorage";
import { ArgumentProps, PropertiesProps } from "@/types/property";
import { getVariableItemFromLocalStorage } from "@/utils/variableService";
import TextAutoComplete from "@/components/Input/AutoComplete/TextAutoComplete";
import {
  getArgumentsByActivity,
  getLibrary,
  getPackageIcon,
  getServiceIcon,
} from "@/utils/propertyService";
import { usePropertiesSidebar } from "@/hooks/usePropertiesSidebar";
import IconImage from "@/components/IconImage/IconImage";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { isSavedChange } from "@/redux/slice/bpmnSlice";
import { Variable } from "@/types/variable";
import { AuthorizationProvider } from "@/interfaces/enums/provider.enum";
import ConnectionOptions from "../PropertiesSideBar/ConnectionSelect";
import ConditionList from "../PropertiesSideBar/Condition/ConditionList";
import { dispatchPropertiesUpdated } from "@/hooks/useVariableUsage";

interface PropertiesPanelProps {
  processID: string;
  activityItem?: Activity;
  isOpen: boolean;
  onClose: () => void;
  modelerRef?: any;
}

interface FormProperties {
  keywordArg: string | null;
  value: any;
}

interface FormValues {
  [key: string]: FormProperties;
}

export default function PropertiesPanel({
  processID,
  activityItem,
  isOpen,
  onClose,
  modelerRef,
}: PropertiesPanelProps) {
  const {
    sideBarState,
    setPackage,
    getTitleStep,
    setActivity,
    setBack,
    setDefault,
    setProperty,
  } = usePropertiesSidebar();
  const [formValues, setFormValues] = useState<FormValues>({});
  const [saveResult, setSaveResult] = useState<string | null>(null);
  const [isExist, setIsExist] = useState(false);
  const datePickerRef = useRef(null);
  const currentVariableStorage = getVariableItemFromLocalStorage(processID);
  const variableStorage = currentVariableStorage?.variables.map(
    (variable: Variable) => [variable.name, variable.type]
  );

  const [activityKeyword, setActivityKeyword] = useState<string>("");
  const [editableName, setEditableName] = useState<string>("");

  const dispatch = useDispatch();

  // Update editable name when activity item changes
  useEffect(() => {
    if (activityItem) {
      setEditableName(activityItem.activityName || "");
    }
  }, [activityItem]);

  const handleReset = () => {
    setDefault();
    setFormValues({});
    setSaveResult(null);
    setIsExist(false);
    setActivityKeyword("");
  };

  const handleActivities = (activity: any) => {
    setProperty(activity.properties);
    setFormValues(activity.properties.arguments || {});
    setSaveResult(activity.properties.return || null);
    // Also restore the keyword from saved activity
    if (activity.keyword) {
      setActivityKeyword(activity.keyword);
    }
    setIsExist(true);
  };

  const activity = activityItem
    ? getActivityInProcess(processID, activityItem.activityID)
    : null;

  useEffect(() => {
    console.log("PropertiesPanel - activityItem:", activityItem);
    console.log("PropertiesPanel - activity from storage:", activity);

    if (!activity) {
      // New element, no properties yet - reset to step 1
      handleReset();
      return;
    }

    const hasProperties = Object.keys(activity.properties).length > 0;
    if (!hasProperties) {
      handleReset();
    } else {
      handleActivities(activity);
    }
  }, [isOpen, activityItem]);

  const handleGoBack = () => {
    // Clear properties in storage when going back
    // This ensures old data doesn't persist when selecting a different activity
    if (activityItem) {
      const existingActivity = getActivityInProcess(
        processID,
        activityItem.activityID
      );

      // Determine what to clear based on which step we're going back from
      const currentStep = sideBarState.currentStep;
      let clearedProperties = {};

      if (currentStep === 3) {
        // Going back from step 3 to step 2: clear activityName and arguments
        clearedProperties = {
          activityPackage: sideBarState.packageName,
          activityName: "",
          library: "",
          arguments: {},
          return: null,
        };
      } else if (currentStep === 2) {
        // Going back from step 2 to step 1: clear everything
        clearedProperties = {
          activityPackage: "",
          activityName: "",
          library: "",
          arguments: {},
          return: null,
        };
      }

      const updatePayload = {
        ...existingActivity,
        activityID: activityItem.activityID,
        keyword: "",
        properties: clearedProperties,
      };

      console.log("[PropertiesPanel] Going back - clearing properties:", {
        activityID: activityItem.activityID,
        fromStep: currentStep,
        toStep: currentStep - 1,
      });

      const updateProperties = updateActivityInProcess(
        processID,
        updatePayload
      );
      const updateProcess = updateLocalStorage({
        ...getProcessFromLocalStorage(processID),
        activities: updateProperties,
      });

      setLocalStorageObject(LocalStorage.PROCESS_LIST, updateProcess);
    }

    // Reset local state
    setBack();
    setFormValues({});
    setSaveResult(null);
    setActivityKeyword("");
  };

  const handleInputChange = (key: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: { ...prev[key], value: value },
    }));
    dispatch(isSavedChange(false));
  };

  const handleUpdateProperties = () => {
    if (sideBarState.currentStep < 3 || !activityItem) return;

    const existingActivity = getActivityInProcess(
      processID,
      activityItem.activityID
    );

    const updatePayload = {
      ...existingActivity,
      activityID: activityItem.activityID,
      keyword: activityKeyword,
      properties: {
        activityPackage: sideBarState.packageName,
        activityName: sideBarState.activityName,
        library: getLibrary(sideBarState.packageName),
        arguments: formValues,
        return: saveResult,
      },
    };

    console.log("[PropertiesPanel] Updating properties:", {
      activityID: activityItem.activityID,
      keyword: activityKeyword,
      packageName: sideBarState.packageName,
      activityName: sideBarState.activityName,
    });

    const updateProperties = updateActivityInProcess(processID, updatePayload);
    const updateProcess = updateLocalStorage({
      ...getProcessFromLocalStorage(processID),
      activities: updateProperties,
    });

    setLocalStorageObject(LocalStorage.PROCESS_LIST, updateProcess);
    
    // Dispatch event to notify VariablesPanel about property changes
    dispatchPropertiesUpdated(processID);
  };

  useEffect(() => {
    handleUpdateProperties();
  }, [
    formValues,
    saveResult,
    activityKeyword,
    sideBarState.packageName,
    sideBarState.activityName,
  ]);

  const handleKeywordRobotFramework = (varName: string, varType: string) => {
    let prefix = "${";
    let suffix = "}";
    if (varType === "list") {
      prefix = "@{";
    }
    if (varType === "dictionary") {
      prefix = "&{";
    }
    return `${prefix}${varName}${suffix}`;
  };

  // Update activity keyword when activity changes
  useEffect(() => {
    if (activityItem && sideBarState.activityName) {
      console.log('🔍 Looking for keyword for activity:', sideBarState.activityName);
      ActivityPackages.forEach((activityPackage) => {
        const activityInfo = getArgumentsByActivity(
          activityPackage.activityTemplates,
          sideBarState.activityName
        );
        if (activityInfo?.[0]?.keyword) {
          console.log('✅ Found keyword:', activityInfo[0].keyword);
          setActivityKeyword(activityInfo[0].keyword);
        }
      });
    }
  }, [sideBarState.activityName]);

  console.log("PropertiesPanel RENDER - activityItem:", activityItem);
  console.log("PropertiesPanel RENDER - isOpen:", isOpen);

  if (!activityItem) {
    console.warn("PropertiesPanel: NO activityItem - showing placeholder");
    return (
      <Box p={4}>
        <Text color="gray.500" fontSize="sm" mb={2}>
          Select an element to view properties
        </Text>
        <Text color="orange.500" fontSize="xs">
          Debug: activityItem is {String(activityItem)}
        </Text>
      </Box>
    );
  }

  console.log("PropertiesPanel: Rendering with activityItem:", {
    id: activityItem.activityID,
    name: activityItem.activityName,
    type: activityItem.activityType,
  });

  return (
    <Box p={4} overflow="auto" height="100%" className="custom-scrollbar">
      <VStack spacing={4} align="stretch">
        {/* Debug Info */}
        <Box bg="blue.50" p={2} borderRadius="md" fontSize="sm">
          <Text fontWeight="bold" color="blue.700">
            Information:
          </Text>
          <Text color="blue.600">ID: {activityItem.activityID || "N/A"}</Text>
          <Text color="blue.600">
            Type: {activityItem.activityType || "N/A"}
          </Text>
          <Text color="blue.600">
            Name: {activityItem.activityName || "N/A"}
          </Text>
        </Box>

        {/* Basic Info - Always visible */}
        {/* <Box
          bg="gray.50"
          p={3}
          borderRadius="md"
          border="2px solid"
          borderColor="teal.200"
        >
          <VStack spacing={3} align="stretch">
            <Box>
              <Text fontWeight="bold" fontSize="sm" color="teal.600" mb={1}>
                Element Type
              </Text>
              <Text
                fontSize="sm"
                color="gray.700"
                bg="white"
                p={2}
                borderRadius="md"
              >
                {activityItem.activityType || "Unknown"}
              </Text>
            </Box>

            <Box>
              <Text fontWeight="bold" fontSize="sm" color="teal.600" mb={1}>
                Activity ID
              </Text>
              <Text
                fontSize="sm"
                color="gray.700"
                fontFamily="mono"
                bg="white"
                p={2}
                borderRadius="md"
              >
                {activityItem.activityID || "Unknown"}
              </Text>
            </Box>

            <Box>
              <Text fontWeight="bold" fontSize="sm" color="teal.600" mb={1}>
                Name
              </Text>
              <Input
                value={editableName}
                onChange={(e) => setEditableName(e.target.value)}
                onBlur={() => {
                  console.log("Name input blur - attempting update");
                  if (modelerRef?.bpmnModeler && activityItem?.activityID) {
                    try {
                      const modeling = modelerRef.bpmnModeler.get("modeling");
                      const elementRegistry =
                        modelerRef.bpmnModeler.get("elementRegistry");
                      const element = elementRegistry.get(
                        activityItem.activityID
                      );
                      if (element) {
                        modeling.updateLabel(element, editableName);
                        dispatch(isSavedChange(false));
                        console.log(
                          "✅ Label updated successfully to:",
                          editableName
                        );
                      } else {
                        console.error(
                          "❌ Element not found:",
                          activityItem.activityID
                        );
                      }
                    } catch (error) {
                      console.error("❌ Error updating label:", error);
                    }
                  } else {
                    console.warn(
                      "⚠️ Cannot update label - missing modelerRef or activityID"
                    );
                  }
                }}
                placeholder="Enter element name"
                size="sm"
                fontSize="sm"
                bg="white"
              />
            </Box>
          </VStack>
        </Box> */}

        {activityItem.activityType != "bpmn:Process" &&
          ActivityPackages.map((activityPackage) => {
            const { _id, displayName, activityTemplates, description } =
              activityPackage;
            const { currentStep, packageName, activityName } = sideBarState;

            const activityInfo = getArgumentsByActivity(
              activityTemplates,
              activityName
            );

            const renderStepOne = () => (
              <Tooltip label={description}>
                <Box my={4} display="flex" justifyContent="center">
                  <IconImage
                    icon={getPackageIcon(displayName) as any}
                    label={displayName}
                    onClick={() => setPackage(displayName)}
                  />
                </Box>
              </Tooltip>
            );

            const setDefaultValue = (
              paramKey: string,
              paramValue: ArgumentProps,
              value: any
            ) => {
              return {
                ...formValues[paramKey],
                keywordArg: paramValue.keywordArg || null,
                overrideType: paramValue.overrideType || null,
                value: value,
              };
            };

            const renderStepTwo = () => {
              return (
                displayName === packageName &&
                activityTemplates?.map((activity: any) => (
                  <Box key={activity.displayName}>
                    <Tooltip label={activity.description}>
                      <Button
                        my={2}
                        w="100%"
                        onClick={() => {
                          setActivity(activity.displayName);
                          dispatch(isSavedChange(false));
                        }}
                      >
                        {activity.displayName}
                      </Button>
                    </Tooltip>
                  </Box>
                ))
              );
            };

            const initDefaultValue = (type: string) => {
              const defaultValues: Record<string, any> = {
                string: "",
                email: "",
                list: "",
                boolean: false,
                date: new Date(),
                number: "",
                "connection.Google Drive": "",
                "connection.Gmail": "",
                "connection.Google Sheets": "",
                "connection.SAP Mock": "",
                "connection.Moodle": "",
                "enum.shareType": "user",
                "enum.permission": "reader",
                label_ids: "inbox",
                "expression.logic": "=",
              };

              return defaultValues[type] ?? null;
            };

            type OptionType = { value: string; label: string };

            const renderInput = (
              paramKey: string,
              type: string,
              additionalProps: Record<string, unknown> = {}
            ) => (
              <Input
                type={type}
                value={formValues[paramKey]?.value ?? ""}
                onChange={(e) => handleInputChange(paramKey, e.target.value)}
                size="sm"
                {...additionalProps}
              />
            );

            const renderSelect = (paramKey: string, options: OptionType[]) => (
              <Select
                defaultValue={formValues[paramKey]?.value ?? options[0].value}
                onChange={(e) => handleInputChange(paramKey, e.target.value)}
                size="sm"
              >
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            );

            const renderConnectionSelect = (
              paramKey: string,
              provider: AuthorizationProvider
            ) => (
              <ConnectionOptions
                value={formValues[paramKey]?.value ?? ""}
                onChange={(e) => handleInputChange(paramKey, e.target.value)}
                provider={provider}
              />
            );

            const renderConditionList = (paramKey: string) => (
              <ConditionList
                expression={formValues[paramKey]?.value ?? ""}
                onExpressionChange={(value) => {
                  handleInputChange(paramKey, value);
                }}
                recommendedWords={variableStorage}
              />
            );

            const renderProperty = (
              paramKey: string,
              paramValue: ArgumentProps
            ) => {
              if (!formValues[paramKey]) {
                formValues[paramKey] = setDefaultValue(
                  paramKey,
                  paramValue,
                  paramValue["value"] ?? initDefaultValue(paramValue.type)
                );
              }

              if (paramValue["hidden"]) {
                return null;
              }

              switch (paramValue.type) {
                case "string":
                case "email":
                case "any":
                case "list":
                case "variable":
                case "dictionary":
                case "DocumentTemplate":
                  return (
                    <TextAutoComplete
                      type="text"
                      value={formValues[paramKey]?.value ?? ""}
                      onChange={(newValue: string) =>
                        handleInputChange(paramKey, newValue)
                      }
                      recommendedWords={variableStorage}
                    />
                  );
                case "boolean":
                  return (
                    <Switch
                      defaultChecked={formValues[paramKey]?.value}
                      colorScheme="teal"
                      onChange={(e) => {
                        formValues[paramKey].value = e.target.checked;
                      }}
                      id={paramKey}
                      size="sm"
                    />
                  );

                case "date":
                  return (
                    <CustomDatePicker
                      ref={datePickerRef}
                      defaultValue={new Date(formValues[paramKey]?.value)}
                      paramKey={paramKey}
                      handleInputChange={handleInputChange}
                    />
                  );
                case "number":
                  return (
                    <TextAutoComplete
                      type="text"
                      value={formValues[paramKey]?.value ?? ""}
                      onChange={(newValue: string) =>
                        handleInputChange(paramKey, newValue)
                      }
                      recommendedWords={variableStorage}
                    />
                  );
                case "connection.Google Drive":
                  return renderConnectionSelect(
                    paramKey,
                    AuthorizationProvider.G_DRIVE
                  );
                case "connection.Gmail":
                  return renderConnectionSelect(
                    paramKey,
                    AuthorizationProvider.G_GMAIL
                  );
                case "connection.Google Sheets":
                  return renderConnectionSelect(
                    paramKey,
                    AuthorizationProvider.G_SHEETS
                  );
                case "connection.Google Classroom":
                  return renderConnectionSelect(
                    paramKey,
                    AuthorizationProvider.G_CLASSROOM
                  );
                case "connection.Google Form":
                  return renderConnectionSelect(
                    paramKey,
                    AuthorizationProvider.G_FORMS
                  );
                case "connection.SAP Mock":
                  return renderConnectionSelect(
                    paramKey,
                    AuthorizationProvider.SAP_MOCK
                  );
                case "connection.ERP Next":
                  return renderConnectionSelect(
                    paramKey,
                    AuthorizationProvider.ERP_NEXT
                  );
                case "connection.Moodle":
                  return renderConnectionSelect(
                    paramKey,
                    AuthorizationProvider.MOODLE
                  );
                case "enum.shareType":
                  return renderSelect(paramKey, [
                    { value: "user", label: "User" },
                    { value: "all", label: "All" },
                  ]);
                case "enum.permission":
                  return renderSelect(paramKey, [
                    {
                      value: "reader",
                      label: "Reader",
                    },
                    {
                      value: "commenter",
                      label: "Commenter",
                    },
                    {
                      value: "editor",
                      label: "Editor",
                    },
                    { value: "all", label: "All" },
                  ]);
                case "label_ids":
                  return renderSelect(paramKey, [
                    { value: "inbox", label: "Inbox" },
                    {
                      value: "starred",
                      label: "Starred",
                    },
                    { value: "sent", label: "Sent" },
                    { value: "spam", label: "Spam" },
                    { value: "trash", label: "Trash" },
                    {
                      value: "scheduled",
                      label: "Scheduled",
                    },
                  ]);
                case "enum.operator.logic":
                  return renderSelect(paramKey, [
                    { value: ">", label: ">" },
                    { value: "<", label: "<" },
                    { value: "=", label: "=" },
                    { value: ">=", label: ">=" },
                    { value: "<=", label: "<=" },
                  ]);
                case "list.condition":
                  return renderConditionList(paramKey);
                default:
                  return null;
              }
            };

            const renderStepThree = () => {
              const keyword = activityInfo?.[0]?.keyword;
              const activityProperty = activityInfo?.[0]?.arguments;
              const returnType = activityInfo?.[0]?.return;

              return (
                <VStack spacing={3} align="stretch">
                  {keyword && (
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="teal.600">
                        Keyword: {keyword}
                      </Text>
                    </Box>
                  )}
                  {activityProperty &&
                    Object.entries(activityProperty).map(
                      ([paramKey, paramValue]) => {
                        if (
                          paramValue &&
                          typeof paramValue === "object" &&
                          "description" in paramValue
                        ) {
                          return (
                            <Tooltip
                              label={paramValue.description as string}
                              key={paramKey}
                            >
                              <FormControl>
                                {!paramValue["hidden"] && (
                                  <FormLabel fontSize="sm">
                                    {paramKey}
                                  </FormLabel>
                                )}
                                {renderProperty(
                                  paramKey,
                                  paramValue as ArgumentProps
                                )}
                              </FormControl>
                            </Tooltip>
                          );
                        }
                        return null;
                      }
                    )}
                  {returnType && (
                    <Tooltip
                      label={returnType.description}
                      key={returnType.displayName}
                    >
                      <FormControl>
                        <FormLabel fontSize="sm">Result Variable</FormLabel>
                        <Select
                          defaultValue={saveResult || ""}
                          placeholder="Choose Variable"
                          onChange={(e) => {
                            setSaveResult(e.target.value);
                          }}
                          size="sm"
                        >
                          {variableStorage &&
                            variableStorage.map((variable: any) => (
                              <option
                                key={variable.toString()}
                                value={handleKeywordRobotFramework(
                                  variable[0],
                                  variable[1]
                                )}
                              >
                                {handleKeywordRobotFramework(
                                  variable[0],
                                  variable[1]
                                )}
                              </option>
                            ))}
                        </Select>
                      </FormControl>
                    </Tooltip>
                  )}
                </VStack>
              );
            };

            // Only render if this package has content to show
            const shouldRender =
              currentStep === 1 ||
              (currentStep === 2 && displayName === packageName) ||
              (currentStep === 3 && displayName === packageName);

            if (!shouldRender) return null;

            return (
              <Box key={_id}>
                {currentStep === 1 && renderStepOne()}
                {currentStep === 2 && renderStepTwo()}
                {currentStep === 3 && renderStepThree()}
              </Box>
            );
          })}
        {sideBarState.currentStep > 1 &&
          activityItem.activityType != "bpmn:Process" && (
            <Button
              mt={4}
              colorScheme="teal"
              size="sm"
              onClick={handleGoBack}
              w="100%"
            >
              Back
            </Button>
          )}
      </VStack>
    </Box>
  );
}

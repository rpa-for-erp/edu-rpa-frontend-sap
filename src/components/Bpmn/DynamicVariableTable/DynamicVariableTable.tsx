import React, { useState, useMemo } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Input,
  Select,
  Switch,
  IconButton,
  Text,
  Box,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { Variable, VariableType } from '@/types/variable';
import { useDispatch } from 'react-redux';
import { isSavedChange } from '@/redux/slice/bpmnSlice';
import DynamicInputValue from './DynamicInputValue';
import { getProcessFromLocalStorage } from '@/utils/processService';
import { Activity } from '@/types/activity';

interface VariableTableProps {
  variableList: Variable[];
  setVariableList: (value: Variable[]) => void;
  processID?: string;
}

const DynamicVariableTable = (props: VariableTableProps) => {
  const dispatch = useDispatch();

  const defaultValue = {
    [VariableType.String]: '',
    [VariableType.Number]: '0',
    [VariableType.Boolean]: 'false',
    [VariableType.File]: '',
    [VariableType.List]: '',
    [VariableType.Dictionary]: '',
    [VariableType.Connection]: '',
    [VariableType.DocumentTemplate]: '{}',
  };

  const [selectedType, setSelectedType] = useState<VariableType>(
    VariableType.String
  );

  // Get activities that use each variable
  const variableUsageMap = useMemo(() => {
    const usageMap: Record<string, string[]> = {};
    
    if (!props.processID) return usageMap;
    
    const process = getProcessFromLocalStorage(props.processID);
    if (!process?.activities) return usageMap;
    
    // Check each activity's properties for variable references
    process.activities.forEach((activity: Activity) => {
      const activityName = activity.activityName || activity.activityID;
      const properties = activity.properties as Record<string, any>;
      
      if (!properties) return;
      
      // Search for variable references in properties (format: ${variableName} or $variableName)
      const searchForVariables = (obj: any, varNames: string[]) => {
        if (typeof obj === 'string') {
          varNames.forEach((varName) => {
            // Check for ${varName} or $varName patterns
            if (obj.includes(`\${${varName}}`) || obj.includes(`$${varName}`) || obj === varName) {
              if (!usageMap[varName]) {
                usageMap[varName] = [];
              }
              if (!usageMap[varName].includes(activityName)) {
                usageMap[varName].push(activityName);
              }
            }
          });
        } else if (typeof obj === 'object' && obj !== null) {
          Object.values(obj).forEach((value) => searchForVariables(value, varNames));
        }
      };
      
      const varNames = props.variableList.map((v) => v.name).filter(Boolean);
      searchForVariables(properties, varNames);
    });
    
    return usageMap;
  }, [props.processID, props.variableList]);

  const handleAddRow = () => {
    const defaultTypeValue = defaultValue[VariableType.String] ?? '';
    const newRow: Variable = {
      id: 1,
      name: '',
      value: defaultTypeValue,
      isArgument: false,
      type: VariableType.String,
    };

    // Add new row at the beginning and update all IDs
    const updatedList = [newRow, ...props.variableList].map((row, index) => ({
      ...row,
      id: index + 1,
    }));

    props.setVariableList(updatedList);
    dispatch(isSavedChange(false));
  };

  const handleEditRow = (
    index: number,
    field: 'name' | 'value' | 'type' | 'isArgument' | 'label',
    value: string | boolean
  ) => {
    const updatedData = [...props.variableList];
    if (field === 'isArgument') {
      updatedData[index][field] = value as boolean;
    } else {
      updatedData[index][field] =
        field === 'value' ? value ?? '' : (value as string);
    }
    props.setVariableList([...updatedData]);
  };

  const handleRemoveRow = (id: number) => {
    const updatedData = props.variableList.filter((row) => row.id !== id);
    const updatedDataWithSequentialIds = updatedData.map((row, index) => ({
      ...row,
      id: index + 1,
    }));
    props.setVariableList([...updatedDataWithSequentialIds]);
  };

  const handleTypeChange = (index: number, newType: VariableType) => {
    setSelectedType(newType);
    const updatedData = [...props.variableList];
    const defaultTypeValue = (defaultValue[newType] as string) ?? '';
    updatedData[index].type = newType;
    updatedData[index].value = defaultTypeValue;
    props.setVariableList([...updatedData]);
  };

  return (
    <Box>
      {/* Add Variable Button */}
      <Button
        leftIcon={<AddIcon />}
        size="sm"
        colorScheme="teal"
        variant="ghost"
        height="26px"
        ml={2}
        onClick={handleAddRow}
      
      >
        Add Variable
      </Button>
      <Table variant="simple" >
        <Thead>
          <Tr>
            <Th  py={2}>Name</Th>
            <Th py={2}>Value</Th>
            <Th py={2}>Type</Th>
            <Th py={2}>Is Argument</Th>
            <Th py={2}>Activity/Package</Th>
            <Th py={2}>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {props.variableList.map((row, index) => (
            <Tr key={row.id}>
              <Td py={1.5}>
                <Input 
                  size="sm"
                  value={row.name}
                  onChange={(e) => {
                    handleEditRow(index, 'name', e.target.value);
                  }}
                />
              </Td>
              <Td py={1.5}>
                <DynamicInputValue 
                  row={row}
                  onChange={(template: string, label?: string) => {
                    handleEditRow(index, 'value', String(template));
                    if (label) {
                      handleEditRow(index, 'label', String(label));
                    }
                  }}
                />
              </Td>
              <Td py={1.5}>
                <Select
                  size="sm"
                  value={row.type}
                  onChange={(e) => {
                    handleTypeChange(index, e.target.value as VariableType);
                  }}>
                  <option value={VariableType.Any}>Any</option>
                  <option value={VariableType.String}>String</option>
                  <option value={VariableType.Number}>Number</option>
                  <option value={VariableType.Boolean}>Boolean</option>
                  <option value={VariableType.File}>File</option>
                  <option value={VariableType.List}>List</option>
                  <option value={VariableType.Dictionary}>Dictionary</option>
                  <option value={VariableType.Connection}>Connection</option>
                  <option value={VariableType.DocumentTemplate}>DocumentTemplate</option>
                </Select>
              </Td>
              <Td py={1.5}>
                <Switch
                  colorScheme="teal"
               
                  isChecked={row.isArgument}
                  onChange={(e) => {
                    handleEditRow(index, 'isArgument', e.target.checked);
                  }}
                />
              </Td>
              <Td py={1.5}>
                <Text fontSize="sm" color={variableUsageMap[row.name]?.length ? 'gray.700' : 'gray.400'}>
                  {variableUsageMap[row.name]?.join(', ') || ''}
                </Text>
              </Td>
              <Td py={1.5}>
                <Button
                  colorScheme="red"
                  size="sm"
                  onClick={() => handleRemoveRow(row.id)}>
                  Remove
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default DynamicVariableTable;

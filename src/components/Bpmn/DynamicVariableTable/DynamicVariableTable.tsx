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
  Tooltip,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { Variable, VariableType } from '@/types/variable';
import { useDispatch } from 'react-redux';
import { isSavedChange } from '@/redux/slice/bpmnSlice';
import DynamicInputValue from './DynamicInputValue';
import { useVariableUsage, formatVariableUsage } from '@/hooks/useVariableUsage';

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

  // Get variable names for tracking usage
  const variableNames = useMemo(
    () => props.variableList.map((v) => v.name).filter(Boolean),
    [props.variableList]
  );

  // Use the hook to track variable usage across activities
  // This will automatically update when properties-updated event is dispatched
  const variableUsageMap = useVariableUsage(props.processID, variableNames);

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
            <Th width={"150px"} py={2}>Is Argument</Th>
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
              <Td  py={1.5} maxWidth="150px">
                {variableUsageMap[row.name]?.length > 0 ? (
                  <Wrap spacing={1}>
                    {variableUsageMap[row.name].map((usage, idx) => (
                      <WrapItem key={`${usage.activityId}-${idx}`}>
                        <Tooltip
                          label={`Activity: ${usage.activityName}\nPackage: ${usage.packageName || 'N/A'}`}
                          placement="top"
                          hasArrow
                        >
                          <Tag size="sm" colorScheme="teal" variant="subtle">
                            <TagLabel fontSize="sm">
                              {usage.activityName
                                ? `${usage.packageName}.${usage.activityName.replaceAll(' ', '')}`
                                : usage.packageName}
                            </TagLabel>
                          </Tag>
                        </Tooltip>
                      </WrapItem>
                    ))}
                  </Wrap>
                ) : (
                  <Text fontSize="xs" color="gray.400">
                    -
                  </Text>
                )}
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

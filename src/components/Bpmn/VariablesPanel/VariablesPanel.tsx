import React, { useEffect, useState } from 'react';
import { Box, Button, Flex } from '@chakra-ui/react';
import DynamicVariableTable from '@/components/Bpmn/DynamicVariableTable/DynamicVariableTable';
import { Variable } from '@/types/variable';
import {
  convertToRefactoredObject,
  getVariableItemFromLocalStorage,
  replaceVariableStorage,
} from '@/utils/variableService';
import {
  getLocalStorageObject,
  setLocalStorageObject,
} from '@/utils/localStorageService';
import { LocalStorage } from '@/constants/localStorage';
import {
  getProcessFromLocalStorage,
  updateProcessInProcessList,
} from '@/utils/processService';

interface VariablesPanelProps {
  processID: string;
}

export default function VariablesPanel({ processID }: VariablesPanelProps) {
  const initialStorage = getVariableItemFromLocalStorage(processID);
  const [variableList, setVariableList] = useState<Variable[]>(
    initialStorage ? initialStorage.variables : []
  );

  useEffect(() => {
    if (variableList.length > 0) {
      setVariableList((prevVariableList) => {
        if (prevVariableList !== variableList) {
          return variableList;
        }
        return prevVariableList;
      });
    }
  }, [variableList]);

  const handleSave = () => {
    const currentVariable = {
      processID: processID,
      variables: variableList,
    };
    if (!initialStorage) {
      setLocalStorageObject(LocalStorage.VARIABLE_LIST, [
        ...getLocalStorageObject(LocalStorage.VARIABLE_LIST),
        currentVariable,
      ]);
    } else {
      const newStorage = replaceVariableStorage(processID, currentVariable);
      setLocalStorageObject(LocalStorage.VARIABLE_LIST, newStorage);
      const variableListByID = getVariableItemFromLocalStorage(processID);

      setVariableList(variableListByID.variables);
      const processProperties = getProcessFromLocalStorage(processID as string);

      const refactoredVariables = convertToRefactoredObject(variableListByID);

      const updateStorageByID = {
        ...processProperties,
        variables: refactoredVariables,
      };
      const replaceStorageSnapshot = updateProcessInProcessList(
        processID as string,
        updateStorageByID
      );
      setLocalStorageObject(LocalStorage.PROCESS_LIST, replaceStorageSnapshot);
    }
  };

  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb={4}>
        <Button colorScheme="teal" size="sm" onClick={handleSave}>
          Save Variables
        </Button>
      </Flex>
      <DynamicVariableTable
        variableList={variableList}
        setVariableList={setVariableList}
      />
    </Box>
  );
}


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

  // Listen for variables-updated event from CustomModeler
  useEffect(() => {
    console.log('🎨 [VariablesPanel] Setting up for processID:', processID);
    
    const handleVariablesUpdate = (event: CustomEvent) => {
      console.log('📢 [VariablesPanel] Received variables-updated event:', event.detail);
      // Only refresh if the event is for this process
      if (event.detail.processID === processID) {
        const updatedStorage = getVariableItemFromLocalStorage(processID);
        console.log('📦 [VariablesPanel] Updated storage from event:', updatedStorage);
        if (updatedStorage && updatedStorage.variables) {
          console.log('✅ [VariablesPanel] Setting variables from event:', updatedStorage.variables);
          setVariableList(updatedStorage.variables);
        }
      }
    };

    // Check immediately on mount (in case event already fired)
    const initialStorage = getVariableItemFromLocalStorage(processID);
    console.log('🔍 [VariablesPanel] Initial storage on mount:', initialStorage);
    if (initialStorage && initialStorage.variables && initialStorage.variables.length > 0) {
      console.log('✅ [VariablesPanel] Setting initial variables:', initialStorage.variables);
      setVariableList(initialStorage.variables);
    } else {
      console.warn('⚠️ [VariablesPanel] No variables found in localStorage');
    }

    window.addEventListener('variables-updated', handleVariablesUpdate as EventListener);

    return () => {
      window.removeEventListener('variables-updated', handleVariablesUpdate as EventListener);
    };
  }, [processID]);

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


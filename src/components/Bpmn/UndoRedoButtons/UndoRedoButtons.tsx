import React, { useState, useEffect } from 'react';
import { Button, ButtonGroup, Tooltip, Box } from '@chakra-ui/react';
import { useBpmn } from '@/hooks/useBpmn';
import { useTranslation } from 'next-i18next';

interface UndoRedoButtonsProps {
  bpmnReact?: ReturnType<typeof useBpmn>;
}

const UndoRedoButtons: React.FC<UndoRedoButtonsProps> = ({ bpmnReact }) => {
  const { t } = useTranslation('studio');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (!bpmnReact?.bpmnModeler) return;

    const commandStack = bpmnReact.bpmnModeler.get('commandStack') as any;
    const eventBus = bpmnReact.bpmnModeler.get('eventBus') as any;

    // Update button states when command stack changes
    const updateStates = () => {
      setCanUndo(commandStack?.canUndo() || false);
      setCanRedo(commandStack?.canRedo() || false);
    };

    // Listen to command stack changes via eventBus
    eventBus.on('commandStack.changed', updateStates);

    // Initial state
    updateStates();

    return () => {
      eventBus.off('commandStack.changed', updateStates);
    };
  }, [bpmnReact?.bpmnModeler]);

  const handleUndo = () => {
    if (bpmnReact) {
      bpmnReact.undo();
    }
  };

  const handleRedo = () => {
    if (bpmnReact) {
      bpmnReact.redo();
    }
  };

  return (
    <Box position="absolute" bottom="10px" left="10px" zIndex={1000}>
      <ButtonGroup
        size="sm"
        isAttached
        variant="outline"
        bg="white"
        shadow="md"
      >
        <Tooltip label={t('undoRedo.undoTooltip')} placement="bottom">
          <Button
            onClick={handleUndo}
            isDisabled={!canUndo}
            leftIcon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
              </svg>
            }
          >
            {t('undoRedo.undo')}
          </Button>
        </Tooltip>
        <Tooltip label={t('undoRedo.redoTooltip')} placement="bottom">
          <Button
            onClick={handleRedo}
            isDisabled={!canRedo}
            leftIcon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
              </svg>
            }
          >
            {t('undoRedo.redo')}
          </Button>
        </Tooltip>
      </ButtonGroup>
    </Box>
  );
};

export default UndoRedoButtons;

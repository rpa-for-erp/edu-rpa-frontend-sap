import React, { useState, useEffect } from 'react';
import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Icon } from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { useBpmn } from '@/hooks/useBpmn';

interface BreadcrumbsNavigationProps {
  bpmnReact?: ReturnType<typeof useBpmn>;
}

interface BreadcrumbItem {
  id: string;
  name: string;
  element: any;
}

const BreadcrumbsNavigation: React.FC<BreadcrumbsNavigationProps> = ({ bpmnReact }) => {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    if (!bpmnReact?.bpmnModeler) return;

    const canvas = bpmnReact.bpmnModeler.get('canvas') as any;
    const elementRegistry = bpmnReact.bpmnModeler.get('elementRegistry') as any;
    const eventBus = bpmnReact.bpmnModeler.get('eventBus') as any;

    const updateBreadcrumbs = () => {
      const rootElement = canvas.getRootElement();
      const breadcrumbsPath: BreadcrumbItem[] = [];

      // Build breadcrumbs path from root to current
      let currentElement = rootElement;
      const path: any[] = [];

      // Get all parent elements
      while (currentElement) {
        path.unshift(currentElement);
        currentElement = currentElement.parent;
      }

      // Build breadcrumbs
      path.forEach((element: any) => {
        const businessObject = element.businessObject;
        breadcrumbsPath.push({
          id: element.id,
          name: businessObject?.name || businessObject?.$type?.replace('bpmn:', '') || 'Process',
          element: element
        });
      });

      setBreadcrumbs(breadcrumbsPath);
    };

    // Listen to root element changes (when drilling down/up)
    eventBus.on('root.set', updateBreadcrumbs);
    eventBus.on('canvas.viewbox.changed', updateBreadcrumbs);

    // Initial state
    updateBreadcrumbs();

    return () => {
      eventBus.off('root.set', updateBreadcrumbs);
      eventBus.off('canvas.viewbox.changed', updateBreadcrumbs);
    };
  }, [bpmnReact?.bpmnModeler]);

  const navigateTo = (element: any) => {
    if (!bpmnReact?.bpmnModeler) return;
    
    const canvas = bpmnReact.bpmnModeler.get('canvas') as any;
    canvas.setRootElement(element);
    canvas.zoom('fit-viewport');
  };

  // Don't show if only one level (root)
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Box 
      position="absolute" 
      top="10px" 
      left="10px" 
      zIndex={1000}
      bg="white"
      px={3}
      py={2}
      borderRadius="md"
      shadow="md"
    >
      <Breadcrumb spacing="8px" separator={<ChevronRightIcon color="gray.500" />}>
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <BreadcrumbItem key={item.id} isCurrentPage={isLast}>
              <BreadcrumbLink
                onClick={() => !isLast && navigateTo(item.element)}
                cursor={isLast ? 'default' : 'pointer'}
                fontWeight={isLast ? 'bold' : 'normal'}
                color={isLast ? 'gray.800' : 'blue.600'}
                _hover={isLast ? {} : { textDecoration: 'underline' }}
              >
                {item.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          );
        })}
      </Breadcrumb>
    </Box>
  );
};

export default BreadcrumbsNavigation;


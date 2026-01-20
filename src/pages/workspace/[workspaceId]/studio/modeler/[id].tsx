import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Box } from '@chakra-ui/react';
import { useCollaboration } from '@/hooks/useCollaboration';
import { ActiveUsers } from '@/components/Collaboration/ActiveUsers';
import { CursorOverlay } from '@/components/Collaboration/CursorOverlay';

const DynamicCustomModeler = dynamic(
  () => import('@/components/Bpmn/CustomModeler'),
  { ssr: false }
);

export default function WorkspaceModeler() {
  const router = useRouter();
  const { id: processId } = router.query;
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Real-time collaboration
  const {
    activeUsers,
    cursors,
    isConnected,
    sendCursorPosition,
  } = useCollaboration(processId as string);

  // Track mouse movement for cursor sharing
  useEffect(() => {
    if (!containerRef.current) return;

    let timeoutId: NodeJS.Timeout;
    const handleMouseMove = (e: MouseEvent) => {
      // Debounce cursor updates
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          sendCursorPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }
      }, 100);
    };

    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, [sendCursorPosition]);

  return (
    <Box ref={containerRef} position="relative" h="100vh" overflow="hidden">
      {/* Active Users Indicator */}
      <ActiveUsers users={activeUsers} isConnected={isConnected} />

      {/* Cursor Overlay */}
      <CursorOverlay cursors={cursors} />

      {/* BPMN Modeler */}
      <DynamicCustomModeler />
    </Box>
  );
}

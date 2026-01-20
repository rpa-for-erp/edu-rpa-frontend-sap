import React from 'react';
import { Box, Text } from '@chakra-ui/react';

export interface Cursor {
  userId: string;
  userName: string;
  color: string;
  position: { x: number; y: number };
}

interface Props {
  cursors: Cursor[];
}

export const CursorOverlay: React.FC<Props> = ({ cursors }) => {
  return (
    <>
      {cursors.map((cursor) => (
        <Box
          key={cursor.userId}
          position="absolute"
          left={`${cursor.position.x}px`}
          top={`${cursor.position.y}px`}
          pointerEvents="none"
          zIndex={999}
          transition="all 0.1s ease-out"
        >
          {/* Cursor SVG */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
          >
            <path
              d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
          
          {/* User name label */}
          <Text
            ml={6}
            mt={-1}
            fontSize="xs"
            bg={cursor.color}
            color="white"
            px={2}
            py={1}
            borderRadius="md"
            whiteSpace="nowrap"
            fontWeight="medium"
            boxShadow="sm"
          >
            {cursor.userName}
          </Text>
        </Box>
      ))}
    </>
  );
};

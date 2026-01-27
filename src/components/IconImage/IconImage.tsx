import React from 'react';
import { IconButton, Box, Text } from '@chakra-ui/react';
import Image from 'next/image';

interface IconImageProps {
  icon: any;
  label: string;
  onClick?: () => void;
  width?: number;
  height?: number;
}

function IconImage(props: IconImageProps) {
  const { icon, label, onClick, width = 60, height = 60 } = props;

  // Safety check: if icon is null or undefined, don't render the Image
  if (!icon) {
    return (
      <IconButton
        aria-label={label}
        icon={
          <Box className="flex flex-col items-center">
            <Box
              width={width}
              height={height}
              bg="gray.200"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="xs" color="gray.500">
                No Icon
              </Text>
            </Box>
            <Text className="text-black mt-[10px] text-[13px] text-center">
              {label.split(' ').map((word, index, array) => (
                <span key={index}>
                  {word}
                  {index < array.length - 1 ? <br /> : ''}
                </span>
              ))}
            </Text>
          </Box>
        }
        flexDirection="column"
        alignItems="center"
        width={width * 2}
        height={height * 2}
        onClick={onClick}
      />
    );
  }

  return (
    <IconButton
      aria-label={label}
      icon={
        <Box className="flex flex-col items-center">
          <Image src={icon} alt="Icon" width={width} height={height} />
          <Text className="text-black mt-[10px] text-[13px] text-center">
            {label.split(' ').map((word, index, array) => (
              <span key={index}>
                {word}
                {index < array.length - 1 ? <br /> : ''}
              </span>
            ))}
          </Text>
        </Box>
      }
      flexDirection="column"
      alignItems="center"
      width={width * 2} // Adjust the width for the container based on custom width
      height={height * 2} // Adjust the height for the container based on custom height
      onClick={onClick}
    />
  );
}

export default IconImage;

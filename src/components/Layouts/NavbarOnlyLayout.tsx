import { Box, Flex } from '@chakra-ui/react';
import Navbar from '../Header/Navbar';

interface Props {
  pt?: string;
  children?: React.ReactNode;
}

const NavbarOnlyLayout = ({ pt = '80px', children }: Props) => {
  return (
    <Box minH="100vh" bg="white">
      <Navbar />
      <Box pt={pt}>{children}</Box>
    </Box>
  );
};

export default NavbarOnlyLayout;

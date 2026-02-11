import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Code,
  Box,
  Tag,
} from '@chakra-ui/react';
import { ActivityPackage } from '@/interfaces/activity-package';

interface PackageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: ActivityPackage | null;
}

const PackageDetailsModal: React.FC<PackageDetailsModalProps> = ({
  isOpen,
  onClose,
  pkg,
}) => {
  if (!pkg) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>{pkg.displayName} ({pkg.version})</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs colorScheme="teal">
            <TabList>
              <Tab>Overview</Tab>
              <Tab>Keywords ({pkg.parsedKeywords?.length || 0})</Tab>
              <Tab>Classes ({pkg.parsedClasses?.length || 0})</Tab>
              <Tab>Imports</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <VStack align="start" spacing={4}>
                  <HStack>
                    <Text fontWeight="bold">Internal Name:</Text>
                    <Code>{pkg.name}</Code>
                  </HStack>
                  <HStack>
                    <Text fontWeight="bold">Status:</Text>
                    <Badge colorScheme={pkg.isActive ? 'green' : 'gray'}>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </HStack>
                  <HStack>
                    <Text fontWeight="bold">Parse Status:</Text>
                    <Badge 
                      colorScheme={
                        pkg.parseStatus === 'success' ? 'green' : 
                        pkg.parseStatus === 'failed' ? 'red' : 'yellow'
                      }
                    >
                      {pkg.parseStatus}
                    </Badge>
                  </HStack>
                  {pkg.parseError && (
                    <Box p={3} bg="red.50" color="red.500" borderRadius="md" w="full">
                      <Text fontWeight="bold">Parse Error:</Text>
                      <Code display="block" colorScheme="red" bg="transparent">{pkg.parseError}</Code>
                    </Box>
                  )}
                  <Box>
                    <Text fontWeight="bold">Description:</Text>
                    <Text>{pkg.description || 'No description provided.'}</Text>
                  </Box>
                  <HStack>
                    <Text fontWeight="bold">File:</Text>
                    <Text>{pkg.fileName} ({pkg.fileSize ? (pkg.fileSize / 1024).toFixed(2) + ' KB' : 'N/A'})</Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="bold">Checksum:</Text>
                    <Code fontSize="xs">{pkg.checksum || 'N/A'}</Code>
                  </HStack>
                </VStack>
              </TabPanel>

              <TabPanel>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Keyword Name</Th>
                      <Th>Method</Th>
                      <Th>Arguments</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {pkg.parsedKeywords?.map((kw, idx) => (
                      <Tr key={idx}>
                        <Td fontWeight="medium">{kw.name}</Td>
                        <Td><Code>{kw.methodName}</Code></Td>
                        <Td>
                          <VStack align="start" spacing={1}>
                            {kw.args.map((arg, i) => (
                              <Text key={i} fontSize="xs">
                                <Code fontSize="xs">{arg.name}</Code>
                                {arg.type && <span style={{ color: 'gray' }}>: {arg.type}</span>}
                              </Text>
                            ))}
                          </VStack>
                        </Td>
                      </Tr>
                    ))}
                    {(!pkg.parsedKeywords || pkg.parsedKeywords.length === 0) && (
                      <Tr><Td colSpan={3} textAlign="center">No keywords found</Td></Tr>
                    )}
                  </Tbody>
                </Table>
              </TabPanel>

              <TabPanel>
                <VStack align="stretch" spacing={4}>
                  {pkg.parsedClasses?.map((cls, idx) => (
                    <Box key={idx} p={3} borderWidth={1} borderRadius="md">
                      <Text fontWeight="bold" fontSize="lg">{cls.name}</Text>
                      <Text color="gray.500" fontSize="sm" mb={2}>{cls.docstring}</Text>
                      <Text fontWeight="semibold" size="sm">Methods:</Text>
                      <HStack wrap="wrap" spacing={2}>
                        {cls.methods.map((m, i) => (
                          <Tag key={i} size="sm" variant="outline">{m}</Tag>
                        ))}
                      </HStack>
                    </Box>
                  ))}
                   {(!pkg.parsedClasses || pkg.parsedClasses.length === 0) && (
                    <Text textAlign="center" color="gray.500">No classes found</Text>
                  )}
                </VStack>
              </TabPanel>
              
              <TabPanel>
                <VStack align="start">
                  {pkg.imports?.map((imp, idx) => (
                    <Code key={idx} width="full">{imp}</Code>
                  ))}
                  {(!pkg.imports || pkg.imports.length === 0) && (
                    <Text textAlign="center" color="gray.500">No imports found</Text>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PackageDetailsModal;

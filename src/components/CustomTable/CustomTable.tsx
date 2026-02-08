import React, { useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Box,
  HStack,
  Tag,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Select,
} from '@chakra-ui/react';
import {
  DownloadIcon,
  EditIcon,
  DeleteIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@chakra-ui/icons';
import ReactPaginate from 'react-paginate';
import { IoDocumentText } from 'react-icons/io5';
import { FaPlay, FaEllipsisV } from 'react-icons/fa';
import LoadingIndicator from '../LoadingIndicator/LoadingIndicator';
import { FaCode } from 'react-icons/fa6';
import { BsPinAngleFill, BsPinAngle } from 'react-icons/bs';
import { MdContentCopy, MdShare, MdSettings } from 'react-icons/md';
import { useTranslation } from 'next-i18next';

interface TableProps {
  header: string[];
  headerKeys?: string[]; // Optional: map header to data keys
  data: any[];
  maxRows?: number;
  isLoading?: boolean;
  onView?: (id: string, name: string, version: string | number) => void;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, name: string, version: string | number) => void;
  onRun?: (id: string) => void;
  onViewFile?: (id: string, name: string, version: string | number) => void;
  onDuplicate?: (id: string) => void;
  onShare?: (id: string) => void;
  onPin?: (id: string) => void;
  onProcessSettings?: (id: string) => void;
  sortOrder?: 'asc' | 'desc' | null;
  onSortChange?: () => void;
}
const DEFAULT_MAX_ROWS = 6;

const CustomTable = (props: TableProps) => {
  const { t } = useTranslation('common');
  const [currentPage, setCurrentPage] = useState(0);
  const [currentDeletingId, setCurrentDeletingId] = useState<string | null>(
    null
  );
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const pageCount = Math.ceil(props.data.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = props.data.slice(startIndex, endIndex);

  const { isOpen, onOpen, onClose } = useDisclosure();

  if (currentData.length == 0) return <Box></Box>;

  if (props.isLoading) {
    return <LoadingIndicator />;
  }

  const handlePageChange = (selected: any) => {
    setCurrentPage(selected.selected);
  };

  const handleDeleteClick = (id: string) => {
    setCurrentDeletingId(id);
    onOpen();
  };

  const confirmDelete = () => {
    if (currentDeletingId) {
      props.onDelete(currentDeletingId);
      onClose();
      setCurrentDeletingId(null);
    }
  };

  const renderTableCell = (type: string, value: string, item?: any) => {
    switch (type) {
      case 'status':
        return (
          <Tag
            colorScheme={
              value === 'draft'
                ? 'yellow'
                : value === 'deployed'
                  ? 'green'
                  : value === 'Connected'
                    ? 'green'
                    : 'red'
            }
            size="md"
            p={2}
            rounded={8}
          >
            {value}
          </Tag>
        );
      case 'type':
        return (
          <Box className="flex justify-between">
            <Box className="flex justify-between">
              <IoDocumentText
                size="20px"
                className="hover:opacity-80 hover:cursor-pointer"
              />
              <Text className="text-[16px] ml-[10px]">{value}</Text>
            </Box>
            <Box></Box>
          </Box>
        );
      case 'name':
        return (
          <HStack>
            {item?.pinned && <BsPinAngleFill color="#319795" />}
            <Text>{value}</Text>
          </HStack>
        );
      case 'parseStatus':
        return (
          <Tag
            colorScheme={
              value === 'success'
                ? 'green'
                : value === 'pending'
                  ? 'blue'
                  : value === 'failed'
                    ? 'red'
                    : 'gray'
            }
            size="md"
            p={2}
            rounded={8}
          >
            {value ? value.toUpperCase() : 'N/A'}
          </Tag>
        );
      default:
        return <Text>{value}</Text>;
    }
  };

  return (
    <Box>
      <Box overflowX="auto" className="shadow-sm">
        <Table variant="simple" size="md" sx={{ tableLayout: 'auto' }}>
          <Thead bg="#F0F0F0">
            <Tr>
              {props.header.map((headerItem: string, headerIndex: number) => {
                const headerKey = props.headerKeys
                  ? props.headerKeys[headerIndex]
                  : Object.keys(currentData[0] || {})[headerIndex];

                // Define column widths
                const getColumnWidth = (header: string) => {
                  switch (header) {
                    case 'Process name':
                      return '20%';
                    case 'Process description':
                      return '25%';
                    case 'Owner':
                      return '12%';
                    case 'Last Modified':
                      return '18%';
                    case 'Version':
                      return '8%';
                    case 'Status':
                      return '10%';
                    default:
                      return 'auto';
                  }
                };

                return (
                  <Th
                    key={headerItem}
                    fontWeight="bold"
                    color="black"
                    textTransform="none"
                    fontSize="14px"
                    px={3}
                    width={getColumnWidth(headerItem)}
                  >
                    <HStack spacing={1} justify="flex-start">
                      <Text>{headerItem}</Text>
                      {headerItem === 'Last Modified' && props.onSortChange && (
                        <IconButton
                          size="xs"
                          aria-label="Sort"
                          variant="ghost"
                          _hover={{ bg: 'gray.100' }}
                          icon={
                            props.sortOrder === 'asc' ? (
                              <ChevronUpIcon />
                            ) : (
                              <ChevronDownIcon />
                            )
                          }
                          onClick={props.onSortChange}
                        />
                      )}
                    </HStack>
                  </Th>
                );
              })}
              <Th
                fontWeight="bold"
                color="black"
                textTransform="none"
                fontSize="14px"
                px={3}
                width="100px"
              >
                Actions
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {currentData.map((item, index) => (
              <Tr
                key={item.id}
                bg={item.pinned ? 'teal.50' : 'transparent'}
                _hover={{
                  bg: '#4FD1C5',
                  cursor: 'pointer',
                  color: 'white',
                }}
                onClick={() =>
                  props.onView && props.onView(item.id, item.name, item.version)
                }
              >
                {props.headerKeys
                  ? props.headerKeys.map((key, columnIndex) => (
                      <Td key={key} px={3} py={3}>
                        {renderTableCell(key, item[key], item)}
                      </Td>
                    ))
                  : Object.keys(item).map((key, columnIndex) =>
                      columnIndex < (props.maxRows ?? DEFAULT_MAX_ROWS) ? (
                        <Td key={key} px={3} py={3}>
                          {renderTableCell(key, item[key], item)}
                        </Td>
                      ) : null
                    )}
                <Td px={3} py={3}>
                  <HStack spacing={2}>
                    {props.onRun && (
                      <IconButton
                        bg="white"
                        aria-label="Run"
                        onClick={(e: any) => {
                          e.stopPropagation();
                          props.onRun && props.onRun(item.id);
                        }}
                        icon={<FaPlay color="#319795" />}
                      />
                    )}
                    {props.onViewFile && (
                      <IconButton
                        bg="white"
                        aria-label="View Item"
                        onClick={(e) => {
                          e.stopPropagation();
                          props.onViewFile &&
                            props.onViewFile(item.id, item.name, item.version);
                        }}
                        icon={<FaCode color="#319795" />}
                      />
                    )}
                    {(props.onDownload ||
                      props.onDelete ||
                      props.onDuplicate ||
                      props.onShare ||
                      props.onPin ||
                      props.onProcessSettings) && (
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          aria-label="Options"
                          icon={<FaEllipsisV />}
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <MenuList
                          textColor={'black'}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {props.onProcessSettings && (
                            <MenuItem
                              icon={<MdSettings />}
                              onClick={(e) => {
                                e.stopPropagation();
                                props.onProcessSettings!(item.id);
                              }}
                            >
                              Process settings
                            </MenuItem>
                          )}
                          {props.onDuplicate && (
                            <MenuItem
                              icon={<MdContentCopy />}
                              onClick={(e) => {
                                e.stopPropagation();
                                props.onDuplicate!(item.id);
                              }}
                            >
                              Duplicate
                            </MenuItem>
                          )}
                          {props.onShare && (
                            <MenuItem
                              icon={<MdShare />}
                              onClick={(e) => {
                                e.stopPropagation();
                                props.onShare!(item.id);
                              }}
                            >
                              Share
                            </MenuItem>
                          )}
                          {props.onDownload && (
                            <MenuItem
                              icon={<DownloadIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                props.onDownload!(item.id);
                              }}
                            >
                              Download
                            </MenuItem>
                          )}
                          {props.onPin && (
                            <MenuItem
                              icon={
                                item.pinned ? (
                                  <BsPinAngleFill />
                                ) : (
                                  <BsPinAngle />
                                )
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                props.onPin!(item.id);
                              }}
                            >
                              {item.pinned ? 'Unpin' : 'Pin'}
                            </MenuItem>
                          )}
                          {props.onDelete && props.onProcessSettings && (
                            <MenuDivider />
                          )}
                          {props.onDelete && (
                            <MenuItem
                              icon={<DeleteIcon />}
                              color="red.500"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(item.id);
                              }}
                            >
                              Delete
                            </MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                    )}
                  </HStack>
                  <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalOverlay bg="blackAlpha.300" />
                    <ModalContent>
                      <ModalHeader>Confirmation Delete</ModalHeader>
                      <ModalCloseButton />
                      <ModalBody>
                        <Text>Are you sure you want to delete this item?</Text>
                        <Text>
                          This action is irreversible and you will not be able
                          to restore the item afterward.
                        </Text>
                      </ModalBody>
                      <ModalFooter>
                        <Button variant="outline" mr={3} onClick={onClose}>
                          Cancel
                        </Button>
                        <Button colorScheme="red" onClick={confirmDelete}>
                          Delete
                        </Button>
                      </ModalFooter>
                    </ModalContent>
                  </Modal>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        p={4}
      >
        <HStack spacing={2}>
          <Text fontSize="sm">{t('table.itemsPerPage')}</Text>
          <Select
            size="sm"
            width="80px"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(0);
            }}
          >
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
          </Select>
        </HStack>
        <ReactPaginate
          previousLabel={
            <IconButton aria-label="Previous" size="sm">
              <ChevronLeftIcon />
            </IconButton>
          }
          nextLabel={
            <IconButton aria-label="Next" size="sm">
              <ChevronRightIcon />
            </IconButton>
          }
          pageCount={pageCount}
          onPageChange={handlePageChange}
          containerClassName={'flex items-center gap-[5px]'}
          previousLinkClassName={'font-bold'}
          nextLinkClassName={'font-bold'}
          disabledClassName={'opacity-50 cursor-not-allowed'}
          activeClassName={'bg-teal-500 rounded-[5px] text-white py-[8px]'}
          pageLinkClassName={
            'border rounded-[5px] px-[15px] py-[10px] hover:bg-teal-500 hover:text-white'
          }
        />
      </Box>
    </Box>
  );
};

export default CustomTable;

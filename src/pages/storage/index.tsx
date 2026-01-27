import { formatDate } from '@/utils/common';
import React, { useEffect, useState } from 'react';
import SidebarContent from '@/components/Sidebar/SidebarContent/SidebarContent';
import {
  Box,
  Button,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import { ChevronRightIcon, QuestionIcon, SearchIcon } from '@chakra-ui/icons';
import { RangeDatepicker } from 'chakra-dayzed-datepicker';
import FileItem from '@/components/FileStorage/FileItem';
import {
  getFiles,
  createFolder,
  getPresignedUrl,
  deleteFile,
} from '@/apis/fileStorageApi';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import CreateFolderModal from '@/components/FileStorage/CreateFolderModal';
import FileUploadModal from '@/components/FileStorage/FileUploadModal';
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal';
import { FileMetadata } from '@/interfaces/storage';
import { GetServerSideProps } from 'next';
import { getServerSideTranslations } from '@/utils/i18n';
import { useTranslation } from 'next-i18next';

export default function Storage() {
  const { t } = useTranslation('storage');
  const { t: tCommon } = useTranslation('common');
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingCreateFolder, setIsLoadingCreateFolder] =
    useState<boolean>(false);
  const [isLoadingGetPresignedUrl, setIsLoadingGetPresignedUrl] =
    useState<boolean>(false);
  const [isLoadingDeleteFile, setIsLoadingDeleteFile] =
    useState<boolean>(false);
  const [selectedFileToDelete, setSelectedFileToDelete] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([
    new Date(),
    new Date(),
  ]);

  const {
    isOpen: isOpenCreateFolderModal,
    onOpen: onOpenCreateFolderModal,
    onClose: onCloseCreateFolderModal,
  } = useDisclosure();
  const {
    isOpen: isOpenFileUploadModal,
    onOpen: onOpenFileUploadModal,
    onClose: onCloseFileUploadModal,
  } = useDisclosure();
  const {
    isOpen: isOpenConfirmDeleteModal,
    onOpen: onOpenConfirmDeleteModal,
    onClose: onCloseConfirmDeleteModal,
  } = useDisclosure();

  const handleCreateFolder = (folderName: string) => {
    setIsLoadingCreateFolder(true);
    createFolder(`${currentPath}${folderName}/`)
      .then(() => {
        onCloseCreateFolderModal();
        setCurrentPath(`${currentPath}${folderName}/`);
      })
      .finally(() => {
        setIsLoadingCreateFolder(false);
      });
  };

  useEffect(() => {
    setIsLoading(true);
    getFiles(currentPath)
      .then((res) => {
        setFiles(res);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    getFiles(currentPath)
      .then((res) => {
        setFiles(res.filter((file) => file.name !== ''));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentPath]);

  const handleFileItemClick = (name: string) => {
    if (name.endsWith('/')) {
      setCurrentPath(`${currentPath}${name}`);
    } else {
      setIsLoadingGetPresignedUrl(true);
      getPresignedUrl(`${currentPath}${name}`)
        .then((res) => {
          window.open(res.url, '_blank');
        })
        .finally(() => {
          setIsLoadingGetPresignedUrl(false);
        });
    }
  };

  const handleCloseFileUploadModal = () => {
    onCloseFileUploadModal();
    setIsLoading(true);
    getFiles(currentPath)
      .then((res) => {
        setFiles(res.filter((file) => file.name !== ''));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleClickUpload = () => {
    onOpenFileUploadModal();
  };

  const handleClickCreateFolder = () => {
    onOpenCreateFolderModal();
  };

  const handleClickDeleteFile = (name: string) => {
    setSelectedFileToDelete(`${currentPath}${name}`);
    onOpenConfirmDeleteModal();
  };

  const handleConfirmDelete = async () => {
    setIsLoadingDeleteFile(true);
    const isDirectory = selectedFileToDelete.endsWith('/');
    if (isDirectory) {
      const files = await getFiles(selectedFileToDelete);
      if (files.some((file) => file.name !== '')) {
        alert(t('folderNotEmpty'));
        setIsLoadingDeleteFile(false);
        return;
      }
    }

    try {
      await deleteFile(selectedFileToDelete);
      onCloseConfirmDeleteModal();
      setIsLoading(true);
      const res = await getFiles(currentPath);
      setFiles(res.filter((file) => file.name !== ''));
    } catch (error: any) {
      alert(error);
    }
    setIsLoading(false);
    setIsLoadingDeleteFile(false);
  };

  return (
    <div className="mb-[200px]">
      <SidebarContent>
        <div className="flex flex-start">
          <h1 className="pl-[20px] pr-[10px] ml-[35px] font-bold text-2xl text-[#319795]">
            {t('fileStorage')}
          </h1>
          <Tooltip
            hasArrow
            label={tCommon('tooltips.storageService')}
            bg="gray.300"
            color="black"
          >
            <QuestionIcon color="blue.500" />
          </Tooltip>
        </div>
        {/* <Breadcrumb
          separator={<ChevronRightIcon color="gray.500" />}
          spacing="8px"
          className="px-[20px] ml-[35px] mt-[20px]"
        >
          <BreadcrumbItem>
            <BreadcrumbLink
              color="#319795"
              onClick={() => {
                setCurrentPath('');
              }}
            >
              /
            </BreadcrumbLink>
          </BreadcrumbItem>
          {currentPath.split('/').map((path, index) => (
            <BreadcrumbItem key={index}>
              <BreadcrumbLink
                color="#319795"
                onClick={() => {
                  setCurrentPath(
                    currentPath
                      .split('/')
                      .slice(0, index + 1)
                      .join('/') + '/'
                  );
                }}
              >
                {path}
              </BreadcrumbLink>
            </BreadcrumbItem>
          ))}
        </Breadcrumb> */}
        <div className="flex justify-between w-90 mx-auto my-[30px]">
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.500" />
            </InputLeftElement>
            <Input
              width="20vw"
              bg="white.300"
              type="text"
              placeholder={t('searchPlaceholder')}
            />
          </InputGroup>

          <div className="flex justify-between gap-[10px]">
            <Box className="w-[21vw]">
              <RangeDatepicker
                selectedDates={selectedDates}
                onDateChange={setSelectedDates}
              />
            </Box>
            <Box className="w-[10vw]">
              <Select defaultValue="all">
                <option value="google-sheet">{t('googleSheet')}</option>
                <option value="pdf">{t('pdf')}</option>
                <option value="google-docs">{t('googleDocs')}</option>
                <option value="image">{t('image')}</option>
                <option value="all">{t('all')}</option>
              </Select>
            </Box>
            <IconButton
              bg={'teal'}
              colorScheme="teal"
              aria-label="Upload File"
              icon={<CloudUploadIcon />}
              onClick={handleClickUpload}
            />
            <IconButton
              bg={'teal'}
              colorScheme="teal"
              aria-label="Create Folder"
              icon={<CreateNewFolderIcon />}
              onClick={handleClickCreateFolder}
            />
          </div>
        </div>

        <CreateFolderModal
          isOpen={isOpenCreateFolderModal}
          isLoading={isLoadingCreateFolder}
          onClose={onCloseCreateFolderModal}
          handleCreateFolder={handleCreateFolder}
        />

        <FileUploadModal
          isOpen={isOpenFileUploadModal}
          onClose={handleCloseFileUploadModal}
          path={currentPath}
        />

        <ConfirmModal
          isOpen={isOpenConfirmDeleteModal}
          onClose={onCloseConfirmDeleteModal}
          title={t(
            selectedFileToDelete.endsWith('/') ? 'deleteFolder' : 'deleteFile'
          )}
          content={t('confirmDeleteContent', { name: selectedFileToDelete })}
          onConfirm={handleConfirmDelete}
          isLoading={isLoadingDeleteFile}
        />

        {isLoading ? (
          <div className="w-90 m-auto flex justify-center items-center">
            <Button colorScheme="teal" className="m-auto" isLoading>
              {t('loading')}
            </Button>
          </div>
        ) : (
          <div className="w-90 m-auto">
            <div className="grid grid-cols-4 gap-4">
              {files.map((file, idx) => (
                <FileItem
                  key={idx}
                  data={file}
                  isLoading={isLoadingGetPresignedUrl}
                  onClick={handleFileItemClick}
                  onClickDelete={handleClickDeleteFile}
                />
              ))}
            </div>
          </div>
        )}

        {files.length === 0 && !isLoading && (
          <div className="w-90 m-auto flex justify-center items-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{t('noFilesHere')}</div>
              <div className="text-gray-500">{t('uploadOrCreateNew')}</div>
            </div>
          </div>
        )}
      </SidebarContent>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      ...(await getServerSideTranslations(context, [
        'common',
        'sidebar',
        'navbar',
        'storage',
      ])),
    },
  };
};

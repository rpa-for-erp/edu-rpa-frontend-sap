import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Heading,
  HStack,
  useToast,
  Text,
  Badge,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { AddIcon, RepeatIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import { ActivityPackage } from '@/interfaces/activity-package';
import activityPackageApi from '@/apis/activityPackageApi';
import CustomTable from '@/components/CustomTable/CustomTable';
import UploadPackageModal from '@/components/Package/UploadPackageModal';
import PackageDetailsModal from '@/components/Package/PackageDetailsModal';

const PackagesPage = () => {
  const [packages, setPackages] = useState<ActivityPackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ActivityPackage | null>(null);
  
  const toast = useToast();

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const data = await activityPackageApi.getAllPackages();
      setPackages(data);
    } catch (error) {
      toast({
        title: 'Error loading packages',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    try {
      await activityPackageApi.deletePackage(id);
      toast({
        title: `Package ${name} deleted`,
        status: 'success',
        duration: 3000,
      });
      loadPackages();
    } catch (error) {
      toast({
        title: 'Error deleting package',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleReparse = async (id: string) => {
    try {
      await activityPackageApi.reparsePackage(id);
      toast({
        title: 'Reparse started',
        status: 'info',
        duration: 2000,
      });
      loadPackages();
    } catch (error) {
       toast({
        title: 'Error starting reparse',
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Provide raw data structure for CustomTable
  const tableData = packages.map(p => ({
    id: p.id,
    name: p.displayName,
    internalName: p.name,
    version: p.version,
    fileType: p.fileType,
    parseStatus: p.parseStatus,
    keywordsCount: p.parsedKeywords?.length || 0,
    isActive: p.isActive,
    // Add raw object for actions
    raw: p
  }));

  const headers = ['Display Name', 'Internal Name', 'Version', 'Type', 'Status', 'Keywords'];
  const headerKeys = ['name', 'internalName', 'version', 'fileType', 'parseStatus', 'keywordsCount'];

  // Custom renders for status in table
  // Since CustomTable is generic, we might need to rely on its internal switch or pass formatters
  // But CustomTable handles basic strings. Let's see if we can customize without modifying CustomTable too much.
  // CustomTable `renderTableCell` handles "status" key with specific logic (draft, deployed etc.)
  // We might want to adjust CustomTable to handle our statuses or just let it render string.
  
  return (
    <Box p={6}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Activity Packages</Heading>
        <Button 
          leftIcon={<AddIcon />} 
          colorScheme="teal" 
          onClick={() => setUploadModalOpen(true)}
        >
          Upload Package
        </Button>
      </HStack>

      <Box bg="white" rounded="lg" shadow="sm" overflow="hidden">
        {/* We can use CustomTable or build a specific one if CustomTable is too rigid */}
        {/* Let's use CustomTable for consistency */}
        <CustomTable
          header={headers}
          headerKeys={headerKeys}
          data={tableData}
          isLoading={isLoading}
          onDelete={(id) => {
             const p = packages.find(pkg => pkg.id === id);
            // CustomTable's onDelete logic handles confirmation modal internally
             if(p) handleDelete(id, p.name);
          }}
          onView={(id) => {
             const p = packages.find(pkg => pkg.id === id);
             if(p) {
               setSelectedPackage(p);
               setDetailsModalOpen(true);
             }
          }}
          // Passing custom actions via view/delete hooks or extending table functionality
          // but CustomTable.tsx seems to only support specific actions
        />
      </Box>

      <UploadPackageModal 
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={loadPackages}
      />

      <PackageDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        pkg={selectedPackage}
      />
    </Box>
  );
};

export default PackagesPage;

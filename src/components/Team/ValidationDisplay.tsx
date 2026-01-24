import { Alert, AlertIcon, AlertTitle, AlertDescription, Box, List, ListItem } from '@chakra-ui/react';

interface ValidationErrorsProps {
  errors: string[];
}

export const ValidationErrors: React.FC<ValidationErrorsProps> = ({ errors }) => {
  if (errors.length === 0) return null;

  return (
    <Alert status="error" borderRadius="md" mb={4}>
      <AlertIcon />
      <Box flex="1">
        <AlertTitle>Validation Failed</AlertTitle>
        <AlertDescription display="block">
          <List spacing={1} mt={2}>
            {errors.map((error, index) => (
              <ListItem key={index}>• {error}</ListItem>
            ))}
          </List>
        </AlertDescription>
      </Box>
    </Alert>
  );
};

interface ValidationWarningsProps {
  warnings: string[];
}

export const ValidationWarnings: React.FC<ValidationWarningsProps> = ({ warnings }) => {
  if (warnings.length === 0) return null;

  return (
    <Alert status="warning" borderRadius="md" mb={4}>
      <AlertIcon />
      <Box flex="1">
        <AlertTitle>Warnings</AlertTitle>
        <AlertDescription display="block">
          <List spacing={1} mt={2}>
            {warnings.map((warning, index) => (
              <ListItem key={index}>• {warning}</ListItem>
            ))}
          </List>
        </AlertDescription>
      </Box>
    </Alert>
  );
};

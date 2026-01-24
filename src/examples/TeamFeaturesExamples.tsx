/**
 * TEAM FEATURES - USAGE EXAMPLES
 * 
 * This file contains practical examples of how to use the Team features.
 * Copy and adapt these examples to your components.
 */

import { useState } from 'react';
import { Button, useToast } from '@chakra-ui/react';
import {
  teamApi,
  useTeamProcesses,
  useTeamRobots,
  useValidateTeamRobot,
  useDeleteTeamRobot,
  useCreateTeamProcess,
  useTeamConnections,
  hasTeamPermission,
  TeamMember,
} from '@/team-features';
import { ValidationErrors, ValidationWarnings } from '@/components/Team/ValidationDisplay';
import { PermissionButton } from '@/components/Team/PermissionComponents';

// ============================================================================
// EXAMPLE 1: Display Team Processes with Permissions
// ============================================================================

export function ProcessListExample({ teamId, teamMember }: { teamId: string; teamMember: TeamMember | null }) {
  const { data: processesData, isLoading } = useTeamProcesses(teamId, 1, 10);
  const canCreate = hasTeamPermission(teamMember, 'create_process');
  const canEdit = hasTeamPermission(teamMember, 'edit_process');
  const canDelete = hasTeamPermission(teamMember, 'delete_process');

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Team Processes</h1>
      
      {canCreate && (
        <Button colorScheme="teal">Create Process</Button>
      )}

      {processesData?.processes.map((process: any) => (
        <div key={process.id}>
          <h3>{process.name}</h3>
          <p>{process.description}</p>
          
          {canEdit && <Button size="sm">Edit</Button>}
          {canDelete && <Button size="sm" colorScheme="red">Delete</Button>}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Run Robot with Validation
// ============================================================================

export function RunRobotExample({ teamId, robotKey }: { teamId: string; robotKey: string }) {
  const toast = useToast();
  const validateMutation = useValidateTeamRobot();
  const [validation, setValidation] = useState<any>(null);

  const handleRunRobot = async () => {
    try {
      // Step 1: Validate
      const result = await validateMutation.mutateAsync({
        teamId,
        robotKey,
        action: 'run',
      });

      setValidation(result);

      // Step 2: Check if valid
      if (!result.isValid) {
        toast({
          title: 'Cannot run robot',
          description: result.errors.join(', '),
          status: 'error',
          duration: 5000,
        });
        return;
      }

      // Step 3: Show warnings if any
      if (result.warnings.length > 0) {
        toast({
          title: 'Warnings',
          description: result.warnings.join(', '),
          status: 'warning',
          duration: 3000,
        });
      }

      // Step 4: Run robot (TODO: Integrate with Lambda)
      console.log('Running robot:', robotKey);
      toast({
        title: 'Robot started',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to run robot:', error);
    }
  };

  return (
    <div>
      <Button 
        colorScheme="green" 
        onClick={handleRunRobot}
        isLoading={validateMutation.isPending}
      >
        Run Robot
      </Button>

      {validation && (
        <>
          <ValidationErrors errors={validation.errors} />
          <ValidationWarnings warnings={validation.warnings} />
        </>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Delete Robot with Validation
// ============================================================================

export function DeleteRobotExample({ teamId, robotKey }: { teamId: string; robotKey: string }) {
  const validateMutation = useValidateTeamRobot();
  const deleteMutation = useDeleteTeamRobot(teamId);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = async () => {
    // Step 1: Validate
    const validation = await validateMutation.mutateAsync({
      teamId,
      robotKey,
      action: 'delete',
    });

    // Step 2: Check if valid
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }

    // Step 3: Show confirmation
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    // Step 4: Delete
    await deleteMutation.mutateAsync(robotKey);
    setShowConfirm(false);
  };

  return (
    <div>
      <Button 
        colorScheme="red" 
        onClick={handleDeleteClick}
        isLoading={validateMutation.isPending}
      >
        Delete Robot
      </Button>

      {showConfirm && (
        <div>
          <p>Are you sure you want to delete this robot?</p>
          <Button onClick={handleConfirmDelete} isLoading={deleteMutation.isPending}>
            Confirm
          </Button>
          <Button onClick={() => setShowConfirm(false)}>Cancel</Button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Permission-Based Button
// ============================================================================

export function PermissionButtonExample({ teamMember }: { teamMember: TeamMember | null }) {
  const handleCreate = () => {
    console.log('Creating process...');
  };

  return (
    <PermissionButton
      teamMember={teamMember}
      requiredPermission="create_process"
      colorScheme="teal"
      onClick={handleCreate}
      tooltipMessage="You need 'create_process' permission to create processes"
    >
      Create Process
    </PermissionButton>
  );
}

// ============================================================================
// EXAMPLE 5: Direct API Call
// ============================================================================

export async function DirectApiExample() {
  const teamId = 'team-123';

  try {
    // Get processes
    const processesData = await teamApi.getTeamProcesses(teamId, 1, 10);
    console.log('Processes:', processesData.processes);

    // Get robots
    const robotsData = await teamApi.getTeamRobots(teamId, 1, 10);
    console.log('Robots:', robotsData.robots);

    // Validate robot
    const validation = await teamApi.validateTeamRobot(teamId, 'robot-key', 'run');
    console.log('Validation:', validation);

    // Get connections
    const connections = await teamApi.getTeamConnections(teamId);
    console.log('Connections:', connections);
  } catch (error) {
    console.error('API Error:', error);
  }
}

// ============================================================================
// EXAMPLE 6: Check Multiple Permissions
// ============================================================================

export function MultiplePermissionsExample({ teamMember }: { teamMember: TeamMember | null }) {
  const canView = hasTeamPermission(teamMember, 'view_processes');
  const canCreate = hasTeamPermission(teamMember, 'create_process');
  const canEdit = hasTeamPermission(teamMember, 'edit_process');
  const canDelete = hasTeamPermission(teamMember, 'delete_process');

  return (
    <div>
      <h2>Your Permissions:</h2>
      <ul>
        <li>View Processes: {canView ? '✅' : '❌'}</li>
        <li>Create Process: {canCreate ? '✅' : '❌'}</li>
        <li>Edit Process: {canEdit ? '✅' : '❌'}</li>
        <li>Delete Process: {canDelete ? '✅' : '❌'}</li>
      </ul>
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Create Process
// ============================================================================

export function CreateProcessExample({ teamId }: { teamId: string }) {
  const { mutateAsync: createProcess, isPending } = useCreateTeamProcess(teamId);

  const handleCreate = async () => {
    try {
      const newProcess = await createProcess({
        name: 'My New Process',
        description: 'Process description',
        activities: [
          {
            activityID: 'activity-1',
            activityType: 'task',
            properties: {
              activityPackage: 'google-workspace',
              serviceName: 'Gmail',
              activityName: 'Send Email',
              library: 'gmail',
              arguments: {},
              return: {},
            },
          },
        ],
        variables: {},
      });

      console.log('Created process:', newProcess);
    } catch (error) {
      console.error('Failed to create process:', error);
    }
  };

  return (
    <Button onClick={handleCreate} isLoading={isPending}>
      Create Process
    </Button>
  );
}

// ============================================================================
// EXAMPLE 8: Filter Connections by Provider
// ============================================================================

export function ConnectionsExample({ teamId }: { teamId: string }) {
  const [provider, setProvider] = useState<string>('');
  const { data: connections, isLoading } = useTeamConnections(teamId, provider || undefined);

  return (
    <div>
      <select value={provider} onChange={(e) => setProvider(e.target.value)}>
        <option value="">All Providers</option>
        <option value="gmail">Gmail</option>
        <option value="drive">Google Drive</option>
        <option value="sheets">Google Sheets</option>
      </select>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {connections?.map((conn: any) => (
            <li key={conn.connectionKey}>
              {conn.name} ({conn.provider})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * HOW TO USE THESE EXAMPLES:
 * 
 * 1. Copy the example you need
 * 2. Adapt it to your component
 * 3. Replace placeholder values (teamId, robotKey, etc.)
 * 4. Add your own UI styling
 * 5. Test with your backend API
 * 
 * For more details, see:
 * - TEAM_QUICK_START.md
 * - TEAM_FEATURES_IMPLEMENTATION.md
 */

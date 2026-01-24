import { ReactNode } from 'react';
import { Button, ButtonProps, Tooltip } from '@chakra-ui/react';
import { TeamMember, TeamPermission } from '@/types/team';
import { hasTeamPermission } from '@/utils/teamPermissions';

interface PermissionButtonProps extends ButtonProps {
  teamMember: TeamMember | null | undefined;
  requiredPermission: TeamPermission;
  children: ReactNode;
  tooltipMessage?: string;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  teamMember,
  requiredPermission,
  children,
  tooltipMessage,
  ...buttonProps
}) => {
  const hasPermission = hasTeamPermission(teamMember, requiredPermission);

  if (!hasPermission) {
    return (
      <Tooltip
        label={tooltipMessage || `You don't have '${requiredPermission}' permission`}
        placement="top"
      >
        <span>
          <Button {...buttonProps} isDisabled cursor="not-allowed">
            {children}
          </Button>
        </span>
      </Tooltip>
    );
  }

  return <Button {...buttonProps}>{children}</Button>;
};

interface PermissionWrapperProps {
  teamMember: TeamMember | null | undefined;
  requiredPermission: TeamPermission;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  teamMember,
  requiredPermission,
  children,
  fallback = null,
}) => {
  const hasPermission = hasTeamPermission(teamMember, requiredPermission);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

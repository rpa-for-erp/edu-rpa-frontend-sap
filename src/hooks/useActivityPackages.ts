/**
 * Hook to get activity packages with i18n support
 * This hook merges the base activity package data with translations
 */

import { useTranslation } from 'next-i18next';
import { ActivityPackages as BaseActivityPackages } from '@/constants/activityPackage';
import { useMemo } from 'react';

export interface ArgumentProps {
  type: string;
  keywordArg?: string;
  provider?: string;
  description?: string;
  value?: any;
  options?: Array<{ value: string; label: string }>;
}

export interface ActivityTemplate {
  templateId: string;
  displayName: string;
  description: string;
  iconCode: string;
  type: string;
  keyword: string;
  arguments?: Record<string, ArgumentProps>;
  return?: {
    displayName: string;
    type: string;
    description: string;
  };
}

export interface ActivityPackage {
  _id: string;
  displayName: string;
  description: string;
  library?: string;
  activityTemplates: ActivityTemplate[];
}

/**
 * Custom hook that provides activity packages with translations applied
 * @returns {ActivityPackage[]} Array of activity packages with translated content
 */
export const useActivityPackages = (): ActivityPackage[] => {
  const { t, i18n } = useTranslation('activities');
  const currentLocale = i18n.language;

  return useMemo(() => {
    return BaseActivityPackages.map((pkg) => ({
      ...pkg,
      // Translate package displayName and description
      displayName: t(`packages.${pkg._id}.displayName`, pkg.displayName),
      description: t(`packages.${pkg._id}.description`, pkg.description),
      activityTemplates: pkg.activityTemplates.map((template) => {
        const translatedTemplate: ActivityTemplate = {
          ...template,
          // Translate template displayName and description
          displayName: t(
            `templates.${template.templateId}.displayName`,
            template.displayName
          ),
          description: t(
            `templates.${template.templateId}.description`,
            template.description
          ),
        };

        // Translate arguments if they exist
        if (template.arguments) {
          translatedTemplate.arguments = Object.entries(
            template.arguments
          ).reduce(
            (acc, [key, argValue]) => {
              const typedArgValue = argValue as ArgumentProps;
              acc[key] = {
                ...typedArgValue,
                // Try to translate argument name (for display purposes)
                description: t(
                  `argumentDescriptions.${key}`,
                  typedArgValue.description || key
                ),
              };
              return acc;
            },
            {} as Record<string, ArgumentProps>
          );
        }

        // Translate return value if it exists
        if (template.return) {
          translatedTemplate.return = {
            ...template.return,
            displayName: t(
              `returns.${template.return.displayName}`,
              template.return.displayName
            ),
            description: t(
              `returnDescriptions.${template.return.displayName}`,
              template.return.description
            ),
          };
        }

        return translatedTemplate;
      }),
    }));
  }, [t, currentLocale]); // Re-compute when translation function or locale changes
};

/**
 * Get a specific activity package by ID with translations
 * @param packageId - The ID of the package to retrieve
 * @returns {ActivityPackage | undefined} The translated activity package or undefined
 */
export const useActivityPackage = (
  packageId: string
): ActivityPackage | undefined => {
  const packages = useActivityPackages();
  return useMemo(
    () => packages.find((pkg) => pkg._id === packageId),
    [packages, packageId]
  );
};

/**
 * Get a specific activity template by package ID and template ID with translations
 * @param packageId - The ID of the package
 * @param templateId - The ID of the template
 * @returns {ActivityTemplate | undefined} The translated activity template or undefined
 */
export const useActivityTemplate = (
  packageId: string,
  templateId: string
): ActivityTemplate | undefined => {
  const pkg = useActivityPackage(packageId);
  return useMemo(
    () => pkg?.activityTemplates.find((t) => t.templateId === templateId),
    [pkg, templateId]
  );
};

/**
 * Helper hook to get translated variable type names
 * @returns Function to translate variable types
 */
export const useVarTypeTranslation = () => {
  const { t } = useTranslation('activities');

  return (varType: string): string => {
    return t(`varTypes.${varType}`, varType);
  };
};

export default useActivityPackages;

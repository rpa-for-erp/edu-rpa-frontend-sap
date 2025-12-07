export interface Argument {
  id: string;
  name: string;
  description?: string;
  type: string;
  keywordArgument?: string;
  isRequired: boolean;
  defaultValue?: any;
}

export interface ReturnValue {
  id: string;
  type: string;
  description?: string;
  displayName?: string;
}

export interface ActivityTemplate {
  id: string;
  name: string;
  description?: string;
  keyword: string;
  arguments: Argument[];
  returnValue?: ReturnValue;
}

export interface ActivityPackage {
  id: string;
  displayName: string;
  description?: string;
  imageKey?: string;
  library?: string;
  version?: string;
  isActive: boolean;
  activityTemplates: ActivityTemplate[];
}

export interface TeamActivityPackage {
  id: string;
  teamId: string;
  activityPackageId: string;
  activityPackage?: ActivityPackage;
}

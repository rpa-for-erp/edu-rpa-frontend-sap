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


export interface ParsedKeyword {
  name: string;
  methodName: string;
  args: Array<{
    name: string;
    type?: string;
    default?: any;
  }>;
  docstring?: string;
  lineNumber: number;
}

export interface ParsedClass {
  name: string;
  methods: string[];
  initArgs: Array<{
    name: string;
    type?: string;
    default?: any;
  }>;
  docstring?: string;
}

export type ParseStatus = 'pending' | 'success' | 'failed' | 'not_applicable';

export interface ActivityPackage {
  id: string;
  name: string; // Internal name (e.g., rpa-erpnext)
  displayName: string;
  description?: string;
  imageKey?: string;
  version: string;
  isActive: boolean;
  
  // Legacy field
  library?: string;

  // Library File Info
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  s3Url?: string; // or libraryUrl
  checksum?: string;

  // Parsed Metadata
  parsedKeywords?: ParsedKeyword[];
  parsedClasses?: ParsedClass[];
  imports?: string[];
  
  // Status
  parseStatus?: ParseStatus;
  parseError?: string;

  activityTemplates: ActivityTemplate[];
  
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePackageRequest {
  file: File;
  name: string;
  displayName: string;
  version: string;
  description?: string;
}

export interface SuggestedTemplate {
  keywordName: string;
  displayName: string;
  inputSchema: Array<{
    name: string;
    type: string;
    required: boolean;
    default?: any;
    label: string;
  }>;
  description: string;
}

export enum AuthorizationProvider {
  G_DRIVE = 'Google Drive',
  G_SHEETS = 'Google Sheets',
  G_GMAIL = 'Gmail',
  G_DOCS = 'Google Docs',
  G_CLASSROOM = 'Google Classroom',
  G_FORMS = 'Google Forms',
  SAP_MOCK = 'SAP Mock',
  ERP_Next = 'ERP_Next',
  MOODLE = 'Moodle',
}

export interface WorkspaceConnection {
  provider: AuthorizationProvider;
  name: string;
  connectionKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConnectionDto {
  name: string;
  provider: AuthorizationProvider;
  accessToken: string;
  refreshToken: string;
}

export interface UpdateConnectionDto {
  accessToken?: string;
  refreshToken?: string;
}

export enum AuthorizationProvider {
  G_DRIVE = 'Google Drive',
  G_SHEETS = 'Google Sheets',
  G_GMAIL = 'Gmail',
  G_CLASSROOM = 'Google Classroom',
  G_FORMS = 'Google Forms',
  SAP_MOCK = 'SAP Mock',
  ERP_NEXT = 'ERP_Next',
}

export const AuthorizationProviderByActivityPackage = new Map<
  string,
  AuthorizationProvider
>([
  ['Google Drive', AuthorizationProvider.G_DRIVE],
  ['Google Sheet', AuthorizationProvider.G_SHEETS],
  ['Google Classroom', AuthorizationProvider.G_CLASSROOM],
  ['Google Form', AuthorizationProvider.G_FORMS],
  ['Gmail', AuthorizationProvider.G_GMAIL],
  ['SAP Mock', AuthorizationProvider.SAP_MOCK],
  ['ERP_Next', AuthorizationProvider.ERP_NEXT],
]);

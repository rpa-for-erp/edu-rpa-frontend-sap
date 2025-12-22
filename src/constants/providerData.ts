import { AuthorizationProvider } from '@/interfaces/enums/provider.enum';
import GoogleDriveIcon from '@/assets/images/services/icons8-google-drive-96.png';
import GmailIcon from '@/assets/images/services/icons8-gmail-96.png';
import GoogleSheetIcon from '@/assets/images/services/icons8-google-sheets-96.png';
import GoogleClassroomIcon from '@/assets/images/services/icons8-google-classroom-96.png';
import GoogleFormsIcon from '@/assets/images/services/icons8-google-forms-96.png';
import SAPMockIcon from '@/assets/images/services/sap.png';
import ERPNextIcon from '@/assets/images/packages/erpnext-icon.png';
import MoodleIcon from '@/assets/images/services/moodle-icon.jpeg';
import { StaticImageData } from 'next/image';

export const providerData: {
  name: AuthorizationProvider;
  slug: string;
  icon: StaticImageData;
}[] = [
  {
    name: AuthorizationProvider.G_DRIVE,
    slug: 'drive',
    icon: GoogleDriveIcon,
  },
  {
    name: AuthorizationProvider.G_GMAIL,
    slug: 'gmail',
    icon: GmailIcon,
  },
  {
    name: AuthorizationProvider.G_SHEETS,
    slug: 'sheets',
    icon: GoogleSheetIcon,
  },
  {
    name: AuthorizationProvider.G_CLASSROOM,
    slug: 'classroom',
    icon: GoogleClassroomIcon,
  },
  {
    name: AuthorizationProvider.G_FORMS,
    slug: 'forms',
    icon: GoogleFormsIcon,
  },
  {
    name: AuthorizationProvider.SAP_MOCK,
    slug: 'sap-mock',
    icon: SAPMockIcon,
  },

  {
    name: AuthorizationProvider.ERP_NEXT,
    slug: 'erpnext',
    icon: ERPNextIcon,
  },
  {
    name: AuthorizationProvider.MOODLE,
    slug: 'moodle',
    icon: MoodleIcon,
  },
];

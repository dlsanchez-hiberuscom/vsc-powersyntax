import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_RUNTIME_MAIL_CATEGORIES = [
  'Mail',
] as const;

export const PB_MANUAL_CORE_RUNTIME_MAIL_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'MailFileDescription', category: 'Mail', summary: 'Attachment file descriptor for the mail subsystem.' }),
  systemObjectDatatype({ name: 'MailMessage', category: 'Mail', summary: 'Mail message manipulable from runtime.' }),
  systemObjectDatatype({ name: 'MailRecipient', category: 'Mail', summary: 'Non-visual mail recipient.' }),
  systemObjectDatatype({ name: 'MailSession', category: 'Mail', summary: 'Runtime MAPI/SMTP mail session.' }),
  systemObjectDatatype({ name: 'MimeMessage', category: 'Mail', summary: 'MIME message manipulable from runtime.' }),
  systemObjectDatatype({ name: 'SMTPClient', category: 'Mail', summary: 'Non-visual SMTP client for programmatic email sending.' }),
];

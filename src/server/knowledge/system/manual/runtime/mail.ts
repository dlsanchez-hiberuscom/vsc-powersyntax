import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_RUNTIME_MAIL_CATEGORIES = [
  'Correo',
] as const;

export const PB_MANUAL_CORE_RUNTIME_MAIL_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'MailFileDescription', category: 'Correo', summary: 'Descriptor de archivo adjunto para el subsistema de correo.' }),
  systemObjectDatatype({ name: 'MailMessage', category: 'Correo', summary: 'Mensaje de correo manipulable desde el runtime.' }),
  systemObjectDatatype({ name: 'MailRecipient', category: 'Correo', summary: 'Destinatario de correo no visual.' }),
  systemObjectDatatype({ name: 'MailSession', category: 'Correo', summary: 'Sesión de correo MAPI/SMTP del runtime.' }),
  systemObjectDatatype({ name: 'MimeMessage', category: 'Correo', summary: 'Mensaje MIME manipulable desde el runtime.' }),
  systemObjectDatatype({ name: 'SMTPClient', category: 'Correo', summary: 'Cliente SMTP no visual para envío programático de correo.' }),
];
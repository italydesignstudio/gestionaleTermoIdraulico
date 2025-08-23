export interface User {
  utenteId: number;
  nome: string;
  cognome: string;
  email: string;
  ruolo: 'Operatore' | 'Amministratore';
  dataCreazione?: string;
  ultimoAccesso?: string;
}

export interface Cliente {
  clienteId: number;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  provenienzaContatto: ProvenienzaContatto;
  consensoPrivacy: boolean;
  consensoMarketing: boolean;
  note?: string;
  dataCreazione: string;
  dataModifica: string;
  utenteCreazione?: number;
  utenteModifica?: number;
  nomeUtenteCreazione?: string;
  cognomeUtenteCreazione?: string;
  nomeUtenteModifica?: string;
  cognomeUtenteModifica?: string;
}

export type ProvenienzaContatto = 
  | 'Passaparola' 
  | 'Google' 
  | 'Facebook' 
  | 'Instagram' 
  | 'Volantino' 
  | 'Giornale' 
  | 'Radio' 
  | 'TV' 
  | 'Sito web' 
  | 'Cliente esistente' 
  | 'Altro';

export type CategoriaPassword = 
  | 'Termoidraulica' 
  | 'Email' 
  | 'Software' 
  | 'PA_Fiscale' 
  | 'E-commerce' 
  | 'Servizi_Web' 
  | 'Fornitori' 
  | 'Bancario' 
  | 'Social' 
  | 'Altro';

export interface PasswordInfo {
  infoId: number;
  titolo: string;
  categoria?: CategoriaPassword;
  url?: string;
  username?: string;
  email?: string;
  password?: string;
  passwordMascherata?: string;
  codici?: string;
  descrizione?: string;
  note?: string;
  dataInserimento: string;
  dataModifica: string;
  utenteCreazione: number;
  utenteModifica?: number;
  nomeUtenteCreazione?: string;
  cognomeUtenteCreazione?: string;
  nomeUtenteModifica?: string;
  cognomeUtenteModifica?: string;
}

export interface PasswordInfoFormData {
  titolo: string;
  categoria?: CategoriaPassword;
  url?: string;
  username?: string;
  email?: string;
  password: string;
  codici?: string;
  descrizione?: string;
  note?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  details?: any[];
}

export interface PaginationInfo {
  current: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
  totalRecords: number;
}

export interface ClientiResponse {
  clienti: Cliente[];
  pagination: PaginationInfo;
  filters: {
    search: string;
    provenienzaContatto: string;
    consensoMarketing: string;
  };
}

export interface PasswordInfoResponse {
  passwordInfo: PasswordInfo[];
  pagination: PaginationInfo;
}

export interface StatsResponse {
  totaleClienti: number;
  provenienzaContatto: { provenienzaContatto: string; count: number }[];
  consensoMarketing: { tipo: string; count: number }[];
  andamentoMensile: { mese: string; count: number }[];
}

export interface ClienteFormData {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  provenienzaContatto: ProvenienzaContatto;
  consensoPrivacy: boolean;
  consensoMarketing: boolean;
  note?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  nome: string;
  cognome: string;
  email: string;
  password: string;
  ruolo?: 'Operatore' | 'Amministratore';
}

export interface SearchFilters {
  search?: string;
  provenienzaContatto?: string;
  consensoMarketing?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Nuove interfacce per documenti e comunicazioni
export interface DocumentoCliente {
  documentoId: number;
  clienteId: number;
  tipoDocumento: TipoDocumento;
  titolo: string;
  descrizione?: string;
  nomeFile: string;
  dimensioneFile: number;
  mimeType: string;
  dataCreazione: string;
  nomeUtenteCreazione: string;
  cognomeUtenteCreazione: string;
}

export type TipoDocumento = 
  | 'Fattura' 
  | 'Scontrino' 
  | 'Libretto' 
  | 'Preventivo' 
  | 'Contratto' 
  | 'Certificazione' 
  | 'Garanzia' 
  | 'Altro';

export interface ComunicazioneCliente {
  comunicazioneId: number;
  clienteId: number;
  tipoComunicazione: TipoComunicazione;
  oggetto?: string;
  contenuto: string;
  dataOra: string;
  statoLettura: boolean;
  priorita: Priorita;
  nomeUtenteCreazione: string;
  cognomeUtenteCreazione: string;
}

export type TipoComunicazione = 
  | 'Chiamata' 
  | 'WhatsApp' 
  | 'Email' 
  | 'SMS' 
  | 'Nota' 
  | 'Promemoria' 
  | 'Altro';

export type Priorita = 'Bassa' | 'Media' | 'Alta' | 'Urgente';

export interface ComunicazioneFormData {
  tipoComunicazione: TipoComunicazione;
  oggetto?: string;
  contenuto: string;
  priorita?: Priorita;
}

export interface DocumentoFormData {
  tipoDocumento: TipoDocumento;
  titolo: string;
  descrizione?: string;
  file: File;
}

// Interfacce per i links di azione
export interface WhatsAppLink {
  whatsappUrl: string;
  numeroTelefono: string;
  nomeCliente: string;
}

export interface CallLink {
  callUrl: string;
  numeroTelefono: string;
  nomeCliente: string;
}

export interface EmailLink {
  mailtoUrl: string;
  emailCliente: string;
  nomeCliente: string;
}

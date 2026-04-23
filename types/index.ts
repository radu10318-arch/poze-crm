// types/index.ts

export type ClientType = 'persoana_fizica' | 'companie'

export type LeadSource =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'google'
  | 'recomandare'
  | 'olx'
  | 'site'
  | 'alt_canal'

export type ClientTag =
  | 'nunta'
  | 'corporate'
  | 'recurent'
  | 'urgent'
  | 'recomandare'
  | 'premium'

export type PipelineStatus =
  | 'lead_nou'
  | 'in_discutie'
  | 'oferta_trimisa'
  | 'oferta_acceptata'
  | 'contract_semnat'
  | 'avans_primit'
  | 'programat'
  | 'eveniment_realizat'
  | 'editare_in_curs'
  | 'galerie_livrata'
  | 'finalizat'

export type PaymentStatus =
  | 'neplatit'
  | 'avans_platit'
  | 'partial'
  | 'achitat'

export type ServiceType =
  | 'nunta'
  | 'botez'
  | 'cununie_civila'
  | 'majorat'
  | 'petrecere_privata'
  | 'sedinta_foto'
  | 'corporate'
  | 'fotografie_produs'
  | 'imobiliare'

export type OfferStatus =
  | 'draft'
  | 'trimisa'
  | 'acceptata'
  | 'respinsa'
  | 'expirata'

export type PricingType = 'per_ora' | 'per_serviciu' | 'pachet_fix'

export type GalleryStatus = 'nelivrata' | 'in_editare' | 'livrata'

export type EventStatus = 'programat' | 'realizat' | 'anulat'

export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'alta'

export type TimelineEntryType =
  | 'client_creat'
  | 'lead_nou'
  | 'oferta_creata'
  | 'oferta_trimisa'
  | 'oferta_acceptata'
  | 'oferta_respinsa'
  | 'contract_incarcat'
  | 'contract_semnat'
  | 'avans_primit'
  | 'eveniment_programat'
  | 'data_modificata'
  | 'editare_inceput'
  | 'galerie_livrata'
  | 'plata_finala'
  | 'nota_adaugata'
  | 'pipeline_schimbat'

export type TaskType =
  | 'de_editat'
  | 'de_trimis_oferta'
  | 'de_cerut_avans'
  | 'de_livrat_galerie'
  | 'alt_task'

// ─── Database entities ───────────────────────────────────────────

export interface Client {
  id: string
  full_name: string
  phone: string
  email?: string
  city?: string
  address?: string
  client_type: ClientType
  company_name?: string
  billing_details?: string
  preferred_payment_method?: PaymentMethod
  lead_source?: LeadSource
  tags?: ClientTag[]
  pipeline_status: PipelineStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface ExtraOption {
  label: string
  price: number
}

export interface Offer {
  id: string
  client_id: string
  pricing_type: PricingType
  service_type: ServiceType
  description?: string
  duration_hours?: number
  base_price: number
  extra_options?: ExtraOption[]
  total_price: number
  status: OfferStatus
  valid_until?: string
  pdf_url?: string
  created_at: string
  updated_at: string
  client?: Client
}

export interface Event {
  id: string
  client_id: string
  offer_id?: string
  event_type: ServiceType
  date: string
  start_time: string
  end_time?: string
  location_primary: string
  location_secondary?: string
  estimated_persons?: number
  contact_person?: string
  contact_phone?: string
  special_requirements?: string
  logistics_notes?: string
  duration_estimated?: number
  delivery_deadline?: string
  status: EventStatus
  google_calendar_event_id?: string
  created_at: string
  updated_at: string
  client?: Client
}

export interface Payment {
  id: string
  client_id: string
  event_id?: string
  total_amount: number
  advance_amount?: number
  advance_paid_at?: string
  remaining_amount: number
  due_date?: string
  payment_method?: PaymentMethod
  status: PaymentStatus
  notes?: string
  created_at: string
  updated_at: string
  client?: Client
  records?: PaymentRecord[]
}

export interface PaymentRecord {
  id: string
  payment_id: string
  client_id: string
  amount: number
  paid_at: string
  method: PaymentMethod
  notes?: string
}

export interface PixiesetLink {
  id: string
  client_id: string
  event_id?: string
  link_url: string
  password?: string
  delivery_date?: string
  status: GalleryStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  client_id: string
  file_name: string
  file_url: string
  document_type: 'contract' | 'alt_document'
  uploaded_at: string
}

export interface TimelineEntry {
  id: string
  client_id: string
  entry_type: TimelineEntryType
  description: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface Task {
  id: string
  client_id: string
  task_type: TaskType
  title: string
  due_date?: string
  completed: boolean
  created_at: string
}

// ─── Dashboard stats ──────────────────────────────────────────────

export interface DashboardStats {
  lead_noi: number
  oferte_in_asteptare: number
  evenimente_viitoare: number
  plati_restante: number
  galerii_de_livrat: number
  clienti_activi: number
  venit_estimat: number
  venit_incasat: number
}

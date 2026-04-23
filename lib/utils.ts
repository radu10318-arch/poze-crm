// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import {
  PipelineStatus, OfferStatus, PaymentStatus,
  GalleryStatus, ServiceType, LeadSource
} from '@/types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' lei'
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric', month: 'short', year: 'numeric'
  }).format(new Date(dateStr))
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric', month: 'short'
  }).format(new Date(dateStr))
}

// ─── Pipeline ────────────────────────────────────────────────────

export const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  lead_nou: 'Lead nou',
  in_discutie: 'În discuție',
  oferta_trimisa: 'Ofertă trimisă',
  oferta_acceptata: 'Ofertă acceptată',
  contract_semnat: 'Contract semnat',
  avans_primit: 'Avans primit',
  programat: 'Programat',
  eveniment_realizat: 'Eveniment realizat',
  editare_in_curs: 'Editare în curs',
  galerie_livrata: 'Galerie livrată',
  finalizat: 'Finalizat',
}

export const PIPELINE_ORDER: PipelineStatus[] = [
  'lead_nou', 'in_discutie', 'oferta_trimisa', 'oferta_acceptata',
  'contract_semnat', 'avans_primit', 'programat', 'eveniment_realizat',
  'editare_in_curs', 'galerie_livrata', 'finalizat',
]

export const PIPELINE_COLORS: Record<PipelineStatus, string> = {
  lead_nou: 'bg-gray-100 text-gray-700',
  in_discutie: 'bg-blue-50 text-blue-700',
  oferta_trimisa: 'bg-amber-50 text-amber-700',
  oferta_acceptata: 'bg-amber-100 text-amber-800',
  contract_semnat: 'bg-green-50 text-green-700',
  avans_primit: 'bg-green-100 text-green-800',
  programat: 'bg-purple-50 text-purple-700',
  eveniment_realizat: 'bg-purple-100 text-purple-800',
  editare_in_curs: 'bg-orange-50 text-orange-700',
  galerie_livrata: 'bg-teal-50 text-teal-700',
  finalizat: 'bg-stone-100 text-stone-700',
}

// ─── Offer status ─────────────────────────────────────────────────

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  draft: 'Draft',
  trimisa: 'Trimisă',
  acceptata: 'Acceptată',
  respinsa: 'Respinsă',
  expirata: 'Expirată',
}

export const OFFER_STATUS_COLORS: Record<OfferStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  trimisa: 'bg-blue-50 text-blue-700',
  acceptata: 'bg-green-50 text-green-700',
  respinsa: 'bg-red-50 text-red-700',
  expirata: 'bg-stone-100 text-stone-600',
}

// ─── Payment status ───────────────────────────────────────────────

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  neplatit: 'Neplatit',
  avans_platit: 'Avans platit',
  partial: 'Partial',
  achitat: 'Achitat',
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  neplatit: 'bg-red-50 text-red-700',
  avans_platit: 'bg-amber-50 text-amber-700',
  partial: 'bg-amber-100 text-amber-800',
  achitat: 'bg-green-50 text-green-700',
}

// ─── Gallery status ───────────────────────────────────────────────

export const GALLERY_STATUS_LABELS: Record<GalleryStatus, string> = {
  nelivrata: 'Nelivrată',
  in_editare: 'În editare',
  livrata: 'Livrată',
}

export const GALLERY_STATUS_COLORS: Record<GalleryStatus, string> = {
  nelivrata: 'bg-gray-100 text-gray-600',
  in_editare: 'bg-blue-50 text-blue-700',
  livrata: 'bg-green-50 text-green-700',
}

// ─── Service types ────────────────────────────────────────────────

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  nunta: 'Nuntă',
  botez: 'Botez',
  cununie_civila: 'Cununie civilă',
  majorat: 'Majorat',
  petrecere_privata: 'Petrecere privată',
  sedinta_foto: 'Ședință foto',
  corporate: 'Corporate',
  fotografie_produs: 'Fotografie produs',
  imobiliare: 'Imobiliare / Airbnb',
}

// ─── Lead source ──────────────────────────────────────────────────

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  google: 'Google',
  recomandare: 'Recomandare',
  olx: 'OLX',
  site: 'Site',
  alt_canal: 'Alt canal',
}

// ─── Initials avatar ──────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

// ─── Timeline add helper ──────────────────────────────────────────

export function timelineDescription(
  type: string,
  meta?: Record<string, unknown>
): string {
  const map: Record<string, string> = {
    client_creat: 'Client creat',
    lead_nou: 'Lead nou adăugat',
    oferta_creata: 'Ofertă creată',
    oferta_trimisa: 'Ofertă trimisă clientului',
    oferta_acceptata: `Ofertă acceptată${meta?.amount ? ` · ${formatCurrency(meta.amount as number)}` : ''}`,
    oferta_respinsa: 'Ofertă respinsă',
    contract_incarcat: 'Contract încărcat',
    contract_semnat: 'Contract semnat',
    avans_primit: `Avans primit${meta?.amount ? ` · ${formatCurrency(meta.amount as number)}` : ''}`,
    eveniment_programat: `Eveniment programat${meta?.date ? ` · ${formatDate(meta.date as string)}` : ''}`,
    data_modificata: 'Dată eveniment modificată',
    editare_inceput: 'Galerie intrată în editare',
    galerie_livrata: 'Galerie livrată clientului',
    plata_finala: `Plată finală primită${meta?.amount ? ` · ${formatCurrency(meta.amount as number)}` : ''}`,
    nota_adaugata: 'Notă internă adăugată',
    pipeline_schimbat: `Status schimbat${meta?.to ? ` → ${PIPELINE_LABELS[meta.to as PipelineStatus]}` : ''}`,
  }
  return map[type] ?? type
}

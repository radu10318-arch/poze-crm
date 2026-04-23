import { cn } from '@/lib/utils'
import {
  PIPELINE_COLORS, PIPELINE_LABELS,
  OFFER_STATUS_COLORS, OFFER_STATUS_LABELS,
  PAYMENT_STATUS_COLORS, PAYMENT_STATUS_LABELS,
  GALLERY_STATUS_COLORS, GALLERY_STATUS_LABELS,
} from '@/lib/utils'
import type {
  PipelineStatus, OfferStatus, PaymentStatus, GalleryStatus
} from '@/types'

export function PipelineBadge({ status }: { status: PipelineStatus }) {
  return (
    <span className={cn('badge', PIPELINE_COLORS[status])}>
      {PIPELINE_LABELS[status]}
    </span>
  )
}

export function OfferBadge({ status }: { status: OfferStatus }) {
  return (
    <span className={cn('badge', OFFER_STATUS_COLORS[status])}>
      {OFFER_STATUS_LABELS[status]}
    </span>
  )
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={cn('badge', PAYMENT_STATUS_COLORS[status])}>
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  )
}

export function GalleryBadge({ status }: { status: GalleryStatus }) {
  return (
    <span className={cn('badge', GALLERY_STATUS_COLORS[status])}>
      {GALLERY_STATUS_LABELS[status]}
    </span>
  )
}

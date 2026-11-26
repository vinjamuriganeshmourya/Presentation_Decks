import { Illustration } from '@/ui/characters/Illustration'
import type { SlideMedia } from './types'

/** Renders a SlideMedia (real image asset OR a built-in illustration). */
export function Media({ media, className = '' }: { media: SlideMedia; className?: string }) {
  if ('illustration' in media) {
    return <Illustration name={media.illustration} className={className} />
  }
  return (
    <img
      src={media.src}
      alt={media.alt ?? ''}
      className={className}
      style={{ objectFit: media.fit ?? 'cover' }}
      draggable={false}
    />
  )
}

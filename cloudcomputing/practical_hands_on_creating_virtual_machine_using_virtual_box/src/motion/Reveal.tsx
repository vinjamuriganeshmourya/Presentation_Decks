import { motion } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'
import {
  revealVariants,
  staggerContainer,
  type RevealDirection,
} from './presets'
import { useInstant } from './instant'

/**
 * <RevealGroup> + <Reveal> — declarative staggered entrance animations.
 *
 * Wrap a region in <RevealGroup> and each direct <Reveal> child animates
 * in sequence when the slide becomes active. Because the deck remounts
 * each slide on navigation, these fire every time a slide is shown.
 *
 *   <RevealGroup>
 *     <Reveal><h2>Title</h2></Reveal>
 *     <Reveal dir="left" delay={0.1}><p>Body</p></Reveal>
 *   </RevealGroup>
 */

export function RevealGroup({
  children,
  className,
  style,
  stagger = 0.09,
  delayChildren = 0.12,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  stagger?: number
  delayChildren?: number
  as?: 'div' | 'ul' | 'ol' | 'section'
}) {
  const MotionTag = motion[as]
  const instant = useInstant()
  return (
    <MotionTag
      className={className}
      style={style}
      variants={staggerContainer(stagger, delayChildren)}
      // On an instant jump, mount straight at the final state (no entrance
      // stagger). initial={false} propagates to the <Reveal> children too.
      initial={instant ? false : 'hidden'}
      animate="show"
    >
      {children}
    </MotionTag>
  )
}

export function Reveal({
  children,
  dir = 'up',
  className,
  style,
  delay,
  as = 'div',
}: {
  children: ReactNode
  dir?: RevealDirection
  className?: string
  style?: CSSProperties
  /** Optional extra delay layered on top of the group stagger. */
  delay?: number
  as?: 'div' | 'li' | 'span' | 'section' | 'p' | 'h1' | 'h2'
}) {
  const MotionTag = motion[as]
  return (
    <MotionTag
      className={className}
      style={style}
      variants={revealVariants(dir)}
      transition={delay !== undefined ? { delay } : undefined}
    >
      {children}
    </MotionTag>
  )
}

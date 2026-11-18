import type { ComponentProps } from 'react'
import { ThreeStage as EngineStage, castSprite as engineSprite } from '@/engine/three-stage'

/**
 * SESSION 9'S 3D STAGE IS THE ENGINE'S, WITH THIS SESSION'S TWO CHOICES (2026-11-13, low-end pass).
 *
 * This file was the stage itself: Session 9 wrote it, the engine's `@/engine/three-stage` was promoted from it on
 * 2026-11-10, and this deck kept its own frozen copy. The copy drew every scene with one shared renderer and copied
 * the pixels onto a 2D canvas each frame (which parks the main thread on the GPU), and built every Character Lab
 * frame in one burst at mount. The engine no longer does either, so the copy is gone and every figure in this
 * folder (`h`, `i`, `i2`, `j`, `k`, `c`) still imports from here, unchanged, and gets the engine's stage.
 *
 * What was this session's own, and still is (user, 2026-11-10: "it need to be dynamic, not fixed on one resolution,
 * it need to adapt to the screen size"):
 *   - the canvas is sized to the screen's real device pixels and no more   -> `sizing="screen"`
 *   - a person's frames are built at the size the person is drawn at        -> `adaptive: true`
 * Both are options of the engine now; the pictures are the same.
 */
export * from '@/engine/three-stage'

export function ThreeStage(p: Omit<ComponentProps<typeof EngineStage>, 'sizing'>) {
  return <EngineStage {...p} sizing="screen" />
}

export const castSprite = (o: Parameters<typeof engineSprite>[0]) => engineSprite({ ...o, adaptive: true })

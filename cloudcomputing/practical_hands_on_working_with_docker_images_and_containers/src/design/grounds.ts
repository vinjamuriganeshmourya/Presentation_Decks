/**
 * THE TWO DARK GROUNDS AS CSS — live, editable, no bitmaps.
 *
 * Each is a stack of radial-gradients over a base colour, FITTED to the
 * reference background layer (blurred to strip its grain) by least squares
 * with `scripts/fit-grounds.py`: every centre, radius, colour and alpha below
 * is the optimiser's answer, not a guess. The 5-stop alpha profile
 * (1 / .78 / .37 / .10 / 0 at 0 / 25 / 50 / 75 / 100%) is the same in the fit
 * and in the CSS, so the browser draws what was fitted. Layers are listed
 * top-first, the way CSS stacks them.
 *
 * Fit error against the de-grained reference, in 8-bit levels:
 *   mesh      16 layers: rmse 5.0, mean 3.5, 99th percentile 16.8
 *   gradient   6 layers: rmse 1.9, mean 1.5, 99th percentile 6.1
 * The mesh's residual sits on the rim of its dark pool, where a Figma mesh
 * turns harder than a radial falloff can.
 */

/** Welcome / next-session mesh. */
export const MESH_GROUND = [
  'radial-gradient(560px 275px at 72px 1066px, rgba(0,0,89,1.000) 0%, rgba(0,0,89,0.780) 25%, rgba(0,0,89,0.370) 50%, rgba(0,0,89,0.100) 75%, rgba(0,0,89,0.000) 100%)',
  'radial-gradient(424px 165px at 1298px 126px, rgba(255,236,252,0.466) 0%, rgba(255,236,252,0.364) 25%, rgba(255,236,252,0.173) 50%, rgba(255,236,252,0.047) 75%, rgba(255,236,252,0.000) 100%)',
  'radial-gradient(340px 505px at 258px -86px, rgba(0,57,182,0.799) 0%, rgba(0,57,182,0.623) 25%, rgba(0,57,182,0.295) 50%, rgba(0,57,182,0.080) 75%, rgba(0,57,182,0.000) 100%)',
  'radial-gradient(343px 204px at 1567px 246px, rgba(86,143,255,1.000) 0%, rgba(86,143,255,0.780) 25%, rgba(86,143,255,0.370) 50%, rgba(86,143,255,0.100) 75%, rgba(86,143,255,0.000) 100%)',
  'radial-gradient(372px 764px at 1950px 693px, rgba(3,57,255,0.752) 0%, rgba(3,57,255,0.586) 25%, rgba(3,57,255,0.278) 50%, rgba(3,57,255,0.075) 75%, rgba(3,57,255,0.000) 100%)',
  'radial-gradient(572px 193px at 1384px 190px, rgba(0,143,255,1.000) 0%, rgba(0,143,255,0.780) 25%, rgba(0,143,255,0.370) 50%, rgba(0,143,255,0.100) 75%, rgba(0,143,255,0.000) 100%)',
  'radial-gradient(432px 742px at 525px 276px, rgba(219,223,255,0.433) 0%, rgba(219,223,255,0.338) 25%, rgba(219,223,255,0.160) 50%, rgba(219,223,255,0.043) 75%, rgba(219,223,255,0.000) 100%)',
  'radial-gradient(854px 466px at 1116px 1152px, rgba(11,255,255,0.426) 0%, rgba(11,255,255,0.332) 25%, rgba(11,255,255,0.158) 50%, rgba(11,255,255,0.043) 75%, rgba(11,255,255,0.000) 100%)',
  'radial-gradient(752px 423px at 1451px 774px, rgba(0,0,0,0.486) 0%, rgba(0,0,0,0.379) 25%, rgba(0,0,0,0.180) 50%, rgba(0,0,0,0.049) 75%, rgba(0,0,0,0.000) 100%)',
  'radial-gradient(360px 396px at 48px 906px, rgba(0,0,136,1.000) 0%, rgba(0,0,136,0.780) 25%, rgba(0,0,136,0.370) 50%, rgba(0,0,136,0.100) 75%, rgba(0,0,136,0.000) 100%)',
  'radial-gradient(683px 415px at 1154px 543px, rgba(0,0,92,1.000) 0%, rgba(0,0,92,0.780) 25%, rgba(0,0,92,0.370) 50%, rgba(0,0,92,0.100) 75%, rgba(0,0,92,0.000) 100%)',
  'radial-gradient(690px 344px at 801px 90px, rgba(124,204,252,1.000) 0%, rgba(124,204,252,0.780) 25%, rgba(124,204,252,0.370) 50%, rgba(124,204,252,0.100) 75%, rgba(124,204,252,0.000) 100%)',
  'radial-gradient(463px 2300px at 747px 57px, rgba(63,169,249,1.000) 0%, rgba(63,169,249,0.780) 25%, rgba(63,169,249,0.370) 50%, rgba(63,169,249,0.100) 75%, rgba(63,169,249,0.000) 100%)',
  'radial-gradient(755px 292px at 1250px 59px, rgba(0,134,255,1.000) 0%, rgba(0,134,255,0.780) 25%, rgba(0,134,255,0.370) 50%, rgba(0,134,255,0.100) 75%, rgba(0,134,255,0.000) 100%)',
  'radial-gradient(424px 321px at 1762px 396px, rgba(50,98,255,1.000) 0%, rgba(50,98,255,0.780) 25%, rgba(50,98,255,0.370) 50%, rgba(50,98,255,0.100) 75%, rgba(50,98,255,0.000) 100%)',
  'radial-gradient(969px 1190px at 543px 361px, rgba(0,191,246,0.766) 0%, rgba(0,191,246,0.598) 25%, rgba(0,191,246,0.284) 50%, rgba(0,191,246,0.077) 75%, rgba(0,191,246,0.000) 100%)',
  '#0000C5',
].join(', ')

/** Closing gradient (thank you, all the best, section breaker). */
export const GRADIENT_GROUND = [
  'radial-gradient(614px 1179px at 1666px 721px, rgba(49,54,233,0.432) 0%, rgba(49,54,233,0.337) 25%, rgba(49,54,233,0.160) 50%, rgba(49,54,233,0.043) 75%, rgba(49,54,233,0.000) 100%)',
  'radial-gradient(2137px 553px at 267px 997px, rgba(86,141,244,1.000) 0%, rgba(86,141,244,0.780) 25%, rgba(86,141,244,0.370) 50%, rgba(86,141,244,0.100) 75%, rgba(86,141,244,0.000) 100%)',
  'radial-gradient(874px 617px at 1565px 1091px, rgba(253,255,255,0.942) 0%, rgba(253,255,255,0.734) 25%, rgba(253,255,255,0.348) 50%, rgba(253,255,255,0.094) 75%, rgba(253,255,255,0.000) 100%)',
  'radial-gradient(1212px 539px at 855px 825px, rgba(92,140,246,0.999) 0%, rgba(92,140,246,0.780) 25%, rgba(92,140,246,0.370) 50%, rgba(92,140,246,0.100) 75%, rgba(92,140,246,0.000) 100%)',
  'radial-gradient(2854px 1324px at 1398px 1038px, rgba(61,71,252,1.000) 0%, rgba(61,71,252,0.780) 25%, rgba(61,71,252,0.370) 50%, rgba(61,71,252,0.100) 75%, rgba(61,71,252,0.000) 100%)',
  'radial-gradient(3986px 822px at 246px -112px, rgba(23,22,158,0.891) 0%, rgba(23,22,158,0.695) 25%, rgba(23,22,158,0.330) 50%, rgba(23,22,158,0.089) 75%, rgba(23,22,158,0.000) 100%)',
  '#1F27EE',
].join(', ')

import { Globe, LayoutGrid, ShieldCheck, Signpost } from 'lucide-react'
import { BOX_W, Card, STILL, useBuild } from '../scene'
import { CvIcon, LitPoints, fx } from './fx'
import { useHeld } from './vpc-kit'

/**
 * T03-2 · FOUR PARTS OF A VPC (round 2, FS review 2026-11-04: "remove the excess
 * empty space, the private subnet holds only one icon; reduce the illustration
 * slightly; every point within two lines").
 *
 * The points column is wider (510) so the third point fits two lines; the
 * drawing is this section's own at 576 x 340 (the shared `BigVpc` is 634 wide and
 * cannot shrink without shrinking its labels under 14px). Each subnet now holds
 * two things: the public one its instance and the NAT gateway, the private one
 * its instance and a database. The VPC rim is a thin dashed line, the locks sit
 * inside their subnets' corners, the Internet Gateway label beside its disc.
 *
 * Round 3 (user, 2026-11-05: "remove the right side content; add a human
 * illustration of a person explaining"): the VPC drawing is gone. The four points
 * stand on the left, wider, and a presenter from the 3D people library
 * (`assets/icons/Icons/Male Presenter/Explanation Icon-1.png`, trimmed to
 * `icons/vpc-explainer.png`, R7.1) stands on the right, both hands open towards
 * them. He moves only as a whole image, a slow quiet lift (as the guard on T03-AN).
 *
 * Build (`useBuild`, one press each with auto animation off; the press count is
 * unchanged): 0 the points, none lit; 1-4 the points lit one by one.
 */

const T032_POINTS = [
  { icon: <LayoutGrid size={20} />, text: 'Subnets divide the VPC into smaller address blocks for grouping resources' },
  { icon: <Signpost size={20} />, text: 'Route tables decide where traffic leaving each subnet is sent next' },
  { icon: <Globe size={20} />, text: 'Gateways, such as an internet gateway or NAT gateway, connect the VPC to outside networks' },
  { icon: <ShieldCheck size={20} />, text: 'Security groups and network ACLs filter traffic allowed in or out of resources' },
]

const POINTS_W = 770
const PERSON_W = 196 // the render's own aspect (178 x 311): about 342px tall
const PERSON_AREA = BOX_W - POINTS_W - 24

/** The presenter on a soft floor shadow, turned towards the points. */
function Explainer({ run }: { run: boolean }) {
  const f = fx('lift', 0, 3.4)
  return (
    <div className="relative flex shrink-0 flex-col items-center justify-end" style={{ width: PERSON_AREA }}>
      <span className={`relative z-[1] block ${run ? f.className : ''}`} style={run ? f.style : undefined}>
        <CvIcon name="vpc-explainer" w={PERSON_W} style={{ filter: 'drop-shadow(0 10px 10px rgba(16,32,58,0.18))' }} />
      </span>
      <span aria-hidden className="-mt-[10px] block rounded-[50%]" style={{ width: PERSON_W * 0.9, height: 18, background: 'radial-gradient(closest-side, rgba(16,32,58,0.22), rgba(16,32,58,0))' }} />
    </div>
  )
}

export function FourParts({ lesson }: { lesson: string }) {
  const held = useHeld()
  const k = useBuild(5, 1100)
  const lit = held ? -1 : k - 1
  return (
    <Card id="T03-2" kicker="What Is A VPC" title="The Private Boundary" lesson={lesson}>
      <div className="flex items-center" style={{ width: BOX_W, gap: 24 }}>
        <LitPoints items={T032_POINTS} lit={lit} width={POINTS_W} />
        <Explainer run={!held && !STILL} />
      </div>
    </Card>
  )
}

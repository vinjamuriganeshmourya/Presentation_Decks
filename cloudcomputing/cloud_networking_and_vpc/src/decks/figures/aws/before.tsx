import { Laptop, Lock, MessageSquare, ShieldCheck, Smartphone, type LucideIcon } from 'lucide-react'
import { DataTable, StatusList } from '@/ui'
import { BOX_W, Card } from '../scene'

/**
 * Slides 5, 6 and 25 of session 3: the three frames that are not screenshot walkthroughs. Every string
 * is the reference's.
 */

const NEED: { icon: LucideIcon; title: string; sub: string }[] = [
  { icon: Laptop, title: 'Laptop with internet', sub: 'Chrome or Edge browser' },
  { icon: MessageSquare, title: 'Email you can open now', sub: 'AWS sends a code to it' },
  { icon: Smartphone, title: 'Your mobile phone', sub: 'For OTP and SMS codes' },
  { icon: ShieldCheck, title: 'ID proof: Aadhaar or PAN card', sub: 'Name must match what you type' },
  { icon: Lock, title: 'UPI app or a debit or credit card', sub: 'With at least ₹2 in the account' },
]

/** 5 · What You Need: five things, each with its icon and one line, the AWS mark beside them. */
export function WhatYouNeed({ lesson }: { lesson: string }) {
  return (
    <Card id="what-you-need" kicker="Before You Start" title="What You Need" lesson={lesson}>
      <div className="flex items-center justify-between" style={{ width: BOX_W }}>
        <ul className="m-0 flex list-none flex-col gap-[22px] p-0">
          {NEED.map(({ icon: Icon, title, sub }) => (
            <li key={title} className="flex items-start gap-4">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand" aria-hidden>
                <Icon size={19} strokeWidth={2} />
              </span>
              <span className="flex flex-col">
                <span className="text-[22px] font-medium leading-snug text-ink">{title}</span>
                <span className="text-[17px] leading-snug text-ink/80">{sub}</span>
              </span>
            </li>
          ))}
        </ul>
        <img src="/assets/tech/aws.png" alt="AWS" draggable={false} className="mr-[110px] h-auto w-[190px] select-none" />
      </div>
    </Card>
  )
}

const COLS = [{ label: 'Option' }, { label: 'What you need', weight: 1.6 }]

/**
 * 6 · Keep These Ready. The user (2026-10-26): the reference's one table becomes TWO, side by side,
 * Aadhaar and UPI in the first and PAN and Card in the second, equal in width and height.
 */
export function KeepReady({ lesson }: { lesson: string }) {
  const one = [
    [<b className="font-semibold">Aadhaar (ID)</b>, 'DigiLocker login, with the mobile number linked to Aadhaar'],
    [<b className="font-semibold">UPI (payment)</b>, 'UPI app on your phone to scan a QR code'],
  ]
  const two = [
    [<b className="font-semibold">PAN card (ID)</b>, 'PAN number and a clear photo of the PAN card front'],
    [<b className="font-semibold">Card (payment)</b>, 'Debit or credit card, its CVV and the bank OTP'],
  ]
  return (
    <Card id="keep-ready" kicker="Before You Start" title="Keep These Ready" lead="Pick one ID proof and one payment method" lesson={lesson}>
      {/* two equal columns; `items-stretch` and `h-full` give both tables the taller one's height */}
      <div className="grid grid-cols-2 items-stretch gap-6" style={{ width: BOX_W }}>
        {[one, two].map((rows, i) => (
          <div key={i} className="flex [&>*]:h-full [&>*]:w-full" data-keep-table={i}>
            <DataTable columns={COLS} rows={rows} />
          </div>
        ))}
      </div>
    </Card>
  )
}

/** 25 · Stop AutoPay Later: the reference's three verdict rows, Note, Fails, Works. */
export function StopAutoPay({ lesson }: { lesson: string }) {
  return (
    <Card id="stop-autopay" kicker="Payment and First Login" title="Stop AutoPay Later" lesson={lesson}>
      <div style={{ width: BOX_W }}>
        <StatusList
          immediate
          items={[
            { status: 'info', text: 'AutoPay stays on after the ₹2 check', detail: 'AWS can take money from your bank through it' },
            { status: 'error', text: 'Cancel it after 2 to 3 days', detail: 'Or money may be cut from your account' },
            { status: 'success', text: 'How: UPI app, AutoPay, AWS, Cancel', detail: 'Some apps call it Mandates' },
          ]}
        />
      </div>
    </Card>
  )
}

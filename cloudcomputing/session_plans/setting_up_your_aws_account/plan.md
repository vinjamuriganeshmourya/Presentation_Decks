# Setting Up Your AWS Account · slide-wise plan

STATUS: signed off on the user's word, 2026-10-26 (the request is the spec: rebuild the reference in the
course template with the listed global and per-slide changes; plan and execute in one run, as session 2).

- **Session:** cloud computing session 3, `Outputs/cloudcomputing/setting_up_your_aws_account/`, port 5272.
- **Source:** `Reference ppt's/setting-up-your-aws-account 1.html`, 34 frames, a kit-built deck. Content
  and order are the reference's, verbatim. Rendered and dumped first (text, per-step crop and highlight
  ring of every screenshot walkthrough, the screenshots themselves).
- **Template:** a copy of session 2 (course rule R2): the cloud player (no builds, `revealEveryStep`,
  smooth transitions, hidden step/slide switch, presenter and student views, comments), session 1's `Card`
  frame and entrance layer.

## Global rules (the user's)

1. No Autoplay button and no Next button anywhere.
2. Every slide plays by itself: a screenshot walkthrough cycles through its states on a clock
   (overview, then each highlighted field), with no control to advance it.
3. Motion is subtle: fades and gentle pans on the house curve `[0.22, 1, 0.36, 1]`, ~0.9s, nothing bouncy.
4. Where something is removed, the rest reflows: no reserved empty slots.

## Walkthrough frame (slides 8-12, 14-19, 21-24, 26-28)

Left: the browser card (dots, the reference's URL, the screenshot at the reference's crop size). Right:
the step chip, the numbered steps, then the step callouts STACKED (all visible; the one for the state on
screen is emphasised in amber, the others muted), then the tip callout (kit `Callout`). Stacking, rather
than the reference's one swapping slot, is what lets a removed callout leave no gap (rule 4). Each state's
crop zooms the screenshot (transform only) and rings the field in amber, dimming the rest.

## Slides

| # | id | Frame | Changes |
|---|---|---|---|
| 1 | brand | BrandSlide "Welcome!" | |
| 2 | welcome | WelcomeSlide, minimal | |
| 3 | agenda | AgendaSlide, four titles | |
| 4 | s1 | Breaker: Before You Start | |
| 5 | what-you-need | Card: five icon rows + AWS mark | |
| 6 | keep-ready | Card: lead + TWO tables side by side | **Split:** Aadhaar + UPI, then PAN + Card; equal width and height |
| 7 | s2 | Breaker: Account Sign-Up | |
| 8 | open-aws | Walkthrough | |
| 9 | email | Walkthrough | **Removed** the "Continue / Click after typing the email" callout and the "Use your own email / One you can open right now" tip |
| 10 | name | Walkthrough | |
| 11 | verify-email | Walkthrough | |
| 12 | password | Walkthrough | |
| 13 | s3 | Breaker: Details and Identity | |
| 14 | contact | Walkthrough, STATIC | **Step 1 only:** the full screenshot and the three steps; no highlight, no later callouts |
| 15 | purpose | Walkthrough | |
| 16 | aadhaar | Walkthrough | |
| 17 | digilocker | Walkthrough, FULL IMAGE | **No pan or zoom:** full screenshot throughout, the ring moves between the two fields |
| 18 | pan | Walkthrough, FULL IMAGE | as 17 |
| 19 | console-ready | Walkthrough | |
| 20 | s4 | Breaker: Payment and First Login | |
| 21 | plan | Walkthrough | |
| 22 | payment-method | Walkthrough | **Removed** the "Credit or debit card / Your bank sends an OTP" callout |
| 23 | two-rupees | Walkthrough | |
| 24 | scan-qr | Walkthrough | |
| 25 | stop-autopay | Card: StatusList (Note, Fails, Works) | |
| 26 | sign-in | Walkthrough | |
| 27 | console | Walkthrough | |
| 28 | sign-out | Walkthrough | |
| 29 | quiz | ClassroomQuiz | |
| 30 | takeaways | Takeaways, four titles | |
| 31 | next-session | NextSessionSlide "Next Cloud Computing Session" | |
| 32 | feedback | FeedbackSlide (content rule 41) | |
| 33 | thank-you | ThankYouSlide | |
| 34 | all-the-best | ThankYouSlide "All the Best" | |

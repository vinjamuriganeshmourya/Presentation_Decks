# Load Balancing & CDN · slide-wise plan

STATUS: signed off on the user's word, 2026-11-05 (the request is the spec: "a complete deck generated through the
engine", every TR string verbatim, split rather than trimmed, Version 1 as the visual reference, built by several
agents). Same precedent as session 5's plan.

- **Session:** cloud computing session 6, `Outputs/cloudcomputing/load_balancing_and_cdn/`, the first deck built
  with `deck-engine/` (`node deck.mjs build|check ../Outputs/cloudcomputing/load_balancing_and_cdn`). Dev port 5276.
- **Source (content):** `Reference ppt's/6. Load Balancing & CDN.pdf`, extracted to `tr.txt` beside this plan.
  TR slide N is "TR N" below. The TR has no slide 12 (it jumps 11 → 13); nothing is missing from the text.
- **Visual reference:** `Reference ppt's/load-balancing-and-cdn (1).html` (Version 1, 68 frames). Its layouts are
  reused where they suit; its wording is NOT (it shortened several leads and points: the TR wins).
- **Screenshots:** the eight practical captures in the TR PDF (pages 19-21), extracted unchanged to `captures/`,
  served from a 2x Lanczos + light unsharp copy in `images/` (course R4). The five TR diagrams (pages 2, 8, 9, 15:
  LB fan-out, RR, WRR, LC, CDN map) are redrawn in engine parts, never pasted.

## Text policy (binding on every builder)

1. **Words are the TR's, exactly.** Kicker = the TR `Heading`, title = the TR `Subheading` (as Version 1 and sessions
   1-5). The TR `Content` paragraph is the `lead`; bullets are points/steps/cards; tables are tables.
2. **Allowed edits are punctuation and layout only:** a spaced em dash ` — ` becomes `: ` (content rule 1); no full
   stop ends a line (rule 36); a line holding two sentences is two lines/points; first letter capitalised (R8.4);
   the TR's typographic wrapping quotes on TR 20 are dropped. Nothing reworded, shortened, merged or added.
3. **Too long → split.** A point beside a figure may take 2 lines (R7 check). A longer point is cut at the TR's
   own sentence or clause boundary (course R7, user 2026-11-04); a slide with too much is two slides with the same
   kicker and title.
4. **Speaker Notes → `notes`** of the slide(s) that carry that TR slide, verbatim. **Analogy → the analogy slide**:
   R3 forbids a sentence on an analogy slide, so every clause of the TR analogy is a tag inside the picture it
   describes, in the TR's own words (course lesson 2), and the full analogy sentence is in that slide's `notes`.
5. **Visual Guidance is the figure spec**, drawn as described (course lesson 3), not printed. Labels in a figure use
   only words the TR gives (this slide, its Visual Guidance, its notes, or names elsewhere in the TR) plus plain
   part names (`User`, `Server 1`, `Load Balancer`). No invented sentence, number, price or address.
6. **Hard rules that override "verbatim", flagged to the user:**
   - Rule 2b (never name another session): TR 24 step 1 "Verify the Session 5 VPC, subnets, and route table…" is
     shown as "Verify the VPC, subnets, and route table…"; the TR line is kept in `notes`.
   - Course R5: recap, agenda and Key Takeaways carry the five titles only; the sub lines stay in the source.
   - The stray editor's word `replace` in TR 19 (line above the bullets) is not slide content and is left out.
   - Rule 41 retired: no feedback slide (Version 1 had one).

## Labs (visual building blocks) used, so no slide repeats the one before it

points + diagram · lead + diagram · table (VisualTable) · analogy (IsoAnalogy, realistic 3D people, R7.1) ·
steps (ticked lab steps) · screenshot (one sharp capture + orange rings, R7.9) · card grids / timelines / sequence
strips / counters as custom figures built from the session 1-5 libraries (`src/decks/figures/*`).

## Deck (≈ 70 frames)

Opening (builder A)
| id | layout | content |
|---|---|---|
| S-WELCOME | brand | |
| S-TITLE | title | Load Balancing & CDN |
| S-RECAP | recap | previous: Cloud Networking & VPC; five titles |
| S-AGENDA | agenda | five titles |

Section 1 · Load Balancing Basics (builder A)
| id | layout | TR | content and figure |
|---|---|---|---|
| D1 | breaker 1 | | |
| T01 | points | 1 | lead: the two Content sentences (two lines); 4 points; figure: left one browser → one server with a red cross; right the same browser → two servers, one still green (Visual Guidance) |
| T01-AN | analogy | 1 | (builder F) one ticket counter at a railway station, closed for a break, passengers waiting ↔ one server failed, every user's request has no route. Tags from the TR clauses |
| T02 | lead | 2 | lead: the definition; figure: Users → Website → Load Balancer fanning to Server 1-3, top arrow labelled `incoming requests` (redraw of TR image p2) |
| T02-B | points | 2 | points 1-3 (identical servers, adding/removing, Elastic Load Balancing from the EC2 console); figure: ELB inside the EC2 console with a pool that grows/shrinks |
| T02-C | points | 2 | points 4-5 (ALB billed hourly plus traffic processed; choosing a type is also a cost decision); figure: an ALB with an hourly meter and a traffic meter |
| T03 | points | 3 | lead; 4 points; figure: timeline, two servers growing to four behind the same LB icon, a small cost tag beside the fourth |

Section 2 · Load Balancer Types (builder A)
| id | layout | TR | content and figure |
|---|---|---|---|
| D2 | breaker 2 | | |
| T04 | points | 4 | lead; points: layer axis, internet-facing, internal; figure: 2x2 grid (rows Layer 4 / Layer 7, columns Internet-facing / Internal), each cell a typical use case in TR words (TR 5 notes: raw TCP/UDP speed; TR 7: public websites, internal calls; TR 6: an application calling a backend service) |
| T04-B | lead | 4 | lead: "A real deployment picks one from each axis…"; figure: card row hardware appliance / software (NGINX, HAProxy) / cloud-managed (AWS ELB, "this session focuses on cloud-managed" as the TR's last clause) carrying the "By deployment" point split at its clauses |
| T05 | lead | 5 | lead (both sentences, two lines); figure: side-by-side packets, Layer 4 arrow passing through unopened, Layer 7 arrow opened to show HTTP headers before forwarding |
| T05-B | table | 5 | the 5-row Aspect / Layer 4 / Layer 7 table, verbatim, no highlight |
| T06 | points | 6 | lead; 3 points; figure: public internet arrow → internet-facing balancer with a public IP; a second balancer inside the VPC boundary reached only by internal arrows |
| T06-AN | analogy | 6 | (builder F) office building: public reception desk anyone off the street can walk into, staff-only corridors for employees already inside ↔ internet-facing balancer accepts any public visitor, internal balancer only traffic from inside the VPC |
| T07 | lead | 7 | lead; figure: public internet → internet-facing ALB → service tier → internal NLB → database tier |
| T07-B | points | 7 | 4 points; figure: listener (HTTP:80) → target group of backend servers sharing one health check |
| S-QUIZ1 | quiz | | mid-deck quiz frame after the axes (content rule 18) |

Section 3 · Distribution Algorithms (builder B)
| id | layout | TR | content and figure |
|---|---|---|---|
| D3 | breaker 3 | | |
| T08 | lead | 8 | lead: first two sentences (rule, static vs dynamic); figure: static (fixed rule, ignores load) vs dynamic (checks live state) |
| T08-B | points | 8 | lead: "Many variations exist, but four are used most widely"; 4 points; figure: four-quadrant, LB in the centre, one arrow style per algorithm (cyclic, counter-based, hash-based, weighted) |
| T09 | lead | 9 | lead sentence 1; figure: redraw TR p8 top: User 1-3 → LB Round Robin (RR) → Server 1-3, requests 1-6 in rotation |
| T09-B | lead | 9 | lead sentence 2; figure: redraw TR p8 bottom: weighted RR with Weight = 3/2/1 |
| T09-C | points | 9 | points 1, 2, 4; figure: sequence strip A A A B under two servers sized by capacity, running totals (smooth WRR) |
| T09-D | points | 9 | point 3 split at its sentences (default RR in a target group; weighted target groups in listener rules, 90:10; two different mechanisms); figure: listener rule 90:10 across two target groups, round robin inside each |
| T10 | lead | 10 | lead; figure: redraw TR p9: users → LB Least Connections (LC) → servers with live connection counters |
| T10-B | points | 10 | 4 points; figure: two targets with live counters (2 and 5), the LB arrow to the lower counter; counters rise and fall |
| T11 | lead | 11 | lead (two sentences, two lines); figure: three clients with distinct IPs, dashed lines always landing on the same one of two targets, labelled `hash(IP)` |
| T11-B | points | 11 | 4 points; figure: ALB cookie-based stickiness vs NLB source-IP stickiness, plus the reshuffle when a target is added |
| T11-AN | analogy | 11 | (builder F) exam: roll number's last digit decides the hall, same student same hall ↔ client IP → hash → same backend server |

Section 4 · Health Checks & Sessions (builder C)
| id | layout | TR | content and figure |
|---|---|---|---|
| D4 | breaker 4 | | |
| T13 | lead | 13 | lead (two sentences, two lines); figure: three cards in a row, Health Checks (heartbeat), Draining (tap closing), Sessions (cookie), each carrying its TR point split at its sentences |
| T14 | points | 14 | lead; 4 points (interval, timeout, healthy threshold, unhealthy threshold); figure: timeline of check pulses at fixed intervals with a consecutive pass/fail counter building to the two thresholds |
| T14-AN | analogy | 14 | (builder F) doctor's repeated vitals check (breathing is not enough) ↔ health check confirms the server is serving correctly, not merely running |
| T15 | lead | 15 | lead (two sentences, two lines); figure: one backend in three states left to right: serving, draining (fading, two in-flight arrows still reaching it), removed |
| T15-B | steps | 15 | the 5 points as ticked steps; figure: deregistration delay timer (300 s AWS default), in-flight requests finishing, remaining connections closed at expiry |
| T16 | lead | 16 | lead; figure: side by side, one user cookie-pinned to one server; the same user's requests landing on either server with a shared data store below both |
| T16-B | table | 16 | Approach / How It Works / Trade-off, 2 rows verbatim |

Section 5 · DNS & Content Delivery (builder D)
| id | layout | TR | content and figure |
|---|---|---|---|
| D5 | breaker 5 | | |
| T17 | points | 17 | lead (two sentences, two lines); DNS points 1-2; figure: user, DNS resolver choosing between two regional data centres |
| T17-B | points | 17 | CDN points 3-4; figure: user hitting a nearby CDN edge server linked back to one origin |
| T18 | lead | 18 | lead (two sentences, two lines); figure: world map, DNS resolver branching to three regions, arrows labelled geo, latency, weighted |
| T18-B | points or card grid | 18 | the 4 routing policies |
| T18-AN | analogy | 18 | (builder F) food delivery app sends the order to the nearest / open, least busy branch from one restaurant name ↔ one domain name, DNS returns the best regional server |
| T19 | lead | 19 | lead; figure: timeline, health checker pinging a region every interval, red cross after repeated failures, DNS answer list updating to drop it |
| T19-B | points | 19 | 4 points; figure: primary/secondary record swap with TTL (lower TTL faster failover, more resolver queries) |
| T20 | lead | 20 | lead; figure: redraw TR p15 CDN map: one origin, edge/cache servers, users linked to nearby edges, one long arrow to the origin, green tick on a hit, amber arrow on a miss |
| T20-B | points | 20 | 4 points; figure: hit (replies at once) vs miss (fetch from origin, keep a copy) |
| T20-AN | analogy | 20 | (builder F) neighbourhood shop stocks popular items, distant factory ↔ edge location holds popular content, only the first request travels to the origin |
| T21 | points | 21 | lead; 4 points; figure: edge cache box, branch to origin labelled `origin pull on miss`, loop back labelled `TTL check on hit` |
| T22 | lead | 22 | lead (two sentences, two lines); figure: two mini-diagrams, a purge command striking a cached object; `style.css` → `style-v2.css` beside an unchanged cached copy |
| T22-B | points | 22 | 4 points (point 1 split at its sentences if needed); figure: one invalidation targeting one path or the whole cache, origin load rising |
| T23 | table | 23 | lead; Layer / Scope / Failover Speed / Example, 2 rows verbatim |
| T23-B | lead | 23 | lead: the closing two sentences (two lines); figure: layered, top DNS routing across three regions, bottom one region zoomed with a load balancer fanning to three servers |

Practical · Building a Load-Balanced Web Tier (builder E)
| id | layout | TR | content and figure |
|---|---|---|---|
| D-LAB | breaker lab | | Practical Hands-On · Building a Load-Balanced Web Tier |
| P01 | lead | 24 | lead sentence 1 (the exercise); figure: the target build (users → s5-igw → s6-demo-alb → s6-web-1 in s5-public-subnet / ap-south-1a and s6-web-2 in s6-public-subnet-2 / ap-south-1b, inside s5-cloud-network-vpc); note (warn): the billable sentences |
| P01-B | points or lead | 24 | the ALB spans more than one AZ paragraph; figure: two AZs, one server in each |
| P01-C | table | 24 | Resource / Expected Name / Expected Configuration, 6 rows |
| P01-D | steps | 24 | the 7 steps (step 1 per rule 2b) |
| P02 | screenshot | 25 | lead; step: Web Server Security Group; image web-sg-inbound; ring on the source; note: its caption |
| P02-B | screenshot | 25 | Load Balancer Security Group; alb-sg-inbound; caption |
| P02-C | screenshot | 25 | Listener Routing; listener; caption |
| P02-D | screenshot | 25 | Both Servers Running; instances-running; caption |
| P03 | screenshot | 26 | lead; Both Targets Healthy; tg-healthy; caption |
| P03-B | custom or screenshot | 26 | Browser Test: browser-web-1 and browser-web-2 with their two captions |
| P03-C | screenshot | 26 | After Stopping s6-web-2; tg-unused; caption |
| P04 | table | 27 | lead; Component / Expected Result, 6 rows; the production note |
| P04-B | lead / steps | 27 | cleanup paragraph; figure: deletion order LB → target group → instances → s6-web-sg → s6-alb-sg → s6-public-subnet-2 |

Closing (builder E)
| id | layout | content |
|---|---|---|
| S-QUIZ | quiz | the last quiz frame, right before the takeaways |
| S-TAKEAWAYS | takeaways | five titles |
| S-NEXT | next | Block, File & Object Storage |
| S-THANKS / S-BEST | thanks | Thank You · All the Best |

## Narrative and pedagogy

The TR's order is the deck's order. Each concept opens on its need (the TR's lead names the problem: one path,
no rule, stale content), shows the mechanism in the figure, and closes on the AWS name or the console proof. Terms
arrive in TR order; the practical uses only names the theory introduced (ALB, target group, listener, health
check, draining).

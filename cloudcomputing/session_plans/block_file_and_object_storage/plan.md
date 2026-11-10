# Block, File & Object Storage · slide-wise plan

STATUS: signed off on the user's word, 2026-11-06 ("proceed with the plan; if any inputs are needed, proceed with
whatever is optimal"). The request is the spec: Session 7 as the continuation of Session 6, every TR item on a
slide, TR order, TR wording, the reference HTML for visuals only. Same precedent as sessions 5 and 6.

- **Session:** cloud computing session 7, `Outputs/cloudcomputing/block_file_and_object_storage/`, built with
  `deck-engine/` (`node deck.mjs build|check ../Outputs/cloudcomputing/block_file_and_object_storage`). Dev port 5277.
- **Source (content):** `Reference ppt's/7. Block, File & Object Storage.pdf`, extracted to `tr.txt` beside this
  plan. TR slide N is "TR N" below. The TR numbering skips 9, 15 and 23 (8 → 10, 14 → 16, 22 → 24); no text is
  missing, the numbers are just not used.
- **Visual reference:** `Reference ppt's/block-file-and-object-storage.html` (55 frames, rendered to PNG before
  this plan). Its layouts are reused where they suit (analogy pairs, the bucket card, the version stack, the
  four-dimension cards); its wording is not, and its feedback slide is left out (rule 41 retired).
- **Screenshots:** the ten practical captures in the TR PDF (pages 14-21), extracted unchanged to `captures/`,
  served from a 2x Lanczos + light unsharp copy in `images/` (course R4) with every identifier blurred in the PNG
  (rule 53: owner ID, ARNs, ETag, KMS key, volume / instance / file system / VPC / subnet / security group IDs,
  public IPs, the EFS DNS name). Originals also kept in `Outputs/cloudcomputing/workflow/captures/session7-originals-2026-11-06/`.
- **Official marks (rule 54):** EC2, EBS, EBS Volume, S3, S3 Bucket, S3 Object, EFS, EFS File System, FSx, FSx for
  Windows File Server from the AWS package 07312026 (copied into `slide-kit/assets/aws/` and `images/`);
  Linux and Windows vendor marks from `slide-kit/assets/tech/`.

## Text policy (binding)

1. Kicker = the TR `Heading`, title = the TR `Subheading` (as sessions 1-6). The TR `Content` paragraph is the
   `lead`; bullets are points / steps / cards; tables are tables; captions are the screenshot explanation boxes.
2. Allowed edits are punctuation and layout only: ` — ` becomes `: ` (content rule 1); no mark ends a line (rule 36);
   a line holding two sentences is two lines; first letter capitalised (R8.4). Chips / tags / figure labels are
   Title Case on every word (rule 56).
3. Too long → split at the TR's sentence or clause boundary; a slide with too much becomes two slides with the same
   kicker and title.
4. Speaker Notes → `notes`, verbatim. Analogy → its own analogy slide: every clause a Title Case tag inside the
   picture, the full TR sentence in `notes` (R3).
5. Visual Guidance is the figure spec. Labels use only TR words (this slide, its guidance, its notes, the lab
   captures) plus plain part names. No invented numbers, prices or addresses.
6. Left out on purpose: the editor's stray `k` after "Content:" on TR 5; the stray closing quote on TR 21's notes.
   Recap, agenda and takeaways carry the five titles only (course R5); the sub-lines stay in `tr.txt`.

## Deck (63 frames, as built)

Opening
| id | layout | content |
|---|---|---|
| S-WELCOME | brand | |
| S-TITLE | title | Block, File & Object Storage (R9) |
| S-RECAP | recap | previous: Load Balancing & CDN; its five titles |
| S-AGENDA | agenda | the five titles |

Section 1 · Block Storage
| id | layout | TR | content and figure |
|---|---|---|---|
| D1 | breaker 1 | | |
| T01 | points | 1 | lead: the two Content sentences (two lines); 4 points; figure: an Availability Zone box holding the EC2 instance (official) with the EBS volume (official) attached beside it; chips per point: One Instance At A Time, One Availability Zone, Survives Stop, Start Or Termination, SSD-Backed / HDD-Backed |
| T01-AN | analogy | 1 | external hard disk plugged into one laptop ↔ EBS volume attached as a raw block device to a single EC2 instance; tags from the TR clauses |
| T02 | lead | 2 | lead: the two Content sentences; figure: two columns, many small IOPS arrows into a disk vs one wide throughput arrow, each under its own speedometer (notes: "two separate speedometers") |
| T02-B | points | 2 | 4 points; figure: workload → metric (Transaction Logs → IOPS, Video Streaming Or Backups → Throughput) above a size-vs-IOPS sketch: General Purpose SSD rising with volume size, Provisioned IOPS flat and independent of size (no numbers) |
| T03 | table | 3 | lead; Volume Type / Backing Media / Best Fit, 4 rows, SSD rows above HDD rows (row icons mark the two media), no highlight |
| T03-B | lead | 3 | the gp3 / io2 example paragraph (two sentences); figure: a database needing 15,000 IOPS and 2,000 GiB → gp3 (Cost-Effective Option) or io2 (Mission-Critical, Higher Durability, Consistently Low Latency), Without Increasing Storage Capacity |
| T04 | points | 4 | lead; 4 points; figure: boot disk, database, log files, archive box, each arrow to gp3 / io2 / st1 / sc1 |
| T04-B | lead | 4 | the nightly 500 GB log pipeline paragraph (two sentences); figure: one pipeline, two price meters: st1 priced per gigabyte, no per-IOPS charge vs io2 15,000 IOPS, far more cost for unneeded throughput |
| T05 | points | 5 | lead; 4 points; figure: the AZ padlock, the single-instance plug (a second instance refused), the cost tag, a cross-zone attach refused without a snapshot copy, idle headroom |

Section 2 · File Storage
| id | layout | TR | content and figure |
|---|---|---|---|
| D2 | breaker 2 | | |
| T06 | points | 6 | lead (two sentences); 3 points; figure: Server 1-3 joined to one shared filesystem box, its two access protocols NFS (Linux mark) and SMB (Windows mark) |
| T07 | lead | 7 | lead (two sentences); figure: client box with a mounted folder (looks local) → `NFS Protocol` → server box holding the real files; Read / Write / Lock requests ride the arrow |
| T07-B | points | 7 | 4 points; figure: four cards lit per point: NFSv3 stateless request carrying File Handle + Offset; NFSv4 stateful with Locking, Delegation, Security Over TCP; Exports (Shared Directories, Permissions); two writers and one lock |
| T07-AN | analogy | 7 | office notice board ↔ NFS shared copy on the server |
| T08 | points | 8 | lead; 4 points; figure: Windows client → authentication step (User Or Domain Credentials) → network share on a file server; then oplock cache + change notice, SMB 3.0 encryption + multichannel, CIFS as the older dialect |
| T09 | points | 10 | lead; 3 points; figure: decision diagram: single-instance workload → block storage (EBS); multi-instance shared-access workload → file storage (EFS / FSx) |
| S-QUIZ1 | quiz | | mid-deck quiz after block and file storage (as session 6 and the reference) |

Section 3 · Object Storage
| id | layout | TR | content and figure |
|---|---|---|---|
| D3 | breaker 3 | | |
| T11 | points | 11 | lead (two sentences); points Bucket, Object, Key; figure: an S3 bucket card holding object rows, each with its key string |
| T11-B | points | 11 | points Metadata, Flat namespace; figure: each object row gains its metadata label; beside it a flat key list contrasted with a folder tree |
| T12 | points | 12 | lead (two sentences); 4 points; figure: one object split into Data, Key, Metadata (system / user) with sample values from the lab object (`session7-object.txt`, `text/plain`, `68.0 B`) |
| T12-AN | analogy | 12 | the notes' courier parcel: package ↔ data, tracking label ↔ key, contents declaration ↔ metadata |
| T13 | points | 13 | lead (two sentences); 4 points; figure: Account A's bucket with its globally unique name and region tag; Account B's identical name crossed out |
| T14 | lead | 14 | lead (two sentences); figure: nested folder tree left, flat bucket of keys like `photos/2024/a.jpg` right, a dashed line grouping keys that share a prefix |
| T14-B | table | 14 | Aspect / Hierarchical File System / Flat Object Namespace, 4 rows |

Section 4 · Object Storage Mechanics
| id | layout | TR | content and figure |
|---|---|---|---|
| D4 | breaker 4 | | |
| T16 | points | 16 | lead (two sentences); 3 points; figure: client → HTTP request → S3 endpoint, branching to REST call, presigned link, versioned object stack |
| T17 | points | 17 | lead (two sentences); 4 points; figure: the request line `GET /bucket-name/object-key` with its Authorization header, arrows verb → action and path → object, the GET / PUT / DELETE verbs, a 403 for an unsigned request |
| T17-AN | analogy | 17 | bank locker ↔ REST call |
| T18 | points | 18 | lead (two sentences); 4 points; figure: timeline, link generated at T0, valid window shaded, expiry at T+n, access denied after |
| T18-AN | analogy | 18 | movie ticket QR code ↔ presigned URL |
| T19 | points | 19 | lead (two sentences); 4 points; figure: one key, v1 / v2 / v3 (current) stacked, a delete marker on top, an arrow restoring v2 |

Section 5 · Choosing a Storage Type
| id | layout | TR | content and figure |
|---|---|---|---|
| D5 | breaker 5 | | |
| T20 | points | 20 | lead; 4 points; figure: four quadrants Performance / Sharing / Scale / Cost, each pointing to the family it weighs heaviest (EBS / EFS / S3 / S3, read from TR 21's table) |
| T21 | table | 21 | lead; Feature / Amazon S3 / Amazon EBS / Amazon EFS, rows 1-2 (Storage type, Access method) |
| T21-B | table | 21 | rows 3-8 (Performance, Shared access, Scale, Cost, Persistence, Best suited for); the four agenda rows lightly highlighted |
| T22 | points | 22 | lead; 4 points; figure: workload question at top branching to Block / File / Object, each with one real example from the notes (a database's data files, a shared config directory, user-uploaded images) |

TR 21's Visual Guidance asks for the four agenda rows (Performance, Shared access, Scale, Cost) lightly highlighted.
Rule 60 forbids a highlight unless asked; the TR asks, so these four rows carry the light highlight. Flagged.
The split is rows 1-2 / 3-8 because it is the only one that keeps the four highlighted rows off a table's last row
(R8.3: `check-deck` fails a highlighted last row).

Practical · Testing S3, EBS and EFS Storage on AWS
| id | layout | TR | content and figure |
|---|---|---|---|
| D-LAB | breaker lab | | Practical Hands-On · Testing S3, EBS and EFS Storage on AWS |
| P01 | lead | 24 | lead; figure: the three builds: S3 bucket + object; one instance + EBS volume; two instances sharing one EFS file system |
| P01-B | custom timeline | 24 | the 5 points as a numbered zig-zag timeline |
| P02 | shot + caption | 25 | S3 upload completion summary + its caption |
| P02-B | shot + caption | 25 | S3 object properties for `session7-object.txt` + its caption |
| P03 | shot + caption | 26 | lead; EBS volume settings before creation + caption |
| P03-B | shot + caption | 26 | attach volume dialog + caption |
| P04 | shot + caption | 27 | lead; lsblk output + caption |
| P04-B | shot + caption | 27 | EBS volume formatted, mounted, file written + caption |
| P05 | shot + caption | 28 | lead; EFS general settings + caption |
| P05-B | shot + caption | 28 | EFS mount target network configuration + caption |
| P06 | shot + caption | 29 | Instance 1 terminal + caption (the em dash becomes a colon) |
| P06-B | shot + caption | 29 | Instance 2 terminal + caption |
| P06-C | points | 29 | the diagnostics lead + points 1-3; figure: Instance 1 and Instance 2, a disk-usage check, the missing mount on the local disk, a name-resolution check before mounting |
| P06-C2 | lead | 29 | point 4 (the finished lab's end state) as the lead, split off because it took three lines beside a figure; figure: the three lanes with One S3 Object / One File / Visible From Both Instances |
| P06-D | custom timeline | 29 | the cleanup lead + 6 steps as a numbered timeline |

Wide console captures are cropped (source pixels, course R4) to the region the caption describes so the text stays
readable; the widest (S3 upload summary) takes its caption under it at full width; P03 puts its lead in the caption
column so the tall settings capture keeps its height. Each capture is one sharp enlarged image (R7.9) with its orange ring on the field the caption names, and the
explanation box beside it aligned to the image's top edge (standing correction 7).

Closing
| id | layout | content |
|---|---|---|
| S-QUIZ | quiz | the last quiz frame |
| S-TAKEAWAYS | takeaways | five titles |
| S-NEXT | next | Storage Tiering, Backup & DR |
| S-THANKS / S-BEST | thanks | Thank You · All the Best |

## Coverage check (every TR item → slide)

| TR | item | slide(s) |
|---|---|---|
| Recap | 5 titles (sub-lines in source, R5) | S-RECAP |
| Agenda | 5 titles | S-AGENDA, D1-D5 |
| 1 | Content paragraph; 4 bullets; Visual Guidance; Speaker Notes | T01 |
| 1 | Analogy (external hard disk) | T01-AN (tags + notes) |
| 2 | Content paragraph; Visual Guidance; "two separate speedometers" (notes) | T02 |
| 2 | 4 bullets; notes | T02-B |
| 3 | Content paragraph; 4-row table; grouping guidance | T03 |
| 3 | gp3 / io2 example paragraph; notes | T03-B |
| 4 | Content paragraph; 4 bullets; Visual Guidance | T04 |
| 4 | st1 / io2 log pipeline example; notes | T04-B |
| 5 | Content paragraph; 4 bullets; Visual Guidance; notes | T05 |
| 6 | Content paragraph; 3 bullets; Visual Guidance; notes | T06 |
| 7 | Content paragraph; Visual Guidance | T07 |
| 7 | 4 bullets; notes | T07-B |
| 7 | Analogy (office notice board) | T07-AN |
| 8 | Content paragraph; 4 bullets; Visual Guidance; notes | T08 |
| 10 | Content paragraph; 3 bullets; Visual Guidance; notes | T09 |
| 11 | Content paragraph; bullets Bucket, Object, Key | T11 |
| 11 | bullets Metadata, Flat namespace; Visual Guidance; notes | T11-B (guidance split over T11 / T11-B) |
| 12 | Content paragraph; 4 bullets; Visual Guidance; notes | T12 |
| 12 | Courier parcel analogy (notes) | T12-AN |
| 13 | Content paragraph; 4 bullets; Visual Guidance; notes | T13 |
| 14 | Content paragraph; Visual Guidance | T14 |
| 14 | 4-row table; notes | T14-B |
| 16 | Content paragraph; 3 bullets; Visual Guidance; notes | T16 |
| 17 | Content paragraph; 4 bullets; Visual Guidance; notes | T17 |
| 17 | Analogy (bank locker) | T17-AN |
| 18 | Content paragraph; 4 bullets; Visual Guidance; notes | T18 |
| 18 | Analogy (movie ticket QR code) | T18-AN |
| 19 | Content paragraph; 4 bullets; Visual Guidance; notes | T19 |
| 20 | Content paragraph; 4 bullets; Visual Guidance; notes | T20 |
| 21 | Content paragraph; table rows 1-4 | T21 |
| 21 | table rows 5-8; highlight guidance; notes | T21-B (notes on both) |
| 22 | Content paragraph; 4 bullets; Visual Guidance; notes | T22 |
| 24 | Content paragraph | P01 |
| 24 | 5 bullets | P01-B |
| 25 | upload summary + caption; properties + caption | P02, P02-B |
| 26 | Content paragraph; settings + caption; attach + caption | P03, P03-B |
| 27 | Content paragraph; lsblk + caption; format + caption | P04, P04-B |
| 28 | Content paragraph; EFS general + caption; network + caption | P05, P05-B |
| 29 | Instance 1 + caption; Instance 2 + caption | P06, P06-B |
| 29 | diagnostics sentence + bullets 1-3 | P06-C |
| 29 | bullet 4 (end state) | P06-C2 |
| 29 | cleanup sentence + 6 bullets | P06-D |
| Key Takeaways | 5 titles | S-TAKEAWAYS |
| Upcoming Session | Storage Tiering, Backup & DR | S-NEXT |
| Closing | Thank You · All the Best | S-THANKS, S-BEST |

## Narrative and pedagogy

The TR's order is the deck's order. Each storage family opens on its definition (the TR lead), shows the
mechanism in the figure, and closes on the AWS name and its limit, which is the need the next family answers:
block's single-attach limit (TR 5) sets up file storage, file storage's per-gigabyte cost (TR 10) sets up object
storage, the flat key (TR 14) sets up the mechanics, and the four dimensions (TR 20-22) compare all three before
the practical builds one of each. Terms arrive in TR order; the practical uses only names the theory introduced.

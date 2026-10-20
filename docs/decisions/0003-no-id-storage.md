# 0003 No ID images, ever

Date: 12 Oct 2026. Status: accepted. Supersedes the blueprint's Didit web flow as the
default; Didit stays an option.

**Decision.** Owners and coordinators are checked in person at Porto, Brgy. Balon with
the free National ID QR check (everify.gov.ph/check). Laot records only: passed or not, the
kind of ID, the date and who checked (`dock_checks`). Boat papers are checked in person too,
and Laot records only the kind, an optional reference number, the expiry date and who
checked (`boat_papers`). No scans, no selfies, no storage bucket for them.

**Why.** A breach then leaks no faces and no ID scans. The NPC lists ID photos on personal
phones and sent by chat as high risk. It also keeps ID collection out of the store apps,
which an individual (sole proprietor) developer account should avoid.

**Badges.** Verified needs a passed dock check. Licensed needs current MARINA registration,
safety certificate, passenger insurance and CPC. A nightly job drops a boat to verified
when any of the four lapses. Only Licensed boats show prices.

**Open question for the lawyer.** The Internet Transactions Act asks marketplaces to
"collect" a seller's valid ID "as far as practicable". Confirm that an in person QR check
plus this log meets that duty before Stage 2.

**If Didit is ever used**, set its retention to 1 month and delete each session by API
after the decision.

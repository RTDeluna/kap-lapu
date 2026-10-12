# 0004 Two stages, and the 10% fee model

Date: 12 Oct 2026. Status: accepted.

**Stage 1 (now).** Spots, catches, social, reports, boat listings and inquiry chat. No money
moves, so it is safe as a DTI sole proprietor.

**Stage 2 (later).** Paid bookings. Starts only after all of:

- four concierge weekends bring at least 10 paid bookings and 3 owners who want to continue
  (thresholds are a suggestion; set your own before the pilot)
- an OPC is formed with its own bank account
- a lawyer has reviewed the Terms, the Owner and Operator Agreement and the ID question
- insurance quotes are in

**Fee model for Stage 2.** The renter pays a 10% booking fee in app through PayMongo. That
fee is Laot's own income. The trip price is paid on the boat, to the owner, in cash or
GCash. Laot never collects, holds or pays out owner money. Owners keep 100% of their price.

**Why.** A banca carrying paying anglers is almost certainly a common carrier, and waivers
of passenger safety are void. Keeping Laot a booking service in fact, not just in words,
and never holding owner money, keeps most of that risk with the papered, insured owner.
It also kills the most common scam: there is nothing to prepay.

**Stage 2 data rules already decided.** An exclusion constraint on trips
(`boat_id WITH =, during WITH &&`) so a boat is never double booked; a unique PayMongo
event id so a retried webhook is processed once; weather cancels save the forecast that
triggered them.

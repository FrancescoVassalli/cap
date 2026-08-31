# Handoffs
This is the current implementation handoff for the CAP frontend. It reflects the verified state of the repo and the remaining work needed before the project is ready for final integration. Each section below is for a particular agent to read from 

## Design system
Priority: done
The presentational Visual / Branding pass is complete. It follows the color/branding inspiration in `planning/master.md` (primary `#01599a`, secondary `#7aabdb`, highlight `#fec524`) and the character of the reference CAP/CCHI site (hero blue, photography, bold color bands). No business logic, no component API changes, and no accessibility-structure changes were introduced; details are recorded in `architecture/master.md`.

Completed:
1. **Tokens/theme** (`src/index.css`) — added light brand tint tokens (`cap-primary-50/100`, `cap-secondary-50`) and a warm canvas background derived from the brand hexes; existing `status-*`, `touch`, and `font` tokens are unchanged.
2. **AppShell** — swapped `bg-slate-50` for the warm canvas, added a thin primary→secondary→highlight gradient brand bar along the top, and used `border-cap-secondary/40` accents on the header and a brand-toned secondary footer band.
3. **Hero** (HowWeHelp + IntakeLanding) — primary→secondary blue gradient hero with white text, a highlight `#fec524` eyebrow, and a highlight CTA pill; HowWeHelp gained a real CAP hero photo.
4. **Cards/sections** — replaced flat gray stacking with warm cards (`border-cap-secondary/40`, `cap-secondary-50` header rows, larger rounding); service tiles get `border-l-4 border-cap-primary`, step tiles get highlight number chips, and the expectations block uses a secondary/highlight band callout.
5. **Buttons/CTA** (`Button.tsx`) — added a `highlight` variant (`bg-cap-highlight text-cap-primary`, never white on yellow) with a subtle hover lift, used for the get-help/start CTAs.
6. **Header/nav/footer** — active-route nav in primary with a secondary/highlight hover underline, and a brand-toned footer (secondary band with dark text) instead of gray.
7. **Intake form + progress** (`IntakeProgress`) — completed segments cap-primary, current segment cap-secondary, text labels retained; step cards surfaced in brand colors. No color-only meaning.
8. **Imagery** — pulled the real CAP assets into `public/`: the hero photo (`cchi-help-2.jpg`) on /how-we-help and the five real team headshots (`team-*.jpg/png`) in a new trust section.
9. **Verification** — contrast checked (dark text on highlight, white on primary, dark on secondary footer), then re-ran `npm run test` (60 tests), `npm run build`, `npm run lint`, `npm run typecheck` (all green), plus a Playwright visual smoke check (mobile + desktop) confirming the hero, canvas, CTA, and no overflow.

Also folded in: made `RadioGroup`/`LanguageStep` explicitly controlled so the selected language radio is actually checked (English default + regression test).

## Integration
Priority: required before sign-off
This is the next implementation wave. Required work:
- Validate the app as one experience rather than a collection of independent features.
- Test routing, state flow, ZIP blank/unknown behaviors, document skipping, submission states, and success paths.
- Confirm accessibility and mobile UX under the project’s WCAG target.
- Run the final verification pass across the repo before sign-off.
- Then run the Accessibility auditor (WCAG 2.2 AA) as the sign-off gate; Security/Release auditors remain later, outside the demo scope.



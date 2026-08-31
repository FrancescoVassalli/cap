# Master Plan For the Project

The consumer assistance program helps Colorado consumers who have had insurance claims denied appeal the decisions and recover funds. 

[Current website summary page](https://cohealthinitiative.org/cap/)

[Current get help page](https://cohealthinitiative.org/need-help/)

The current website is a simple form submit to begin the process and notify the staff. 

This project will replace the current website with a react application frontend that collects the same info and is presented in a similar but better style. Then the collected intake forms can be used to begin a CRM like process for handling the case and use a backend system to autmoate some steps. 

## Frontend 
Begin with this. Create a static react frontend that can be hosted on s3. It should be inspired by the current website and use the images but be designed more for the user. 
Use tailwind for the css. Include existing imagery and branding from the webiste. Here is a color inspo 
* primary #01599a
* secondary #7aabdb
* highlight #fec524
All the components should be dumb.
This needs to be mobile compatible.

The new site should retain the approachable, nonprofit/community-oriented character of the current CAP site while substantially improving clarity, accessibility, and task completion.

### Expected Pages 
`/how-we-help` mostly informational like the current summary page 
`/intake` to act as the current `/need-help` page 
After the intake landing page users shoudl be able to click to start a new intake this should direct them to 
`/instake/id` with a unique id for the intake. Use formik all information in a single form. Implement with custom input components, buttons, and any needed hooks. This will present a multistep form:
1. Zip code. Users can skip the zip code. If the zip code is entered, it should autofill address information stored within the frontend. 
1. Language select english or spanish with a flag.  
1. Name and email and address using the autofilled info from above. Only needs to support US.
1. Documents these should be stored in s3

Ensure there is a footer to proceed and return between steps. The intake should not persist. Until a backend is made the subsmission should just generate an email. 

### Additional best practices 
Decide on details to support all the following 
#### Define responsive/mobile behavior

This is especially important for this project because people seeking help with medical bills may very well be completing the form on a phone.

Specify:

Mobile-first layout
Minimum tap target sizes
Sticky/fixed navigation or not
Form fields full width on mobile
How progress is displayed
How errors are displayed
Whether tables/cards collapse
Image treatment

I would make mobile completion of the intake form a first-class requirement, not an afterthought.

#### Define accessibility requirements

For a healthcare-assistance service, this deserves its own section.

At minimum:

WCAG 2.2 AA target
Keyboard navigation
Screen-reader labels
Visible focus states
Appropriate error messaging
Never rely on color alone
Sufficient contrast
Accessible dialogs
Proper semantic headings
Large enough controls
Form errors associated with the relevant field

Also decide whether accessibility testing is part of the acceptance criteria.

#### Define loading/error/empty/success states

Every data-dependent action should have:

idle
loading
success
error

For the intake process, specifically define:

submission failure
network interruption
duplicate submission
server validation failure
session expiration
successful submission

The success screen should tell the user what happens next, rather than simply saying "Thank you."

That maps nicely to the real CAP workflow, where staff subsequently contact the consumer and may request authorization and documents

#### Content independent of components 
Where practical 
```` typescript
const helpPageContent = {
  title: "...",
  intro: "...",
  sections: [...]
}
````

#### Security
This is particularly important because the intake contains potentially sensitive healthcare and insurance information.

The frontend spec should explicitly state:

No sensitive data in URL parameters
No sensitive data in analytics
No sensitive data in client logs
HTTPS only
How authentication/session state works, if applicable
Whether document uploads occur in this application
Whether the frontend talks directly to the API or through another layer
What third-party analytics/scripts are permitted

## Infrastructure 
Plan aws infrastructure to support this system 

## WIP 
1. ~~Design System Agent → style foundation wiring (CSS + tokens). Must go first; everything visual depends on it.~~ **DONE** (Tailwind bootstrapped in `src/index.css`, tokens migrated to a CSS-first `@theme` block, v4 utility fixes, dead CSS removed; the four verification commands re-run and green — recorded in `architecture/master.md`).
2. ~~Navigation Agent → CAP logo + favicon in the shell (parallel-safe with #3, after #1).~~ **DONE** (real `CCHI_Logo.png` wired into the header `SiteBrand` and footer, and `CCHI-logo-favicon.png` set as the favicon with the page title updated — recorded in `architecture/master.md`.)
3. ~~Informational Pages Agent → CAP hero + team imagery on /how-we-help (parallel with #2, after #1).~~ **DONE (as part of the Design System visual / branding pass)**: the hero is repainted onto a primary→secondary blue gradient with a highlight CTA, `/how-we-help` gained a real CAP hero photo and a team/trust section using the real CAP headshots pulled into `public/`, and the card/step/expectations sections were branded — recorded in `architecture/master.md`.
4. ~~Visual smoke check (mobile/desktop) → demo.~~ **DONE**: the four verification commands are re-run and green, and a Playwright visual smoke check on the built app confirmed the warm canvas, hero gradient + white text, highlight CTA, secondary footer, and no mobile overflow — recorded in `architecture/master.md`.
5. Then back to the already-planned sequence: Integration / QA Agent, then the Accessibility auditor (WCAG 2.2 AA) — the Security/Release auditors remain later, outside the demo scope.
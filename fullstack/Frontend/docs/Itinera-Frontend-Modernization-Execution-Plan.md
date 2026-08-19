Itinera Frontend Modernization — Execution Plan

Overall objective

Modernize the existing 118-page Vanilla JS + Tailwind frontend without rewriting it into React/Vue/Svelte.

The target architecture is:

HTML / Multi-Page
        │
        ├── Tailwind CSS
        │      └── CLI build
        │
        ├── Existing Vanilla JS
        │      └── Itinera namespace
        │
        ├── Reusable UI Components
        │      ├── HTML partials
        │      └── Web Components where justified
        │
        └── Alpine.js
               └── only for high-interactivity islands

This is consistent with the assessment's recommendation to preserve the existing architecture and modernize it incrementally. 

One update I would make to the assessment: do not blindly follow its Tailwind v3-oriented implementation details. Current Tailwind documentation uses the dedicated @tailwindcss/cli package for Tailwind v4, and Tailwind's current CLI generates static CSS with zero runtime. 


---

Phase 0 — Repository & Assessment Validation

Goal

Before changing anything, determine whether the assessment still accurately describes the repository.

OpenCode should inspect

HTML pages
CSS files
JS files
components/
assets/
package.json
existing build scripts
Tailwind configuration
all CDN references
all CSS imports
all JS script ordering
dynamic Tailwind classes
API/session architecture
deployment structure

It should produce

docs/modernization/
├── 01-repository-audit.md
├── 02-assessment-validation.md
├── 03-architecture-decisions.md
└── 04-risk-register.md

Critical rule

OpenCode must classify every recommendation from the assessment as:

ADOPT
MODIFY
DEFER
REJECT

with evidence from the repository.

For example:

Assessment:
Use Web Components.

Repository evidence:
Only 2 reusable components genuinely need encapsulation.

Decision:
DEFER Web Components.
Existing HTML partial architecture is sufficient.

This prevents AI-driven overengineering.

Exit criteria

No code modified.

You should have a verified architectural baseline.


---

Phase 1 — Establish a Safety Baseline

Before modernization, protect the current working state.

The assessment says the project already has a responsive audit/sweep baseline. 

OpenCode should verify that rather than assuming it.

Establish

baseline branch/tag
responsive sweep
console-error check
broken-link check
page inventory
CSS inventory
JS inventory
visual regression baseline

Test important widths:

320px
375px
768px
1024px
1440px

Exit criteria

The current application can be compared against every later phase.


---

Phase 2 — Tailwind CDN → Build Pipeline

This should be the first actual modernization.

The assessment identifies the Play CDN as one of the biggest structural problems. 

Current Tailwind documentation supports using the CLI to scan HTML/JS/templates and produce a static CSS file. 

Important

Don't let OpenCode automatically choose Vite.

The project does not need Vite merely because it is modern.

Use:

Tailwind CLI

unless repository evidence demonstrates that a broader JS build pipeline is actually necessary.

Tasks

1. Determine current Tailwind version/behavior.
2. Choose compatible Tailwind CLI version.
3. Create input CSS.
4. Configure source scanning.
5. Build CSS.
6. Identify dynamic Tailwind classes.
7. Protect dynamic classes.
8. Replace CDN references.
9. Build production CSS.
10. Compare against baseline.

Very important dynamic-class audit

Search for patterns such as:

`bg-${status}-500`
`text-${color}`
"className + variable"

These can be missed by static scanning.

Exit criteria

No Tailwind CDN
+
CSS generated locally
+
all pages styled correctly
+
dark mode works
+
dynamic classes work
+
responsive sweep passes


---

Phase 3 — CSS Architecture Consolidation

Only after Phase 2 is stable.

The assessment found 17 CSS files and approximately 12,000 lines. 

The goal isn't simply:

> "Put everything into one giant CSS file."



Instead:

styles/
├── main.css
│
├── base/
├── tokens/
├── components/
├── layouts/
├── pages/
└── utilities/

Conceptually:

Base
  ↓
Tokens
  ↓
Components
  ↓
Layouts
  ↓
Pages
  ↓
Utilities

Important

OpenCode should not delete CSS because it looks duplicated.

For every removal:

old rule
↓
search usages
↓
verify equivalent rule
↓
visual test
↓
remove

Target

Reduce:

17 disconnected CSS files

into a predictable layered architecture.

The assessment specifically recommends layered CSS and estimates that several thousand redundant/dead lines may eventually be removable. 

Exit criteria

No unexplained visual differences.


---

Phase 4 — Design Tokens

Now formalize the design system.

Create/normalize:

colors
spacing
radius
shadows
typography
breakpoints
z-index
transitions

For example:

--color-primary
--color-surface
--color-text
--space-1
--space-2
--radius-sm
--radius-md

The assessment specifically notes the current coexistence of token variables and raw pixel values. 

Rule

Do not replace every raw value automatically.

Only normalize values where:

repeated
semantic
design-system related

Otherwise you'll create unnecessary churn.


---

Phase 5 — Component Inventory

Before creating Web Components, map what already exists.

OpenCode should produce something like:

Component                  Instances   Variants   Candidate
------------------------------------------------------------
Navbar                         5          3        HIGH
Footer                         6          2        HIGH
Search Input                  15          4        HIGH
Modal                          8          5        HIGH
Table                          9          3        HIGH
Status Pill                   12          6        HIGH
Sidebar                        5          3        MEDIUM
Pagination                     7          2        MEDIUM

This phase is crucial because the assessment identifies duplicated patterns across customer/admin/agency layouts. 


---

Phase 6 — Single Source of Truth

Fix the biggest duplication problems first.

Priority:

1. Footer
2. Navbar/topbar
3. Search input
4. Modal
5. Status/pill
6. Table patterns
7. Pagination
8. Sidebar

The assessment specifically calls out the duplicated footer and divergent topbars as maintenance traps. 

Rule

Every component must have:

one source
+
documented variants
+
consistent API
+
responsive behavior
+
accessibility behavior


---

Phase 7 — Web Components Decision

Do not automatically convert everything to Web Components.

Evaluate each candidate.

Use Web Components when

high reuse
+
clear boundaries
+
self-contained behavior
+
encapsulation actually helps

Keep HTML partials when

mostly static
+
server/page composition is enough
+
Shadow DOM provides no real benefit

The assessment recommends a hybrid approach rather than forcing Web Components everywhere. 

Pilot

Use the trip modal as the first candidate, as recommended by the assessment.

Then evaluate:

search input
status pill
table wrapper


---

Phase 8 — Alpine.js Evaluation

This should be decision-driven, not mandatory.

Alpine's x-data provides local reactive state and x-show handles visibility, making it appropriate for localized interactive behavior. 

OpenCode should scan the JS and calculate interaction density.

For each page:

DOM queries
event listeners
state variables
render functions
conditional UI
modal logic
filters
forms

Then classify:

LOW INTERACTION
→ Vanilla

MEDIUM
→ Evaluate

HIGH
→ Alpine candidate


---

Phase 9 — Alpine Pilot

Only if Phase 8 justifies it.

Candidates from the assessment:

Trip detail
Availability calendar
Authentication forms
Admin filters



For example:

<div x-data="{ open: false }">

    <button @click="open = !open">
        Open
    </button>

    <div x-show="open">
        ...
    </div>

</div>

Alpine officially supports this local-state model and reusable Alpine.data() components. 

Critical rule

Don't convert existing business/API logic into Alpine.

Keep:

It.api
It.session
services
business logic

and use Alpine primarily for UI state.


---

Phase 10 — JavaScript Modernization

Only after the UI architecture stabilizes.

Move gradually from:

IIFE
global scripts
script ordering

toward:

ES Modules

import
export

The assessment recommends this as engineering hygiene rather than a prerequisite for the earlier phases. 

Also evaluate

ESLint
Prettier
AbortController
timeouts
offline detection
error handling

Do not rewrite working API/session logic just to make it "modern."


---

Phase 11 — Responsive & UX Consolidation

Now use the new component architecture to solve the recurring responsive issues.

Check:

mobile navigation
tables
modals
forms
pill rails
cards
search
calendar
admin dashboard
agency pages

The assessment specifically mentions previous responsive fixes being repeatedly applied across pages because patterns were duplicated. 

Now a fix should become:

one component
      ↓
all pages

instead of:

15 copies
      ↓
15 fixes


---

Phase 12 — Final Audit

Run the complete regression suite.

Functional

authentication
authorization
API requests
session
role routing
forms
modals
filters
tables
navigation

Visual

320
375
768
1024
1440

Technical

console errors
network failures
missing assets
404s
unused CSS
dynamic Tailwind classes
duplicate components
dependency audit

Performance

Compare:

before
vs
after

especially:

CSS size
number of requests
rendering
page load
JS size


---

Final Architecture

The end state should look approximately like:

frontend/
│
├── pages/
│   ├── public/
│   ├── customer/
│   ├── admin/
│   ├── agency/
│   └── auth/
│
├── components/
│   ├── navbar/
│   ├── footer/
│   ├── search/
│   ├── modal/
│   ├── table/
│   └── status/
│
├── js/
│   ├── core/
│   ├── modules/
│   ├── pages/
│   ├── services/
│   └── utils/
│
├── styles/
│   ├── main.css
│   ├── tokens/
│   ├── base/
│   ├── components/
│   ├── layouts/
│   └── pages/
│
├── dist/
│   └── app.css
│
├── package.json
└── tailwind.config / Tailwind configuration

The exact structure should still be decided by OpenCode after inspecting the actual repository, not imposed blindly.


---

Decision Rules for OpenCode

This is the part I'd consider mandatory.

OpenCode should follow these rules:

Rule 1

Repository evidence beats the assessment.

Rule 2

Preserve working behavior unless there is a demonstrated reason to change it.

Rule 3

Prefer extraction over rewriting.

Rule 4

Prefer incremental migration over big-bang migration.

Rule 5

No framework migration.

The assessment explicitly rejects React/Vue/Svelte, SPA routing, SSR frameworks, and a TypeScript migration at this stage. 

Rule 6

Every architectural decision must include evidence.

Rule 7

Every destructive change requires a rollback path.

Rule 8

Do not optimize code that has not been measured.

Rule 9

Do not introduce a library just because it is popular.

Rule 10

If Vanilla JS is simpler, keep Vanilla JS.


---

Deliverables

At the end of the planning stage, I would want OpenCode to create:

docs/modernization/
│
├── 01-repository-audit.md
├── 02-assessment-validation.md
├── 03-architecture-decisions.md
├── 04-css-modernization-plan.md
├── 05-js-modernization-plan.md
├── 06-component-inventory.md
├── 07-responsive-audit.md
├── 08-risk-register.md
├── 09-migration-roadmap.md
└── 10-execution-checklist.md

And only after you review those documents should it begin implementation.


---

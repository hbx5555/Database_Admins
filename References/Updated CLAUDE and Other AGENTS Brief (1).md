# Database Front — Coding Agent Brief

This file contains **project-specific instructions** for coding agents working on the `Database_Admins` project. It is intentionally focused on this repository and should not contain global personal preferences.

## Repository and local path

- GitHub repository: `https://github.com/hbx5555/Database_Admins`  
- Intended local working folder: `/Users/haimbxpertlink/Documents/GIT_Projects`  
- Project name in local development: `Database_Admins`  
- `Keep Desig files in sub-directory “front-end-design”`

Agents should assume that all code changes belong inside this repository and should preserve consistency with the existing structure if files already exist.

## Project purpose

Build a React \+ TypeScript frontend for non-technical customers to manage data stored in Supabase/PostgreSQL without exposing them to the database native admin UI. This frontend should feel closer to Airtable/Baserow than to a developer database console.[^1]

The sample business domain is a CRM with linked relational tables such as:

- `contacts`  
- `leads`  
- `projects`  
- `tasks`  
- optional lookup tables such as `statuses`, `regions`, `users`, `tags`

The source database is designed for the app from day one and remains relational and normalized. Relationships between tables are part of the core design from the start.

## Core product model

This project is **not** a database admin clone. It is a customer-facing business UI over a relational CRM schema.

Important modeling rules:

- The database schema stays relational and flat.  
- The frontend may show linked data, labels, and friendly field names.  
- Filters, sorting, and later grouping are **view-layer behaviors**, not database schema behaviors.  
- Grouping must never reshape or redefine the source data model.  
- Grouping is single-level only and is a display option similar to Airtable grouping behavior.[^2][^3]

## Front End Overview

## The database admin front-end basic approach is illustrated in the attached screen design named “tagged screen.png”. It includes:  “Main Menu” that will select tables “Sub-items menu that selects filtered views within a table The main grid embedding area with rows, field titles etc

Typical elements such as the “New Item” button, the logged-in user icon, etc.

The following section focuses on the implementation of the grid area using the library, while the front-end design and code are provided in a start-point code format in the folder “front-end-design”

## Mandatory core library

The core grid library to be used for this project is **`react-datasheet-grid`**.[^4]

Rules:

- Use `react-datasheet-grid` as the main editable grid component.  
- Do **not** substitute AG Grid, TanStack Table, Glide Data Grid, MUI Data Grid, or any other grid library unless the project instructions are explicitly changed.  
- Supporting UI libraries may be added if needed, but the central grid/editing experience must remain based on `react-datasheet-grid`.[^5]

## Staged implementation plan

### Stage 1 — Grid view, no grouping

Build a first production-quality version with:

- editable grid for one entity at a time, starting with `leads`  
- sorting  
- filtering  
- inline editing  
- row selection  
- right-slide details panel for the selected record  
- optimistic persistence to Supabase  
- good loading, empty, and error states

#### Stage 1 UX expectations

- Airtable-inspired but not a clone  
- clear top toolbar above the grid  
- visible headers and sensible field formatting  
- single-select fields as colored pills  
- multi-select fields as chips/pills  
- text left-aligned, numbers right-aligned  
- business-friendly labels, not raw internal schema names  
- right-side slide-over panel for comfortable editing of one record

#### Stage 1 architecture

Maintain at least these state layers:

- `sourceRows`: flat real rows fetched from Supabase  
- `viewConfig`: visible columns, filters, sorts  
- `displayRows`: rows after view transforms  
- `selectedRowId`  
- `detailsPanelOpen`

Rules:

- `sourceRows` must stay flat and relational.  
- filtering and sorting are pure frontend transforms over `sourceRows`.  
- editing from grid and details panel must write through the same source of truth.  
- use stable UUID/database IDs, never row indexes, for persistence.

### Stage 2 — Add grouping option

After Stage 1 works cleanly, add optional single-level grouping.

#### Stage 2 rules

- Grouping is client-side display logic only.  
- Grouping is chosen by the customer at runtime.  
- Grouping can be applied to fields such as status, region, or owner.  
- Only one grouping field at a time.  
- No multi-level grouping.  
- Grouping must not alter source rows or the database schema.  
- Synthetic group header rows are never persisted.

#### Stage 2 architecture

Extend the view layer with:

- `groupBy: string | null`  
- `collapsedGroups: Record<string, boolean>`

Grouping pipeline:

1. fetch flat rows  
2. apply filters  
3. apply sorting  
4. if `groupBy` is null, render normal rows  
5. if `groupBy` exists, derive synthetic group header rows and flatten them into display rows

Use the `react-datasheet-grid` collapsible-rows pattern only as a **rendering strategy** for group headers, not as the source data model.[^6]

## Technology expectations

Mandatory core grid library and stack:

- React  
- TypeScript  
- `react-datasheet-grid` as the required editable grid UI library; do not substitute AG Grid, TanStack Table, Glide Data Grid, or any other grid library unless explicitly approved for the project[^7]  
- Supabase JS client  
- modular architecture with reusable table/view logic

The project should be organized so the same table-shell pattern can later be reused for Contacts, Projects, and Tasks.

## Security expectations

Assume browser-to-postgress database access.

Therefore:

- keep CRUD operations scoped to intended entities  
- include or preserve a clear policy boundary between customer-facing UI and internal/admin capabilities

## Coding standards for this project

- Prefer clear modular files over monolithic components.  
- Create reusable type definitions for row models, field configs, filters, sort specs, and grouped display rows.  
- Separate Supabase access code from UI components.  
- Keep transformation functions pure where possible.  
- Make Stage 2 additive; do not rewrite Stage 1 from scratch.  
- Build with production realism, not demo shortcuts.  
- Avoid index-based logic when records can be sorted, filtered, inserted, or deleted.  
- Keep the UI credible for real business users.

## Required outputs from coding agents

When asked to plan or implement work in this repository, prefer this order:

1. overall architecture  
2. schema and relations  
3. TypeScript interfaces  
4. view-state model  
5. component tree  
6. data access layer  
7. Stage 1 implementation  
8. Stage 2 implementation  
9. risks / limitations / tradeoffs

When writing code, include representative code skeletons for the important files, not only prose.

## Project-specific implementation brief

Use this implementation brief as the default instruction set for the repository:

Build a production-quality React \+ TypeScript frontend for a Supabase/PostgreSQL CRM used by non-technical customers.

Use `react-datasheet-grid` as the **mandatory** editable grid component. Do not replace it with another grid library unless explicitly instructed.[^8]

The product goal is to provide a friendlier alternative to the Supabase admin UI for editing CRM data. The initial schema should be a realistic CRM sample with linked relational tables such as Contacts, Leads, Projects, and Tasks.

Important architectural rule: the PostgreSQL schema is relational and flat from day one. Grouping, filtering, and sorting are frontend view behaviors. Grouping must not shape the source database model.

\#\#\# Stage 1 — Grid view, no grouping Build a first version with sorting, filtering, inline editing, row selection, and a right-slide details panel.

Requirements:

- start with `leads` as the primary entity screen  
- fetch flat rows from Supabase  
- show rows in `react-datasheet-grid`  
- support inline editing for allowed fields  
- render single-select values as colored pills  
- render multi-select values as chips  
- support frontend filtering and sorting  
- support selected row \+ right-side details panel  
- keep grid edits and panel edits synchronized  
- persist create, update, delete with optimistic updates

\#\#\# Stage 2 — Add grouping option Add optional single-level client-side grouping as a display/view feature.

Rules:

- grouping is not stored in the database  
- grouping does not change source rows  
- grouping is applied by the customer via the UI  
- support one grouping field at a time  
- use synthetic group header rows in the frontend  
- group headers are display-only and non-persisted  
- preserve editing of real rows while grouped

\#\#\# Output format expected from the agent Return work in this order:

1. architecture  
2. schema  
3. frontend state model  
4. component structure  
5. grid column model  
6. Stage 1 implementation details  
7. Stage 2 implementation details  
8. key code skeletons  
9. risks and tradeoffs

## File guidance for agent instructions

This repository should include both:

- `AGENTS.md` for shared agent-facing project instructions, a common convention across coding tools.[^9][^10]  
- `CLAUDE.md` in the repo root for Claude Code, which reads that file automatically at session start.[^11]

Recommended pattern:

- keep the full project instructions in `AGENTS.md`  
- keep `CLAUDE.md` minimal and project-specific, ideally importing `AGENTS.md` with `@AGENTS.md` so instructions are not duplicated.[^12][^13]

⁂  


[^1]: [https://code.claude.com/docs/en/overview](https://code.claude.com/docs/en/overview)

[^2]: [https://www.guideflow.com/tutorial/how-to-collapse-all-groups-in-a-view-in-airtable](https://www.guideflow.com/tutorial/how-to-collapse-all-groups-in-a-view-in-airtable)

[^3]: [https://community.airtable.com/other-questions-13/shared-views-expanded-by-default-i-want-them-collapsed-13008](https://community.airtable.com/other-questions-13/shared-views-expanded-by-default-i-want-them-collapsed-13008)

[^4]: [https://react-datasheet-grid.netlify.app/docs/features](https://react-datasheet-grid.netlify.app/docs/features)

[^5]: [https://react-datasheet-grid.netlify.app/docs/features](https://react-datasheet-grid.netlify.app/docs/features)

[^6]: [https://react-datasheet-grid.netlify.app/docs/examples/collapsible-rows](https://react-datasheet-grid.netlify.app/docs/examples/collapsible-rows)

[^7]: [https://react-datasheet-grid.netlify.app/docs/features](https://react-datasheet-grid.netlify.app/docs/features)

[^8]: [https://react-datasheet-grid.netlify.app/docs/features](https://react-datasheet-grid.netlify.app/docs/features)

[^9]: [https://www.deployhq.com/blog/ai-coding-config-files-guide](https://www.deployhq.com/blog/ai-coding-config-files-guide)

[^10]: [https://agents.md](https://agents.md)

[^11]: [https://code.claude.com/docs/en/overview](https://code.claude.com/docs/en/overview)

[^12]: [https://nextjs.org/docs/app/guides/ai-agents](https://nextjs.org/docs/app/guides/ai-agents)

[^13]: [https://news.ycombinator.com/item?id=45786738](https://news.ycombinator.com/item?id=45786738)
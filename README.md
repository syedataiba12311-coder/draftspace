# DraftSpace

DraftSpace is a lightweight full-stack collaborative document editor inspired by Google Docs.

The project was built as a time-boxed product engineering exercise focused on demonstrating practical full-stack development, product prioritization, persistence, document editing, access control, and usability.

Rather than attempting to reproduce the entire Google Docs feature set, I prioritized the core document lifecycle:

**Create → Edit → Format → Save → Reopen**

The application is built with **Next.js, TypeScript, Tailwind CSS, Tiptap, and Supabase**.

---

## Live Demo

**Live Product:**  
`ADD_DEPLOYMENT_URL_HERE`

**GitHub Repository:**  
`ADD_GITHUB_REPOSITORY_URL_HERE`

**Walkthrough Video:**  
`ADD_VIDEO_URL_HERE`

---

# Product Overview

DraftSpace provides a simple workspace where users can create and edit rich-text documents through a browser-based interface.

The goal was to deliver a coherent working product slice rather than a feature-complete Google Docs clone.

The main product flow is:

```text
User signs in
      ↓
Dashboard loads
      ↓
Create document
      ↓
Open editor
      ↓
Write + format content
      ↓
Autosave to database
      ↓
Refresh / reopen
      ↓
Content and formatting persist
```

---

# Features Implemented

## Authentication

Users can authenticate through Supabase Auth.

Authenticated sessions are used throughout the application to associate documents with their owners and protect document access.

---

## Document Creation

Users can create new documents directly from the dashboard.

Each document is automatically associated with the authenticated user as its owner.

New documents start with:

```text
Untitled Document
```

and can later be renamed directly from the editor.

---

## Document Dashboard

The dashboard provides a central place to view documents.

It includes:

- Document cards
- Document title
- Last updated information
- Owned documents section
- Shared documents section structure
- New document creation
- Persistent document retrieval

Documents remain available after page refresh because they are stored in Supabase PostgreSQL rather than browser-only state.

---

## Rich-Text Editing

DraftSpace uses **Tiptap** as the editing engine.

The editor currently supports:

- Bold
- Italic
- Underline
- Heading 1
- Heading 2
- Bulleted lists
- Numbered lists
- Undo
- Redo
- Paragraph editing

The editor is intentionally kept lightweight and focused on the formatting tools required by the assignment.

---

## Document Renaming

The document title can be edited directly from the editor.

An empty title automatically falls back to:

```text
Untitled Document
```

A maximum title length is also enforced.

---

## Autosave

Document changes are automatically persisted.

When the user edits the title or document content, DraftSpace waits briefly before saving the latest state.

The interface displays save status:

```text
Saving...
```

followed by:

```text
Saved ✓
```

This provides a more natural document-editing experience than requiring users to repeatedly press a manual Save button.

---

## Persistent Rich-Text Structure

Editor content is stored as structured Tiptap JSON rather than plain text.

For example:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": {
        "level": 1
      },
      "content": [
        {
          "type": "text",
          "text": "Project Plan"
        }
      ]
    }
  ]
}
```

This allows formatting and document structure to survive refreshes and reopening.

---

# Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Tiptap

## Backend

- Next.js Server Components
- Next.js Server Actions
- Supabase

## Database

- PostgreSQL through Supabase

## Authentication

- Supabase Auth

## Deployment

- Vercel

---

# Architecture

DraftSpace uses a deliberately simple architecture suitable for the assignment's 4–6 hour time constraint.

```text
Browser
   │
   ▼
Next.js Application
   │
   ├── Authentication UI
   ├── Dashboard
   ├── Tiptap Editor
   └── Server Actions
          │
          ▼
      Supabase
          │
          ├── Auth
          └── PostgreSQL
                 │
                 ├── profiles
                 ├── documents
                 └── document_shares
```

The decision to use a single Next.js application for both frontend and backend logic reduced unnecessary infrastructure complexity and allowed more time to be spent on the actual product experience.

---

# Database Design

The core data model contains three tables.

## `profiles`

Stores application-level user information.

```text
id
email
display_name
created_at
```

The profile ID corresponds to the authenticated Supabase user ID.

---

## `documents`

Stores document ownership, metadata, and rich-text content.

```text
id
title
content
owner_id
created_at
updated_at
```

The document content is stored as JSON so that rich-text formatting can be preserved.

---

## `document_shares`

Designed to represent document access granted to another user.

```text
id
document_id
user_id
permission
created_at
```

Supported permission values are:

```text
view
edit
```

---

# Authorization

DraftSpace uses Supabase Row Level Security rather than relying only on frontend checks.

The intended access model is:

```text
Document request
       ↓
Is user the owner?
       ↓
      Yes
       ↓
     Allow
```

Otherwise:

```text
Is the document shared with this user?
       ↓
      Yes
       ↓
Check permission
       ↓
Allow appropriate access
```

This architecture keeps authorization enforcement closer to the data layer.

---

# Local Setup

## Requirements

Install:

- Node.js 20.9+
- npm
- Git

A Supabase project is also required.

---

## 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Then:

```bash
cd draftspace
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

Create:

```text
.env.local
```

in the root of the project.

Add:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

An `.env.example` file is included in the repository for reference.

Actual credentials are intentionally excluded from Git.

---

## 4. Configure the database

Run the supplied Supabase SQL schema in:

```text
Supabase Dashboard
→ SQL Editor
```

The database should contain:

```text
profiles
documents
document_shares
```

Row Level Security should also be enabled.

---

## 5. Start the application

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

# Environment Security

The repository intentionally does **not** contain `.env.local`.

Environment credentials are excluded through `.gitignore`.

The repository only provides:

```text
.env.example
```

with variable names and no real credentials.

---

# Product Decisions and Scope

The assignment explicitly encouraged deliberate prioritization under a limited 4–6 hour development window.

I prioritized the functionality that demonstrates the most important document-product behaviors:

```text
Authentication
      ↓
Document creation
      ↓
Rich-text editing
      ↓
Autosave
      ↓
Persistence
      ↓
Ownership / access architecture
```

This meant intentionally avoiding several features that would have significantly increased implementation complexity without improving the core product demonstration proportionally.

---

# Intentionally Deprioritized Features

The following features were not considered essential for the first product slice:

- Real-time collaborative cursors
- CRDT-based simultaneous editing
- Comments
- Document version history
- Offline editing
- Google OAuth
- Advanced role management
- Image embedding
- Document folders
- DOCX export
- Advanced search
- Mobile application
- Presence indicators
- Complex animation
- Full Google Docs-style toolbar

These would be reasonable future enhancements but were intentionally not prioritized within the assignment timebox.

---

# Incomplete / Partial Functionality

Some planned functionality remains partial.

## Sharing UI

The database architecture for document sharing was designed and the `document_shares` model was created.

However, the complete end-to-end sharing interface was not finished within the available development window.

The intended flow was:

```text
Owner
   ↓
Share button
   ↓
Enter registered user's email
   ↓
Select view/edit permission
   ↓
document_shares record created
   ↓
Shared user sees document under "Shared With Me"
```

The dashboard already distinguishes between owned and shared document concepts, but the full user-facing sharing workflow requires additional implementation and validation.

---

## File Import

File upload/import was planned for:

```text
.txt
.md
```

The intended behavior was to convert an uploaded text-based file into an editable DraftSpace document.

This functionality was deprioritized in favor of completing and stabilizing document creation, rich-text editing, persistence, and autosave.

---

## Automated Testing

A meaningful authorization/document-access test was planned.

Due to the time constraint and backend troubleshooting, complete automated test coverage was not finalized.

Manual testing was used to verify the primary document lifecycle.

---

# Supabase Development Constraint

During development, I encountered intermittent Supabase-side errors and limitations while working with the free-tier environment.

Because the assignment was intentionally time-boxed, I chose not to spend a disproportionate amount of the remaining development window troubleshooting infrastructure behavior.

Instead, I prioritized delivering a stable core document workflow and documenting the remaining work transparently.

The application architecture remains designed around Supabase Auth, PostgreSQL, and Row Level Security, and the incomplete features can be completed once the backend environment is operating consistently.

This was a deliberate product-engineering tradeoff:

> Protect the working core experience rather than risk destabilizing completed functionality while attempting to finish every optional surface.

---

# What Is Working

The following functionality was completed and validated during development:

- Authentication setup
- User-linked document ownership
- Document creation
- Document dashboard
- Opening existing documents
- Document renaming
- Rich-text editing
- Bold formatting
- Italic formatting
- Underline formatting
- Heading formatting
- Bulleted lists
- Numbered lists
- Undo and redo
- Autosave behavior
- PostgreSQL document persistence
- Rich-text JSON persistence
- Refresh/reopen persistence
- Basic validation
- Database-level access architecture
- Responsive dashboard/editor structure

---

# What I Would Build With Another 2–4 Hours

The next development priorities would be:

### 1. Complete Sharing

Finish the Share dialog and connect exact-email lookup to `document_shares`.

Then verify the complete flow using two accounts:

```text
User A creates document
      ↓
User A shares document
      ↓
User B logs in
      ↓
Document appears under Shared With Me
      ↓
User B edits document
      ↓
User A sees the persisted update
```

### 2. File Import

Add `.txt` and `.md` import with:

- File type validation
- 2 MB size limit
- Automatic title generation
- Conversion into an editable document

### 3. Automated Tests

Add focused tests around:

- Document ownership
- Shared document access
- Unauthorized document access
- Unsupported file uploads
- Title validation

### 4. Error and Loading States

Add polished toast notifications and skeleton loading states for document operations.

### 5. Production Hardening

Perform additional verification of Sup

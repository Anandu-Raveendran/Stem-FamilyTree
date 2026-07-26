# Family Tree

A full-stack, interactive family tree app: React + Vite + Tailwind on the
front end, Firebase (Auth, Firestore, Storage) on the back end, and a
D3-powered pan/zoom canvas that renders people as single cards or unified
couple cards, grouped by generation.

## Features

- **Public viewing, gated editing** - anyone can browse `/tree/:familyId`;
  only the tree's owner or approved admins can add, edit, or delete people.
- **Google sign-in** with a self-service "Request edit access" flow and an
  admin panel to approve/reject requests or manage admin emails directly.
- **Full-screen D3 canvas** - pan, scroll-zoom, floating zoom controls,
  autocomplete search, click-to-focus, click-empty-space-to-reset.
- **Couple cards** - partners render side-by-side in one card; a person with
  multiple partners gets a separate, discrete couple node per relationship.
- **Transactional relationship edits** - every parent/child or partner link
  is written with a Firestore transaction so both sides of the relationship
  stay in sync, and deleting a person cascades: their Storage photo is
  removed, every reference to them is scrubbed from other members, and their
  document is deleted, all as one atomic batch.
- **Automatic generation numbering** - generation levels are recomputed from
  the graph any time membership changes, so you never set them by hand.
- **Dark mode**, empty-state onboarding, and a friendly 404/invalid-tree page.

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Firebase project's web config
npm run dev
```

### Firebase project setup

1. Create a Firebase project, enable **Authentication -> Google**, enable
   **Firestore**, and enable **Storage**.
2. Copy your web app config into `.env` (see `.env.example`).
3. Deploy the included security rules:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

> The `pendingRequests` approval flow in `AdminRequestModal` approves using
> the requester's UID as a stand-in email if no email lookup is available.
> In production, back this with a small `users/{uid} -> { email }` lookup
> collection populated on first sign-in so admins can grant access by their
> real email address.

## Project structure

```
src/
  config/       Firebase init, env parsing
  services/     Firestore/Storage/Auth API layer (no direct SDK calls in UI)
  context/      AuthContext, ThemeContext, FamilyTreeContext
  hooks/        useAuth, useTheme, useFamilyTree, useD3Tree
  components/
    common/     Navbar, Loader, DarkModeToggle, Modal, Toast
    tree/       TreeCanvas, PersonCard, CoupleCard, SearchBar, ZoomControls
    forms/      PersonForm, RelationshipPicker, ImageUploader
  pages/        HomePage, AddPersonPage, EditPersonPage, ErrorPage, AdminRequestModal
  types/        JSDoc typedefs for Family / Member / TreeNode
```

## Data model

```
families/{familyId}
  id, name, ownerId, adminEmails[], pendingRequests[], createdAt

families/{familyId}/members/{memberId}
  id, name, imageUrl, job, location, houseName,
  dateOfBirth, dateOfDeath, parentIds[], childrenDetails[],
  partnerIds[], generation
```

## Notes on the D3 layout

`useD3Tree` groups the flat member graph into "union" nodes (couples) and
single nodes, builds a synthetic forest root, and runs `d3.hierarchy` +
`d3.tree()` over it. Links are drawn as `d3.linkVertical()` cubic curves from
the bottom of a parent/couple card to the top of each child card. Cards are
plain React components absolutely positioned inside a div that shares the
same CSS transform as the SVG link layer, so the D3 zoom behavior (attached
to the outer container) pans and scales both layers together.

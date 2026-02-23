# Frontend Refactor Plan for Generic Extraction System

## Overview
This plan outlines the steps to refactor the frontend to support the new generic backend architecture (`Category` and `Data` models), replacing the hardcoded `Equipment`, `Pose`, and `Expression` implementations.

## Goals
1.  Replace hardcoded "Equipment", "Pose", and "Expression" pages with a generic "Data" management interface.
2.  Implement a dynamic "Extraction" workflow that adapts to different categories and their fields.
3.  Add a "Category Manager" to allow users to create and edit schemas.
4.  Update the "Generation" page to select assets from the generic Data store.

## Detailed Tasks

### 1. Store & Type Updates
*   **Types:** Create TypeScript interfaces for `Category`, `Data`, and updated `CandidateAsset` (matching backend response).
*   **API Client:** Update API client to use `/api/categories`, `/api/data`, and new `/api/extract` endpoints.
*   **Store:** Refactor or replace `equipmentStore`, `poseStore`, `expressionStore` with a unified `dataStore` that supports filtering by `categoryId`.

### 2. Category Management UI
*   Create a new **Settings > Categories** page.
*   Implement a list view of all categories.
*   Implement a **Category Editor**:
    *   Form to edit name, description, max items.
    *   **Schema Builder:** A UI to add/remove/edit fields (Text, Select, Image).
    *   **Prompt Editor:** A text area (with variable insertion support) to edit the `imagePrompt` template.

### 3. Generic Data Management UI
*   Create a generic `DataPage` component that accepts a `categoryId`.
*   Replace `Equipments.tsx`, `Poses.tsx`, `Expressions.tsx` with instances of `DataPage` (or a single route `/data/:categoryId`).
*   **Data List:**
    *   Render items using a generic card or table.
    *   If the category has an "image" field, display it.
    *   Show other fields as text/badges.
*   **Filtering:** Generic search and filtering based on category fields (e.g., if category has a "select" field, show a dropdown filter).

### 4. Dynamic Extraction Workflow
*   Refactor the **Extraction Dialog**:
    *   **Step 1 (Analyze):**
        *   Call `/api/extract/analyze`.
        *   Display results grouped by Category.
        *   Allow user to select/deselect items across different categories.
    *   **Step 2 (Edit/Refine):**
        *   For each selected item, show a form based on its Category's `fields` schema.
        *   If the category has an "image" field, show an "Extract Image" button (calling `/api/extract/item`).
        *   If text-only, allow direct saving.
    *   **Step 3 (Save):**
        *   Save confirmed items to `Data` table via `/api/data` or `/api/extract/item`.

### 5. Generation Page Updates
*   Update the "Fitting Room" (Generation) UI.
*   Replace specific "Pose" and "Expression" selectors with a generic "Asset Selector" that filters by the appropriate category.
*   Update the "Equipment" selection to query from the `Data` table (filtered by "Equipment" category).
*   Ensure the drag-and-drop or selection logic maps to the new `Generation` -> `Data` M2M relationship.

### 6. Cleanup
*   Remove deprecated pages and components specific to Equipment/Pose/Expression that are no longer needed.
*   Update navigation menu to list enabled categories dynamically (or keep top-level links if preferred, but pointing to the generic route).

## Implementation Strategy
1.  **Phase 1: Read-Only & Management:** Implement Category Manager and Generic Data List (Read/Delete).
2.  **Phase 2: Extraction:** Refactor the extraction wizard to handle dynamic schemas.
3.  **Phase 3: Generation:** Update the Fitting Room to use the new data sources.
4.  **Phase 4: Cleanup:** Remove legacy code.

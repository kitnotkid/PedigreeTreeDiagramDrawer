# 🌳 Pedigree Chart Drawer

A lightning-fast, keyboard-driven web application for rapidly building horizontally expanding tree diagrams and pedigree charts. 

Built with **100% Vanilla Web Technologies**—zero frameworks, zero build tools, and absolutely no backend databases. It runs entirely in your browser, keeping your data completely private and local.

---

## ✨ Key Features

### ⌨️ Keyboard-First Workflow
Design charts at the speed of thought without touching your mouse.
* **`Enter`**: Add a sibling node (below the current node).
* **`Tab`**: Add a child node to the **Right Wing**.
* **`Shift + Tab`**: Add a child node to the **Left Wing**.
* **`Backspace`**: Delete a node (only works when the node is empty to prevent accidental data loss).

### ↔️ Center-Out Architecture
Unlike traditional top-down trees, this app uses a symmetric **Center-Out Layout**. 
* The starting Root Node is anchored in the absolute center of the infinite canvas.
* The tree expands horizontally outward in both directions using a clever combination of CSS Flexbox (`row` and `row-reverse`).
* Connecting lines are drawn dynamically using **pure SVG cubic bezier curves** that recalculate instantly on any layout or text change.

### 🗂️ Multi-Tab Workspace
Manage multiple independent charts within the same session.
* Seamlessly switch between tabs without losing state.
* **Add Tab (`＋`)**: Instantly generates a fresh, blank canvas.
* **Rename Tab**: Double-click any tab name to rename it inline.
* **Close Tab (`×`)**: Safely deletes a tab (auto-jumps to the nearest open tab to prevent a broken UI).

### 💾 Serverless Data Persistence (Local Storage)
Your data never leaves your computer.
* **Silent Auto-Save**: The app debounces and automatically saves your workspace to the browser's `localStorage` when you type, add/delete nodes, or switch tabs. 
* **Session Recovery**: Close the browser by accident? Refreshing the page instantly restores your exact workspace, active tab, and UI state.
* **JSON Export/Import**: Download your entire multi-tab workspace as a single `.json` file to back it up or share it. Upload a `.json` file to instantly restore a previous workspace.
* **Nuke Button (`🗑 Clear`)**: Completely wipe your browser's local storage and start fresh with one click.

### 🎨 Color Inheritance & Styling
* A bottom toolbar pinned to the viewport provides instant access to background and text colors.
* Nodes dynamically inherit colors from their parents.
* Features standard color swatches and a native system color picker (`<input type="color">`) for custom hex codes.

---

## 🛠️ Technical Architecture & Rules

This project strictly adheres to the following constraints to ensure long-term maintainability and blazing-fast performance:

1. **NO FRAMEWORKS:** No React, Vue, Angular, or Tailwind.
2. **NO BUILD TOOLS:** No Webpack, Vite, Babel, or npm dependencies.
3. **ALL VANILLA:** Pure HTML5, CSS3, and JavaScript (ES6+).
4. **ALL LOCAL:** Relies entirely on the browser's `localStorage` API.
5. **PURE SVG:** No canvas drawing libraries (like Fabric.js or D3). We do the math manually and inject `<path>` elements into an overlay layer.

### File Structure
The entire application lives in just three core files:
* `index.html` - The structural shell, toolbars, and default blank canvas template.
* `css/style.css` - UI styling, Flexbox architectural rules (`wing-left` / `wing-right`), and hover states.
* `js/app.js` - The engine. Handles DOM manipulation, SVG math, keyboard event delegation, the tab array (`tabsData`), and the `localStorage` JSON serialization.

---

## 🚀 Development Roadmap (The Master Blueprint)

- [x] **Phase 1: Foundation.** Basic DOM nodes, typing, and CSS Flexbox structure.
- [x] **Phase 2: Keyboard Flow.** `Enter`, `Tab`, `Shift+Tab`, and `Backspace` logic.
- [x] **Phase 3: Visuals & Links.** Dynamic SVG bezier curves and inherited color pickers.
- [x] **Phase 4: Multi-Tab & Center-Out Layout.** Left/Right wing branching, tab arrays, UI tab switching, and inline renaming.
- [x] **Phase 5: Data Persistence.** `localStorage` auto-save, JSON Export/Import, and Workspace Wipe.
- [ ] **Phase 6: Canvas Navigation & HTML Export.** Infinite canvas panning/zooming and standalone `.html` file export. *(Next Up)*
- [ ] **Phase 7: Custom Linkage (Ghost Layer).** A separate SVG layer for drawing non-hierarchical straight lines (e.g., marriages, adoptions) between arbitrary nodes.

---

## 💻 How to Run

Because this project uses zero build tools and zero server-side code, running it is wonderfully simple:

1. Clone or download the repository or using link https://pedigreetreediagramdrawer.pages.dev/
2. Open `index.html` directly in any modern web browser (Chrome, Firefox, Safari, Edge).
3. Start typing!

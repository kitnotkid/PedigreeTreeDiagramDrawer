# Pedigree Chart Drawer

A lightweight, keyboard-driven web application for rapidly building horizontally expanding tree diagrams. Built with vanilla HTML, CSS, JavaScript, and dynamic SVGs.

Hosted live on Cloudflare Pages: [Insert your .pages.dev link here]

## ⚡ Current Features (Phases 1, 2 & 3 Completed)
* **Keyboard-Driven Flow:** `Tab` (Add Child), `Enter` (Add Sibling), `Shift + Enter` (New Line in Text), `Backspace` (Delete Empty Node & Branch).
* **Dynamic SVG Rendering:** Automatically calculates and draws smooth, curly Bezier curves between parent and child nodes in real-time.
* **Auto-Centering Layout:** Parent nodes automatically center themselves vertically relative to their expanding child branches.
* **Color Customization & Inheritance:** 
    * A persistent top toolbar features preset color swatches and native custom color pickers (🎨) for both node background and text color.
    * New nodes automatically inherit the exact background and text colors of their parent node upon creation.

---

## 🗺️ Development Roadmap

### Phase 4: Multi-Tab Workspace & Center-Out Layout
* **Center-Out Architecture:** The Starting Node anchors to the absolute center of an infinite canvas. Branches grow symmetrically outward into distinct "Left Wing" and "Right Wing" structures using explicit keyboard controls (`Tab` vs `Shift+Tab`), allowing for fluid, balanced spatial expansion.
* **The Tab Bar:** Integrated into the top toolbar, allowing users to create, rename, and switch between multiple independent pedigree charts within a single session without limits.

### Phase 5: Data Persistence (Auto-Save & File Export)
* **Silent Auto-Save (`localStorage`):** The application silently saves the workspace state to the browser's local memory whenever a structural change occurs (adding/deleting nodes) or a text box loses focus, ensuring zero accidental data loss.
* **Workspace-Level Export/Import:** Manually save the entire session (all open tabs, text, tree structure, colors, and custom links) into a highly portable `.json` project file, or upload one to instantly restore a workspace.
* **Reset Workspace:** A master "Nuke" button to easily clear the local memory and close all tabs at once, returning to a pristine blank slate.

### Phase 6: Canvas Navigation & Interactive Export
* **Infinite Canvas (Pan & Zoom):** Implement click-and-drag canvas panning and mouse-wheel/pinch zooming for massive charts that expand well beyond the screen boundaries.
* **Standalone HTML Export:** Generate a "freeze-dried", read-only `.html` file of the current chart. This export strips away editing controls but injects the pan/zoom logic, creating a perfectly scalable, interactive viewer that can be emailed and opened natively on any desktop or mobile device without external software.

### Phase 7: Special Connections (Link Mode)
* **The Ghost Layer:** An independent, transparent SVG overlay dedicated to drawing custom, non-hierarchical connections (e.g., marriages, partnerships, adoptions).
* **Multi-Directional Linkage:** Users can toggle "Link Mode" to draw distinct, dashed lines between any two nodes. This supports both one-to-many (diverging) and many-to-one (converging) relationships without disrupting the perfect geometry of the main HTML tree layout.

---

## 🛠️ Tech Stack
* **HTML5, CSS3, Vanilla JS:** Zero frameworks, zero build tools, zero dependencies.
* **SVG:** Dynamic path generation via JavaScript DOM manipulation.
* **Deployment:** Cloudflare Pages (Static Site).

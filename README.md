# PedigreeTreeDiagramDrawer
Simple Pedigree Tree Diagram Drawing Board

# Pedigree Chart Drawer

A lightweight, keyboard-driven web application for rapidly building horizontal pedigree charts and tree diagrams. Built with vanilla HTML, CSS, JavaScript, and dynamic SVGs.

Hosted live on Cloudflare Pages: [Insert your .pages.dev link here]

## ⚡ Current Features (Phases 1 & 2 Completed)
*   **Keyboard-Driven Flow:**
    *   `Tab`: Add a child node (expands horizontally to the right).
    *   `Enter`: Add a sibling node (expands vertically downwards).
    *   `Shift + Enter`: Add a new line of text within the current node.
    *   `Backspace`: Delete a node and its branch (if the text box is empty).
*   **Dynamic SVG Rendering:** Automatically draws smooth, curly Bezier curves between parent and child nodes in real-time.
*   **Auto-Centering Layout:** Parent nodes automatically center themselves relative to their expanding child branches.
*   **Mouse Controls:** Hover over any node to reveal quick-add buttons (⬆️ for sibling, ➡️ for child).

---

## 🗺️ Development Roadmap

### Phase 3: Styling & Customization (Up Next)
*   **Node Formatting:** Add a floating control panel to change the background color and text color of individual nodes using native HTML color pickers.

### Phase 4: Multi-Tab Workspace
*   **Unlimited Workspaces:** Add a tab bar at the top of the screen to create, rename, and switch between multiple independent pedigree charts within the same session.

### Phase 5: Data Persistence
*   **JSON Export:** Save the entire workspace (all tabs, text, structure, and colors) into a `.json` project file.
*   **JSON Import:** Upload a `.json` file to instantly restore the workspace and continue editing.

### Phase 6: Canvas Navigation & Document Export
*   **Pan & Zoom:** Implement click-and-drag canvas panning and mouse-wheel zooming for large charts.
*   **PDF/Image Export:** Add a one-click export feature to generate a non-editable `.pdf` or `.png` of the active chart for easy sharing and printing.

### Phase 7: Special Connections
*   **Link Mode:** A toggle tool that allows users to click two distinct nodes and draw a custom, dashed line between them (e.g., to indicate a marriage or partnership) without altering the main tree hierarchy.

---

## 🛠️ Tech Stack
*   **HTML5:** Structure and contenteditable text nodes.
*   **CSS3:** Flexbox layout and UI styling.
*   **Vanilla JavaScript:** Keyboard event listeners, DOM manipulation, and SVG math calculations.
*   **SVG:** Dynamic path generation for connecting lines.
*   **Deployment:** Cloudflare Pages (Static Site).
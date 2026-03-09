# Pedigree Chart Drawer

A lightweight, keyboard-driven web application for rapidly building horizontally expanding tree diagrams. Built with vanilla HTML, CSS, JavaScript, and dynamic SVGs.

Hosted live on Cloudflare Pages: [Insert your .pages.dev link here]

## ⚡ Current Features (Phases 1, 2 & 3 Completed)
*   **Keyboard-Driven Flow:** `Tab` (Add Child), `Enter` (Add Sibling), `Shift + Enter` (New Line in Text), `Backspace` (Delete Empty Node & Branch).
*   **Dynamic SVG Rendering:** Automatically calculates and draws smooth, curly Bezier curves between parent and child nodes in real-time.
*   **Auto-Centering Layout:** Parent nodes automatically center themselves vertically relative to their expanding child branches.
*   **Mouse Controls:** Hover over any node to reveal quick-add action buttons (⬆️ for sibling, ➡️ for child).
*   **Color Customization & Inheritance:** 
    *   A persistent top toolbar features preset color swatches and native custom color pickers (🎨) for both node background and text color.
    *   New nodes automatically inherit the exact background and text colors of their parent node upon creation.

---

## 🗺️ Development Roadmap

### Phase 4: Multi-Tab Workspace (Up Next)
*   **The Tab Bar:** Integrated into the top toolbar. 
*   **Functionality:** Create, rename, and switch between multiple independent pedigree charts within the same browser session without refreshing or losing data.

### Phase 5: Data Persistence
*   **Workspace-Level Export:** Save the entire session (all open tabs, text, tree structure, and colors) into a single `.json` project file.
*   **JSON Import:** Upload a `.json` file to instantly restore the entire workspace and continue editing.

### Phase 6: Canvas Navigation & Document Export
*   **Pan & Zoom:** Implement click-and-drag canvas panning and mouse-wheel zooming for large charts that expand beyond the screen.
*   **PDF/Image Export:** Add a one-click export feature to generate a non-editable `.pdf` or `.png` of the currently active chart for easy sharing and printing.

### Phase 7: Special Connections
*   **Link Mode:** A toggle tool that allows users to click two distinct nodes and draw a custom, dashed line between them to indicate special relationships (e.g., marriages, partnerships) without altering the main tree hierarchy.

---

## 🛠️ Tech Stack
*   **HTML5, CSS3, Vanilla JS:** Zero frameworks, zero build tools.
*   **SVG:** Dynamic path generation via JavaScript DOM manipulation.
*   **Deployment:** Cloudflare Pages (Static Site).
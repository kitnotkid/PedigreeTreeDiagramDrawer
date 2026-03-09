# Pedigree Chart Drawer

A lightweight, keyboard-driven web application for rapidly building horizontally expanding tree diagrams. Built with vanilla HTML, CSS, JavaScript, and dynamic SVGs.

Hosted live on Cloudflare Pages: [Insert your .pages.dev link here]

## ⚡ Current Features (Phases 1, 2 & 3 Completed)
*   **Keyboard-Driven Flow:** `Tab` (Child), `Enter` (Sibling), `Shift + Enter` (New Line), `Backspace` (Delete Empty).
*   **Dynamic SVG Rendering:** Automatically draws smooth, curly Bezier curves between parent and child nodes.
*   **Color Customization & Inheritance:** Nodes inherit the background and text color of their parent upon creation. Colors can be changed via the top toolbar presets or custom color picker.

---

## 🗺️ Development Roadmap

### Phase 4: Multi-Tab Workspace
*   **The Tab Bar:** Integrated into the top toolbar. 
*   **Functionality:** Create, rename, and switch between multiple independent pedigree charts within the same browser session without refreshing.

### Phase 5: Data Persistence
*   **Workspace-Level Export:** Save the entire session (all open tabs, text, structure, and colors) into a single `.json` project file.
*   **JSON Import:** Upload a `.json` file to instantly restore the entire workspace and continue editing.

### Phase 6: Canvas Navigation & Document Export
*   **Pan & Zoom:** Implement click-and-drag canvas panning and mouse-wheel zooming for large charts.
*   **PDF/Image Export:** Add a one-click export feature to generate a non-editable `.pdf` of the currently active chart for easy sharing and printing.

### Phase 7: Special Connections
*   **Link Mode:** A toggle tool that allows users to click two distinct nodes and draw a custom, dashed line between them to indicate special relationships (e.g., marriages, partnerships) without altering the main tree hierarchy.

---

## 🛠️ Tech Stack
*   **HTML5, CSS3, Vanilla JS:** Zero frameworks, zero build tools.
*   **SVG:** Dynamic path generation.
*   **Deployment:** Cloudflare Pages.
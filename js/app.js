/* ═══════════════════════════════════════════════════════════
   PEDIGREE CHART DRAWER  —  app.js  (Phase 4)

   Architecture overview
   ─────────────────────
   • tabsData[]   In-memory store. Each entry: { id, name, html, nodeCounter }
   • currentTabId Tracks which tab is active.
   • nodeCounter  Global counter for unique node IDs, synced with the active tab.
   • activeNode   The currently focused .node element (for color picker binding).

   Key behaviours
   ──────────────
   • Tab / Shift+Tab → add child to wing-right / wing-left
   • Enter           → add sibling (same parent list)
   • Backspace on empty node → delete node & return focus
   • drawLines()     Redraws ALL SVG bezier connectors after any structural change.
   • saveCurrentTab() snapshots canvas innerHTML into tabsData before switching.
   • loadTab()        restores a snapshot and re-wires all live event listeners.
═══════════════════════════════════════════════════════════ */

'use strict';

// ─── STATE ────────────────────────────────────────────────
const BLANK_CANVAS_TEMPLATE = () => `
<svg id="connections"></svg>
<div class="branch" id="root">
    <div class="children wing-left"></div>
    <div class="node-container">
        <div class="node active"
             contenteditable="true"
             data-id="node-1"
             data-placeholder="Starting Node"
             data-bg="#ffffff"
             data-text="#000000"></div>
        <div class="controls">
            <button class="btn-add btn-child-left"  title="Add Left Child (Shift+Tab)">◀</button>
            <button class="btn-add btn-child-right" title="Add Right Child (Tab)">▶</button>
        </div>
    </div>
    <div class="children wing-right"></div>
</div>
`.trim();

let tabsData = [
    {
        id: 'tab-1',
        name: 'Chart 1',
        html: '',           // populated on first saveCurrentTab()
        nodeCounter: 1
    }
];

let currentTabId = 'tab-1';
let nodeCounter  = 1;
let activeNode   = null;

// ─── HELPERS: DOM shortcuts ───────────────────────────────
const canvas       = () => document.getElementById('canvas');
const tabContainer = () => document.getElementById('tab-container');

// ─── NODE SELECTION ───────────────────────────────────────
/**
 * Mark a node as the active selection.
 * Syncs the bottom-toolbar color pickers to its stored colors.
 */
function selectNode(node) {
    if (activeNode && activeNode !== node) {
        activeNode.classList.remove('active');
    }
    activeNode = node;
    activeNode.classList.add('active');

    document.getElementById('bg-color-custom').value  = activeNode.dataset.bg   || '#ffffff';
    document.getElementById('text-color-custom').value = activeNode.dataset.text || '#000000';
}

// ─── NODE FACTORY ─────────────────────────────────────────
/**
 * Build a new branch element for a NON-ROOT node.
 *
 * Structure:
 *   .branch
 *     .node-container
 *       .node  (contenteditable)
 *       .controls
 *         .btn-sibling  ⬆
 *         .btn-child    ▶
 *     .children         (receives future child branches)
 *
 * @param {string} bgColor   - inherited fill color
 * @param {string} textColor - inherited text color
 * @returns {{ branch: HTMLElement, node: HTMLElement }}
 */
function createBranch(bgColor = '#ffffff', textColor = '#000000') {
    nodeCounter++;

    // --- branch wrapper ---
    const branch = document.createElement('div');
    branch.className = 'branch';

    // --- node container ---
    const nodeContainer = document.createElement('div');
    nodeContainer.className = 'node-container';

    // --- the node itself ---
    const node = document.createElement('div');
    node.className = 'node';
    node.contentEditable = 'true';
    node.dataset.id   = `node-${nodeCounter}`;
    node.dataset.bg   = bgColor;
    node.dataset.text = textColor;
    node.style.backgroundColor = bgColor;
    node.style.color = textColor;

    // --- hover controls ---
    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.innerHTML = `
        <button class="btn-add btn-sibling" title="Add Sibling (Enter)">↕</button>
        <button class="btn-add btn-child"   title="Add Child (Tab)">▶</button>
    `;

    nodeContainer.appendChild(node);
    nodeContainer.appendChild(controls);

    // --- children container (right side for non-root branches) ---
    const children = document.createElement('div');
    children.className = 'children';

    branch.appendChild(nodeContainer);
    branch.appendChild(children);

    return { branch, node };
}

// ─── SVG LINE DRAWING ─────────────────────────────────────
/**
 * Redraws every bezier connector line in the SVG overlay.
 *
 * Algorithm (per branch):
 *   1. Find the parent .node inside this branch (direct child only).
 *   2. Find all direct .children containers.
 *   3. For each child .branch inside those containers:
 *        • Determine if it's on the left wing (so the line hooks leftward).
 *        • Compute start point: right edge of parent node (or left edge if left wing).
 *        • Compute end point:   left edge of child node  (or right edge if left wing).
 *        • Draw a cubic bezier with horizontal control points for a smooth S-curve.
 *
 * The SVG element is re-sized to match the canvas scroll dimensions so
 * lines are never clipped during deep expansion.
 */
function drawLines() {
    const svg = document.getElementById('connections');
    if (!svg) return;

    const cvs = canvas();
    svg.innerHTML = '';

    // Resize SVG to cover the full scrollable canvas
    const cw = cvs.scrollWidth;
    const ch = cvs.scrollHeight;
    svg.style.width  = cw + 'px';
    svg.style.height = ch + 'px';
    svg.setAttribute('viewBox', `0 0 ${cw} ${ch}`);

    const svgRect = svg.getBoundingClientRect();

    document.querySelectorAll('.branch').forEach(branch => {
        // Only the DIRECT node-container > node
        const parentNode = branch.querySelector(':scope > .node-container > .node');
        if (!parentNode) return;

        const parentRect = parentNode.getBoundingClientRect();

        // Both wing-left and wing-right are direct .children of this branch
        const childContainers = branch.querySelectorAll(':scope > .children');

        childContainers.forEach(container => {
            const childBranches = container.querySelectorAll(':scope > .branch');
            if (childBranches.length === 0) return;

            /*
             * Determine drawing direction.
             * A container is "left-facing" if:
             *   a) it has the class wing-left itself, OR
             *   b) the branch is nested inside a .wing-left subtree
             *      (in which case row-reverse is in effect).
             */
            const isLeftWing = container.classList.contains('wing-left')
                             || !!container.closest('.wing-left');

            // Parent connector point
            const startX = isLeftWing
                ? (parentRect.left - svgRect.left)          // left edge
                : (parentRect.right - svgRect.left);         // right edge
            const startY = (parentRect.top + parentRect.height / 2) - svgRect.top;

            childBranches.forEach(childBranch => {
                const childNode = childBranch.querySelector(':scope > .node-container > .node');
                if (!childNode) return;

                const childRect = childNode.getBoundingClientRect();

                // Child connector point
                const endX = isLeftWing
                    ? (childRect.right - svgRect.left)       // right edge (facing center)
                    : (childRect.left  - svgRect.left);       // left edge  (facing center)
                const endY = (childRect.top + childRect.height / 2) - svgRect.top;

                // Horizontal bezier: control points share the midpoint X
                const midX = (startX + endX) / 2;
                const d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', d);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', '#a0aec0');
                path.setAttribute('stroke-width', '2');
                path.setAttribute('stroke-linecap', 'round');

                svg.appendChild(path);
            });
        });
    });
}

// ─── TAB MANAGEMENT ───────────────────────────────────────

/**
 * Snapshot the current canvas HTML and nodeCounter into tabsData.
 * Called before every tab switch and before adding a new tab.
 */
function saveCurrentTab() {
    const tab = tabsData.find(t => t.id === currentTabId);
    if (tab) {
        tab.html        = canvas().innerHTML;
        tab.nodeCounter = nodeCounter;
    }
}

/**
 * Load a tab by ID:
 *   1. Save current work.
 *   2. Restore the target tab's HTML into the canvas.
 *   3. Update visual tab highlights.
 *   4. Re-focus the first node and redraw lines.
 */
function loadTab(tabId) {
    saveCurrentTab();
    currentTabId = tabId;

    const tabData = tabsData.find(t => t.id === tabId);
    if (!tabData) return;

    // If this tab has never been rendered, use the blank template
    canvas().innerHTML = tabData.html || BLANK_CANVAS_TEMPLATE();
    nodeCounter = tabData.nodeCounter || 1;

    // Update tab highlight
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const tabEl = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    if (tabEl) tabEl.classList.add('active');

    // Select the first visible node
    activeNode = null;
    const firstNode = canvas().querySelector('.node');
    if (firstNode) selectNode(firstNode);

    // Lines must be redrawn after DOM is settled
    requestAnimationFrame(drawLines);
}

// ─── TAB BAR EVENT DELEGATION ─────────────────────────────

tabContainer().addEventListener('click', function (e) {
    // --- CLOSE TAB LOGIC ---
    if (e.target.classList.contains('btn-close-tab')) {
        const tabEl = e.target.closest('.tab');
        const tabIdToDelete = tabEl.dataset.tabId;
        
        // 1. Remove from data array
        tabsData = tabsData.filter(t => t.id !== tabIdToDelete);
        
        // 2. Remove the physical tab from the toolbar
        tabEl.remove();
        
        // 3. If we closed the active tab, we need to load a new one
        if (tabIdToDelete === currentTabId) {
            if (tabsData.length > 0) {
                // Load the last available tab
                loadTab(tabsData[tabsData.length - 1].id);
            } else {
                // We closed the very last tab! Simulate clicking the "+" button.
                document.getElementById('btn-add-tab').click();
            }
        }
        return; // Stop here so we don't trigger the tab switch logic below
    }

    // --- SWITCH TAB LOGIC ---
    const tab = e.target.closest('.tab');
    if (!tab) return;
    
    // Don't switch if the tab name is currently being edited
    const tabName = tab.querySelector('.tab-name');
    if (tabName && tabName.contentEditable === 'true') return;

    const clickedId = tab.dataset.tabId;
    if (clickedId && clickedId !== currentTabId) {
        loadTab(clickedId);
    }
});

// Double-click → inline rename (now targeting .tab-name)
tabContainer().addEventListener('dblclick', function (e) {
    const tabName = e.target.closest('.tab-name');
    if (!tabName) return;

    tabName.contentEditable = 'true';
    const range = document.createRange();
    range.selectNodeContents(tabName);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    tabName.focus();
});

// Prevent Enter from inserting a line break in tab rename
tabContainer().addEventListener('keydown', function (e) {
    const tabName = e.target.closest('.tab-name');
    if (!tabName || tabName.contentEditable !== 'true') return;

    if (e.key === 'Enter') {
        e.preventDefault();
        tabName.blur();          // triggers focusout → save name
    }
    if (e.key === 'Escape') {
        tabName.contentEditable = 'false';
    }
});

// Save renamed tab on blur
tabContainer().addEventListener('focusout', function (e) {
    const tabName = e.target.closest('.tab-name');
    if (!tabName || tabName.contentEditable !== 'true') return;

    tabName.contentEditable = 'false';
    const newName = tabName.textContent.trim() || 'Chart';
    tabName.textContent = newName;

    const tabEl = tabName.closest('.tab');
    const tabData = tabsData.find(t => t.id === tabEl.dataset.tabId);
    if (tabData) tabData.name = newName;
});

// "+" button → handled by _onAddTabClick (defined in Phase 5 block below)

// ─── CANVAS KEYBOARD HANDLER ──────────────────────────────

canvas().addEventListener('keydown', function (e) {
    if (!e.target.classList.contains('node')) return;

    const currentNode   = e.target;
    const currentBranch = currentNode.closest('.branch');
    const bgColor       = currentNode.dataset.bg   || '#ffffff';
    const textColor     = currentNode.dataset.text || '#000000';

    // ── Shift+Enter: just allow a real newline (let the browser handle it)
    if (e.key === 'Enter' && e.shiftKey) {
        // No special action; browser inserts <br> / newline naturally.
        // Redraw after the DOM settles.
        setTimeout(drawLines, 10);
        return;
    }

    // ── Enter (no shift): add SIBLING
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (currentBranch.id === 'root') return;   // root has no siblings

        const { branch: newBranch, node: newNode } = createBranch(bgColor, textColor);
        currentBranch.parentElement.insertBefore(newBranch, currentBranch.nextSibling);
        newNode.focus();
        drawLines();
        return;
    }

    // ── Tab / Shift+Tab: add CHILD (right wing or left wing)
    if (e.key === 'Tab') {
        e.preventDefault();

        let childrenContainer;

        if (currentBranch.id === 'root') {
            // Root has explicit wing-left and wing-right containers
            childrenContainer = currentBranch.querySelector(
                e.shiftKey ? '.wing-left' : '.wing-right'
            );
        } else {
            /*
             * Non-root branches have a single .children div.
             * We append to it regardless of shift (the branch's
             * position in the tree determines its direction).
             */
            childrenContainer = currentBranch.querySelector(':scope > .children');
        }

        if (!childrenContainer) return;

        const { branch: newBranch, node: newNode } = createBranch(bgColor, textColor);
        childrenContainer.appendChild(newBranch);
        newNode.focus();
        drawLines();
        return;
    }

    // ── Backspace on empty node: DELETE node
    if (e.key === 'Backspace' && currentNode.textContent.trim() === '') {
        e.preventDefault();
        if (currentBranch.id === 'root') return;    // never delete root

        const prevBranch   = currentBranch.previousElementSibling;
        const nextBranch   = currentBranch.nextElementSibling;
        const parentBranch = currentBranch.parentElement.closest('.branch');
        const parentNode   = parentBranch
            ? parentBranch.querySelector(':scope > .node-container > .node')
            : null;

        currentBranch.remove();

        // Return focus intelligently
        if (prevBranch && prevBranch.classList.contains('branch')) {
            const n = prevBranch.querySelector(':scope > .node-container > .node');
            if (n) n.focus();
        } else if (nextBranch && nextBranch.classList.contains('branch')) {
            const n = nextBranch.querySelector(':scope > .node-container > .node');
            if (n) n.focus();
        } else if (parentNode) {
            parentNode.focus();
        }

        drawLines();
    }
});

// ─── CANVAS CLICK HANDLER (hover buttons) ─────────────────

canvas().addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-add');
    if (!btn) return;

    const currentBranch    = btn.closest('.branch');
    const parentNodeEl     = currentBranch.querySelector(':scope > .node-container > .node');
    const bgColor          = parentNodeEl ? (parentNodeEl.dataset.bg   || '#ffffff') : '#ffffff';
    const textColor        = parentNodeEl ? (parentNodeEl.dataset.text || '#000000') : '#000000';

    if (btn.classList.contains('btn-sibling')) {
        // ── Add sibling (same parent list)
        if (currentBranch.id === 'root') return;
        const { branch: newBranch, node: newNode } = createBranch(bgColor, textColor);
        currentBranch.parentElement.insertBefore(newBranch, currentBranch.nextSibling);
        newNode.focus();

    } else if (btn.classList.contains('btn-child-left')) {
        // ── ROOT: add child to left wing
        const container = currentBranch.querySelector(':scope > .wing-left');
        if (!container) return;
        const { branch: newBranch, node: newNode } = createBranch(bgColor, textColor);
        container.appendChild(newBranch);
        newNode.focus();

    } else if (btn.classList.contains('btn-child-right')) {
        // ── ROOT: add child to right wing
        const container = currentBranch.querySelector(':scope > .wing-right');
        if (!container) return;
        const { branch: newBranch, node: newNode } = createBranch(bgColor, textColor);
        container.appendChild(newBranch);
        newNode.focus();

    } else if (btn.classList.contains('btn-child')) {
        // ── Non-root: add child (appends to this node's .children)
        const container = currentBranch.querySelector(':scope > .children');
        if (!container) return;
        const { branch: newBranch, node: newNode } = createBranch(bgColor, textColor);
        container.appendChild(newBranch);
        newNode.focus();
    }

    drawLines();
});

// ─── NODE FOCUS → SELECT ─────────────────────────────────

canvas().addEventListener('focusin', function (e) {
    if (e.target.classList.contains('node')) {
        selectNode(e.target);
    }
});

// Redraw after any text input (node size may have changed)
canvas().addEventListener('input', function (e) {
    if (e.target.classList.contains('node')) {
        drawLines();
    }
});

// ─── COLOR PICKER EVENTS ──────────────────────────────────

document.getElementById('bottom-toolbar').addEventListener('click', function (e) {
    const swatch = e.target.closest('.swatch');
    if (!swatch || !activeNode) return;

    const color = swatch.dataset.color;

    if (swatch.closest('#bg-swatches')) {
        activeNode.style.backgroundColor = color;
        activeNode.dataset.bg = color;
        document.getElementById('bg-color-custom').value = color;
    } else if (swatch.closest('#text-swatches')) {
        activeNode.style.color = color;
        activeNode.dataset.text = color;
        document.getElementById('text-color-custom').value = color;
    }
});

document.getElementById('bg-color-custom').addEventListener('input', function (e) {
    if (!activeNode) return;
    activeNode.style.backgroundColor = e.target.value;
    activeNode.dataset.bg = e.target.value;
});

document.getElementById('text-color-custom').addEventListener('input', function (e) {
    if (!activeNode) return;
    activeNode.style.color = e.target.value;
    activeNode.dataset.text = e.target.value;
});

// ─── RESIZE HANDLER ───────────────────────────────────────

window.addEventListener('resize', drawLines);

/* ═══════════════════════════════════════════════════════════
   PHASE 5 — DATA PERSISTENCE
   ═══════════════════════════════════════════════════════════

   saveWorkspace()
   ───────────────
   Serialises { tabsData, currentTabId } to localStorage under
   the key 'pedigree_workspace'. Always snapshots the live canvas
   first via saveCurrentTab() so the active tab's latest HTML is
   included. A debounced wrapper (_debouncedSave) prevents flooding
   localStorage on rapid keystrokes.

   loadWorkspace()
   ───────────────
   Called once at startup. Checks localStorage for saved data and,
   if found, rebuilds the tab-bar DOM and restores the active tab.
   Falls back to the default blank state if nothing is stored.

   Export  → builds a Blob from JSON.stringify(tabsData) and
             triggers a synthetic <a> click to download the file.

   Import  → reads a .json file, validates the shape, overwrites
             tabsData + currentTabId, rebuilds the UI, and saves.

   Clear   → confirms, wipes localStorage, resets in-memory state,
             rebuilds a single blank tab.
═══════════════════════════════════════════════════════════ */

const LS_KEY = 'pedigree_workspace';

// ─── TOAST HELPER ─────────────────────────────────────────

/**
 * Show a brief status message just above the bottom toolbar.
 * @param {string} msg
 * @param {number} [duration=1800] — ms before it fades out
 */
function showToast(msg, duration = 1800) {
    let toast = document.getElementById('save-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'save-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('visible'), duration);
}

// ─── SAVE TO LOCALSTORAGE ──────────────────────────────────

/**
 * Persist the full workspace to localStorage.
 * Always call saveCurrentTab() first so the live canvas is included.
 */
function saveWorkspace() {
    saveCurrentTab();   // flush live DOM → tabsData before stringifying
    try {
        const payload = {
            tabsData,
            currentTabId
        };
        localStorage.setItem(LS_KEY, JSON.stringify(payload));
        showToast('✓ Saved');
    } catch (err) {
        // localStorage can throw if storage quota is exceeded
        console.warn('saveWorkspace failed:', err);
        showToast('⚠ Save failed (storage full?)');
    }
}

// Debounced version for high-frequency events (typing)
let _saveTimer = null;
function debouncedSave(delay = 800) {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(saveWorkspace, delay);
}

// ─── LOAD FROM LOCALSTORAGE ────────────────────────────────

/**
 * Attempt to restore a previously saved workspace.
 * Returns true if a workspace was loaded, false for fresh start.
 *
 * Rebuilding the tab bar:
 *   The HTML toolbar only has the original "Chart 1" tab baked in.
 *   We wipe those children and regenerate them from tabsData so
 *   the DOM always mirrors the in-memory array.
 */
function loadWorkspace() {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;

    let payload;
    try {
        payload = JSON.parse(raw);
    } catch {
        console.warn('Corrupted localStorage payload — starting fresh.');
        localStorage.removeItem(LS_KEY);
        return false;
    }

    // Basic shape validation
    if (!Array.isArray(payload.tabsData) || payload.tabsData.length === 0) return false;

    tabsData     = payload.tabsData;
    currentTabId = payload.currentTabId || tabsData[0].id;

    // Rebuild the tab-bar DOM from scratch
    _rebuildTabBarDOM();

    // Restore the active tab's canvas content
    const activeTabData = tabsData.find(t => t.id === currentTabId) || tabsData[0];
    currentTabId = activeTabData.id;

    canvas().innerHTML = activeTabData.html || BLANK_CANVAS_TEMPLATE();
    nodeCounter = activeTabData.nodeCounter || 1;

    // Highlight the correct tab
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tabId === currentTabId);
    });

    // Select the first node and redraw
    activeNode = null;
    const firstNode = canvas().querySelector('.node');
    if (firstNode) selectNode(firstNode);

    requestAnimationFrame(drawLines);
    return true;
}

/**
 * Rebuild ALL tab-bar <div class="tab"> elements from tabsData.
 * Clears the container first, then re-inserts tabs + the "+" button.
 */
function _rebuildTabBarDOM() {
    const container = tabContainer();
    container.innerHTML = ''; // wipe existing tabs and the + button

    tabsData.forEach(tabData => {
        const tabEl = document.createElement('div');
        tabEl.className = 'tab';
        tabEl.dataset.tabId = tabData.id;
        tabEl.innerHTML = `
            <span class="tab-name">${_escapeHTML(tabData.name)}</span>
            <button class="btn-close-tab" title="Close Tab">×</button>
        `;
        container.appendChild(tabEl);
    });

    // Re-append the "+" button
    const addBtn = document.createElement('button');
    addBtn.id    = 'btn-add-tab';
    addBtn.title = 'New Chart';
    addBtn.textContent = '＋';
    container.appendChild(addBtn);

    // The "+" button's event listener is wired below via delegation,
    // but the original direct binding is gone after innerHTML clear.
    // Re-attach it here.
    addBtn.addEventListener('click', _onAddTabClick);
}

/** Simple HTML escaper to avoid XSS when re-injecting tab names */
function _escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── EXPORT ───────────────────────────────────────────────

/**
 * Download the full workspace as a .json file.
 * The downloaded file contains the same structure as localStorage:
 *   { tabsData: [...], currentTabId: "tab-xxx" }
 */
function exportWorkspace() {
    saveCurrentTab(); // ensure the live canvas is captured first
    const payload = JSON.stringify({ tabsData, currentTabId }, null, 2);
    const blob    = new Blob([payload], { type: 'application/json' });
    const url     = URL.createObjectURL(blob);

    const a    = document.createElement('a');
    a.href     = url;
    a.download = `pedigree-charts-${_dateStamp()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('⬇ Exported successfully', 2200);
}

function _dateStamp() {
    const d = new Date();
    return `${d.getFullYear()}${_pad(d.getMonth()+1)}${_pad(d.getDate())}-${_pad(d.getHours())}${_pad(d.getMinutes())}`;
}
function _pad(n) { return String(n).padStart(2, '0'); }

// ─── IMPORT ───────────────────────────────────────────────

/**
 * Read a .json file from the file input, validate, overwrite workspace.
 */
function importWorkspace(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        let payload;
        try {
            payload = JSON.parse(e.target.result);
        } catch {
            alert('Import failed: the file is not valid JSON.');
            return;
        }

        // Validate shape
        if (!Array.isArray(payload.tabsData) || payload.tabsData.length === 0) {
            alert('Import failed: JSON does not contain a valid workspace.');
            return;
        }

        // Overwrite in-memory state
        tabsData     = payload.tabsData;
        currentTabId = payload.currentTabId || tabsData[0].id;

        // Rebuild the UI
        _rebuildTabBarDOM();

        const activeTabData = tabsData.find(t => t.id === currentTabId) || tabsData[0];
        currentTabId = activeTabData.id;
        canvas().innerHTML = activeTabData.html || BLANK_CANVAS_TEMPLATE();
        nodeCounter = activeTabData.nodeCounter || 1;

        document.querySelectorAll('.tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tabId === currentTabId);
        });

        activeNode = null;
        const firstNode = canvas().querySelector('.node');
        if (firstNode) selectNode(firstNode);

        requestAnimationFrame(drawLines);

        // Persist the imported data immediately
        saveWorkspace();
        showToast('⬆ Workspace imported', 2200);
    };

    reader.readAsText(file);
}

// ─── CLEAR / NUKE ─────────────────────────────────────────

/**
 * Wipe localStorage and reset to a single blank tab.
 * Asks for confirmation first.
 */
function clearWorkspace() {
    const confirmed = window.confirm(
        'This will permanently delete all your charts and clear saved data.\n\nAre you sure?'
    );
    if (!confirmed) return;

    localStorage.removeItem(LS_KEY);

    // Reset in-memory state
    tabsData     = [{ id: 'tab-1', name: 'Chart 1', html: BLANK_CANVAS_TEMPLATE(), nodeCounter: 1 }];
    currentTabId = 'tab-1';
    nodeCounter  = 1;
    activeNode   = null;

    // Rebuild a single-tab UI
    _rebuildTabBarDOM();

    canvas().innerHTML = BLANK_CANVAS_TEMPLATE();

    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tabId === 'tab-1');
    });

    const firstNode = canvas().querySelector('.node');
    if (firstNode) {
        selectNode(firstNode);
        firstNode.focus();
    }

    requestAnimationFrame(drawLines);
    showToast('🗑 Workspace cleared', 2200);
}

// ─── RE-BIND "+" BUTTON ─────────────────────────────────────
/*
 * The original "btn-add-tab" click listener was attached directly to the
 * element in the static HTML. After _rebuildTabBarDOM() recreates that
 * element, the old listener is gone. We extract the handler into a named
 * function so _rebuildTabBarDOM() can re-attach it cleanly.
 */
function _onAddTabClick() {
    saveCurrentTab();

    const newTabId   = 'tab-' + Date.now();
    const newTabName = 'Chart ' + (tabsData.length + 1);

    tabsData.push({
        id:          newTabId,
        name:        newTabName,
        html:        BLANK_CANVAS_TEMPLATE(),
        nodeCounter: 1
    });

    // Insert new tab element before the "+" button
    const addBtn = document.getElementById('btn-add-tab');
    const tabEl  = document.createElement('div');
    tabEl.className     = 'tab';
    tabEl.dataset.tabId = newTabId;
    tabEl.innerHTML = `
        <span class="tab-name">${_escapeHTML(newTabName)}</span>
        <button class="btn-close-tab" title="Close Tab">×</button>
    `;
    addBtn.parentNode.insertBefore(tabEl, addBtn);

    loadTab(newTabId);
    saveWorkspace();   // ← Phase 5: persist after adding tab
}

// Re-wire the static "+" button to use the named handler.
// (This covers the initial page load before any _rebuildTabBarDOM call.)
document.getElementById('btn-add-tab').addEventListener('click', _onAddTabClick);

// ─── PHASE 5: WIRE UP WORKSPACE CONTROL BUTTONS ───────────

document.getElementById('btn-export').addEventListener('click', exportWorkspace);

document.getElementById('btn-import-file').addEventListener('change', function (e) {
    importWorkspace(e.target.files[0]);
    // Reset the input so importing the same file twice works
    this.value = '';
});

document.getElementById('btn-clear').addEventListener('click', clearWorkspace);

// ─── PHASE 5: HOOK SAVES INTO EXISTING LISTENERS ──────────
/*
 * We patch saves onto the existing delegated event listeners using
 * additional listeners rather than modifying the originals — keeping
 * the Phase 4 code untouched and the diffs easy to review.
 */

// Save after any structural keyboard action (Enter/Tab/Backspace handled in canvas keydown)
canvas().addEventListener('keydown', function (e) {
    if (!e.target.classList.contains('node')) return;
    const structural = ['Enter', 'Tab', 'Backspace'];
    if (structural.includes(e.key)) {
        // Delay until after the Phase 4 handler has mutated the DOM
        setTimeout(saveWorkspace, 50);
    }
});

// Debounced save on text input (typing)
canvas().addEventListener('input', function (e) {
    if (e.target.classList.contains('node')) {
        debouncedSave(900);
    }
});

// Save when user finishes editing a node (blur/focusout)
canvas().addEventListener('focusout', function (e) {
    if (e.target.classList.contains('node')) {
        debouncedSave(200);
    }
});

// Save after color changes
document.getElementById('bottom-toolbar').addEventListener('click', function (e) {
    if (e.target.classList.contains('swatch')) debouncedSave(300);
});
document.getElementById('bg-color-custom').addEventListener('change', function () {
    debouncedSave(300);
});
document.getElementById('text-color-custom').addEventListener('change', function () {
    debouncedSave(300);
});

// Save after tab rename (piggybacks on the focusout handler in Phase 4)
tabContainer().addEventListener('focusout', function (e) {
    if (e.target.classList.contains('tab-name')) {
        setTimeout(saveWorkspace, 50);
    }
});

// Save after tab closed (the Phase 4 handler mutates tabsData synchronously)
tabContainer().addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-close-tab')) {
        setTimeout(saveWorkspace, 50);
    }
});

// ─── INITIALISE ───────────────────────────────────────────

window.addEventListener('load', function () {
    /*
     * Startup sequence:
     *   1. Try to restore from localStorage.
     *   2. If nothing saved, use the default blank canvas already in
     *      the HTML, wire up the root node, and draw lines.
     *
     * NOTE: The original "btn-add-tab" direct listener is intentionally
     * replaced by _onAddTabClick above. We must NOT re-add it here.
     */
    const restored = loadWorkspace();

    if (!restored) {
        // Fresh start — sync the static tab's nodeCounter
        tabsData[0].nodeCounter = nodeCounter;
        tabsData[0].html = canvas().innerHTML;

        const rootNode = canvas().querySelector('.node');
        if (rootNode) {
            selectNode(rootNode);
            rootNode.focus();
        }
        drawLines();
    }
});
let nodeCounter = 1;
let activeNode = null;

// --- TAB MANAGEMENT STATE ---
let tabs = [];
let activeTabId = null;

const initialChartHTML = `
    <svg id="connections"></svg>
    <div class="branch" id="root">
        <div class="node-container">
            <div class="node active" contenteditable="true" data-id="node-1" data-placeholder="Starting Node" data-bg="#ffffff" data-text="#000000"></div>
            <div class="controls">
                <button class="btn-add btn-sibling" title="Add Sibling">⬆️</button>
                <button class="btn-add btn-child" title="Add Child">➡️</button>
            </div>
        </div>
        <div class="children"></div>
    </div>
`;

function createNewTab(title = "New Chart") {
    const id = 'tab-' + Date.now();
    const newTab = {
        id: id,
        title: title,
        content: initialChartHTML,
        activeNodeId: 'node-1'
    };
    tabs.push(newTab);
    renderTabs();
    switchTab(id);
}

function saveCurrentTabState() {
    if (!activeTabId) return;
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab) {
        // Save the entire inner content of the canvas
        currentTab.content = document.getElementById('canvas').innerHTML;
        // Save which node was active by ID
        currentTab.activeNodeId = activeNode ? activeNode.dataset.id : null;
    }
}

function switchTab(tabId) {
    if (activeTabId === tabId) return;

    // 1. Save state of current tab
    saveCurrentTabState();

    // 2. Update Active ID
    activeTabId = tabId;
    const tabData = tabs.find(t => t.id === tabId);

    // 3. Update DOM
    const canvas = document.getElementById('canvas');
    canvas.innerHTML = tabData.content;

    // 4. Restore Active Node Reference
    if (tabData.activeNodeId) {
        const node = canvas.querySelector(`[data-id="${tabData.activeNodeId}"]`);
        if (node) selectNode(node);
    }

    renderTabs();
    
    // 5. Force a redraw of SVG lines
    setTimeout(drawLines, 0);
}

function closeTab(tabId, e) {
    e.stopPropagation();
    if (tabs.length === 1) return; // Keep at least one tab
    
    const index = tabs.findIndex(t => t.id === tabId);
    tabs = tabs.filter(t => t.id !== tabId);
    
    if (activeTabId === tabId) {
        activeTabId = tabs[Math.max(0, index - 1)].id;
        const tabData = tabs.find(t => t.id === activeTabId);
        document.getElementById('canvas').innerHTML = tabData.content;
    }
    renderTabs();
    drawLines();
}

function renderTabs() {
    const list = document.getElementById('tab-list');
    list.innerHTML = '';
    
    tabs.forEach(tab => {
        const tabEl = document.createElement('div');
        tabEl.className = `tab ${tab.id === activeTabId ? 'active' : ''}`;
        tabEl.onclick = () => switchTab(tab.id);
        
        const label = document.createElement('span');
        label.className = 'tab-label';
        label.textContent = tab.title;
        label.contentEditable = true;
        label.onblur = (e) => { tab.title = e.target.textContent; };
        // Prevent tab switch when clicking to rename
        label.onclick = (e) => e.stopPropagation(); 
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'tab-close';
        closeBtn.innerHTML = '✖';
        closeBtn.onclick = (e) => closeTab(tab.id, e);
        
        tabEl.appendChild(label);
        tabEl.appendChild(closeBtn);
        list.appendChild(tabEl);
    });
}

// --- CORE LOGIC (Modified to support tab-swapping) ---

function selectNode(node) {
    if (activeNode) activeNode.classList.remove('active');
    activeNode = node;
    activeNode.classList.add('active');
    
    document.getElementById('bg-color-custom').value = activeNode.dataset.bg || "#ffffff";
    document.getElementById('text-color-custom').value = activeNode.dataset.text || "#000000";
}

function createBranch(bgColor = "#ffffff", textColor = "#000000") {
    nodeCounter++;
    const branch = document.createElement('div');
    branch.className = 'branch';
    
    const nodeContainer = document.createElement('div');
    nodeContainer.className = 'node-container';

    const node = document.createElement('div');
    node.className = 'node';
    node.contentEditable = 'true';
    node.dataset.id = `node-${Date.now()}-${nodeCounter}`; // Unique IDs across tabs
    
    node.dataset.bg = bgColor;
    node.dataset.text = textColor;
    node.style.backgroundColor = bgColor;
    node.style.color = textColor;

    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.innerHTML = `
        <button class="btn-add btn-sibling" title="Add Sibling">⬆️</button>
        <button class="btn-add btn-child" title="Add Child">➡️</button>
    `;

    nodeContainer.appendChild(node);
    nodeContainer.appendChild(controls);
    
    const children = document.createElement('div');
    children.className = 'children';

    branch.appendChild(nodeContainer);
    branch.appendChild(children);
    return { branch, node };
}

function drawLines() {
    const svg = document.getElementById('connections');
    const canvas = document.getElementById('canvas');
    if (!svg || !canvas) return;

    svg.innerHTML = ''; 
    svg.style.width = canvas.scrollWidth + 'px';
    svg.style.height = canvas.scrollHeight + 'px';

    const branches = canvas.querySelectorAll('.branch');
    const svgRect = svg.getBoundingClientRect();

    branches.forEach(branch => {
        const parentNode = branch.querySelector(':scope > .node-container > .node');
        const childrenContainer = branch.querySelector(':scope > .children');
        const childBranches = childrenContainer.querySelectorAll(':scope > .branch');
        
        if (!parentNode || childBranches.length === 0) return;

        const parentRect = parentNode.getBoundingClientRect();
        const startX = parentRect.right - svgRect.left;
        const startY = parentRect.top + (parentRect.height / 2) - svgRect.top;

        childBranches.forEach(childBranch => {
            const childNode = childBranch.querySelector(':scope > .node-container > .node');
            if (!childNode) return;

            const childRect = childNode.getBoundingClientRect();
            const endX = childRect.left - svgRect.left;
            const endY = childRect.top + (childRect.height / 2) - svgRect.top;

            const controlX1 = startX + (endX - startX) / 2;
            const controlY1 = startY;
            const controlX2 = startX + (endX - startX) / 2;
            const controlY2 = endY;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', '#a0aec0'); 
            path.setAttribute('stroke-width', '2');
            svg.appendChild(path);
        });
    });
}

// --- EVENT LISTENERS ---

document.getElementById('btn-new-tab').addEventListener('click', () => createNewTab());

document.getElementById('canvas').addEventListener('focusin', (e) => {
    if (e.target.classList.contains('node')) selectNode(e.target);
});

document.getElementById('canvas').addEventListener('keydown', function(e) {
    if (!e.target.classList.contains('node')) return;
    const currentNode = e.target;
    const currentBranch = currentNode.closest('.branch');
    const currentBg = currentNode.dataset.bg;
    const currentText = currentNode.dataset.text;

    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); 
        if (currentBranch.id === 'root') return; 
        const { branch, node } = createBranch(currentBg, currentText); 
        currentBranch.parentElement.insertBefore(branch, currentBranch.nextSibling);
        node.focus();
        drawLines();
    }
    if (e.key === 'Tab') {
        e.preventDefault(); 
        const childrenContainer = currentBranch.querySelector('.children');
        const { branch, node } = createBranch(currentBg, currentText); 
        childrenContainer.appendChild(branch);
        node.focus();
        drawLines();
    }
    if (e.key === 'Backspace' && currentNode.textContent.trim() === '') {
        if (currentBranch.id === 'root') return;
        e.preventDefault();
        const prevSibling = currentBranch.previousElementSibling;
        const parentNode = currentBranch.parentElement.closest('.branch')?.querySelector('.node');
        currentBranch.remove(); 
        if (prevSibling) prevSibling.querySelector('.node').focus();
        else if (parentNode) parentNode.focus();
        drawLines();
    }
});

document.getElementById('canvas').addEventListener('input', drawLines);

document.getElementById('canvas').addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-sibling') || e.target.classList.contains('btn-child')) {
        const currentBranch = e.target.closest('.branch');
        const node = currentBranch.querySelector(':scope > .node-container > .node');
        const { branch, node: newNode } = createBranch(node.dataset.bg, node.dataset.text);

        if (e.target.classList.contains('btn-sibling')) {
            if (currentBranch.id === 'root') return;
            currentBranch.parentElement.insertBefore(branch, currentBranch.nextSibling);
        } else {
            currentBranch.querySelector('.children').appendChild(branch);
        }
        newNode.focus();
        drawLines();
    }
});

// Toolbar Color Handlers
document.getElementById('toolbar').addEventListener('click', (e) => {
    if (e.target.classList.contains('swatch') && activeNode) {
        const color = e.target.dataset.color;
        if (e.target.closest('#bg-swatches')) {
            activeNode.style.backgroundColor = color;
            activeNode.dataset.bg = color;
        } else {
            activeNode.style.color = color;
            activeNode.dataset.text = color;
        }
    }
});

document.getElementById('bg-color-custom').addEventListener('input', (e) => {
    if (activeNode) { activeNode.style.backgroundColor = e.target.value; activeNode.dataset.bg = e.target.value; }
});
document.getElementById('text-color-custom').addEventListener('input', (e) => {
    if (activeNode) { activeNode.style.color = e.target.value; activeNode.dataset.text = e.target.value; }
});

window.addEventListener('resize', drawLines);

// Init
window.onload = () => {
    createNewTab("Primary Chart");
};
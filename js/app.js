let tabs = [];
let activeTabId = null;
let nodeCounter = 1;
let activeNode = null;

const CANVAS = document.getElementById('canvas');

function initApp() {
    createNewTab("Default Chart");
}

function createNewTab(name) {
    const id = 'tab-' + Date.now();
    const newTab = {
        id: id,
        name: name,
        html: `
            <svg id="connections"></svg>
            <div class="branch" id="root">
                <div class="left-wing"></div>
                <div class="node-container">
                    <div class="node active" contenteditable="true" data-id="node-1" data-bg="#ffffff" data-text="#000000" data-placeholder="Starting Node"></div>
                    <div class="controls">
                        <button class="btn-add btn-left" title="Add Left Child">⬅️</button>
                        <button class="btn-add btn-sibling" title="Add Sibling">⬆️</button>
                        <button class="btn-add btn-child" title="Add Right Child">➡️</button>
                    </div>
                </div>
                <div class="right-wing"></div>
            </div>
        `
    };
    tabs.push(newTab);
    switchTab(id);
    // Center the scroll on load
    setTimeout(() => {
        const wrapper = document.getElementById('canvas-wrapper');
        wrapper.scrollLeft = (CANVAS.offsetWidth - wrapper.offsetWidth) / 2;
        wrapper.scrollTop = (CANVAS.offsetHeight - wrapper.offsetHeight) / 2;
    }, 50);
}

function switchTab(id) {
    if (activeTabId) {
        const current = tabs.find(t => t.id === activeTabId);
        if (current) current.html = CANVAS.innerHTML;
    }
    activeTabId = id;
    const target = tabs.find(t => t.id === id);
    CANVAS.innerHTML = target.html;
    
    const node = CANVAS.querySelector('.node.active') || CANVAS.querySelector('.node');
    if (node) selectNode(node);

    renderTabBar();
    setTimeout(drawLines, 10);
}

function renderTabBar() {
    const bar = document.getElementById('tab-bar');
    bar.innerHTML = '';
    tabs.forEach(tab => {
        const el = document.createElement('div');
        el.className = `tab ${tab.id === activeTabId ? 'active' : ''}`;
        
        // Tab Label (ContentEditable for renaming)
        const label = document.createElement('span');
        label.className = 'tab-label';
        label.contentEditable = true;
        label.textContent = tab.name;
        
        // Prevent tab switching when clicking to rename
        label.onclick = (e) => e.stopPropagation();
        
        // Update state on rename
        label.oninput = (e) => { tab.name = e.target.textContent; };

        const closeBtn = document.createElement('span');
        closeBtn.className = 'tab-close';
        closeBtn.textContent = ' ✕';
        closeBtn.onclick = (e) => { e.stopPropagation(); closeTab(tab.id); };

        el.onclick = () => switchTab(tab.id);
        el.appendChild(label);
        el.appendChild(closeBtn);
        bar.appendChild(el);
    });
}

function closeTab(id) {
    if (tabs.length === 1) return;
    tabs = tabs.filter(t => t.id !== id);
    if (activeTabId === id) switchTab(tabs[0].id);
    else renderTabBar();
}

function selectNode(node) {
    if (activeNode) activeNode.classList.remove('active');
    activeNode = node;
    activeNode.classList.add('active');
    document.getElementById('bg-color-custom').value = node.dataset.bg || "#ffffff";
    document.getElementById('text-color-custom').value = node.dataset.text || "#000000";
}

// Corrected Branch Creation: Every branch gets a .children container
function createBranch(bgColor = "#ffffff", textColor = "#000000") {
    nodeCounter++;
    const branch = document.createElement('div');
    branch.className = 'branch';
    const id = `node-${Date.now()}-${nodeCounter}`;
    branch.innerHTML = `
        <div class="node-container">
            <div class="node" contenteditable="true" data-id="${id}" data-bg="${bgColor}" data-text="${textColor}" style="background-color:${bgColor}; color:${textColor}"></div>
            <div class="controls">
                <button class="btn-add btn-sibling" title="Add Sibling">⬆️</button>
                <button class="btn-add btn-child" title="Add Child">➡️</button>
            </div>
        </div>
        <div class="children"></div>
    `;
    return { branch, node: branch.querySelector('.node') };
}

function drawLines() {
    const svg = document.getElementById('connections');
    if (!svg) return;
    svg.innerHTML = '';
    svg.setAttribute('width', CANVAS.scrollWidth);
    svg.setAttribute('height', CANVAS.scrollHeight);
    const svgRect = svg.getBoundingClientRect();

    document.querySelectorAll('.branch').forEach(branch => {
        const parentNode = branch.querySelector(':scope > .node-container > .node');
        if (!parentNode) return;

        const parentRect = parentNode.getBoundingClientRect();
        const childContainers = branch.querySelectorAll(':scope > .children, :scope > .left-wing, :scope > .right-wing');

        childContainers.forEach(container => {
            // Determine if this container is on the left lineage
            const isLeftLineage = container.classList.contains('left-wing') || container.closest('.left-wing');
            const children = container.querySelectorAll(':scope > .branch > .node-container > .node');

            children.forEach(child => {
                const childRect = child.getBoundingClientRect();
                
                // If left lineage, lines come out of the left side of parent, into right side of child
                const startX = (isLeftLineage ? parentRect.left : parentRect.right) - svgRect.left;
                const startY = (parentRect.top + parentRect.height / 2) - svgRect.top;
                const endX = (isLeftLineage ? childRect.right : childRect.left) - svgRect.left;
                const endY = (childRect.top + childRect.height / 2) - svgRect.top;

                const cp1x = startX + (endX - startX) * 0.5;
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp1x} ${endY}, ${endX} ${endY}`);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', '#cbd5e0');
                path.setAttribute('stroke-width', '2');
                svg.appendChild(path);
            });
        });
    });
}

// --- Interaction Logic ---
CANVAS.addEventListener('click', e => {
    if (!e.target.classList.contains('btn-add')) return;
    const currentBranch = e.target.closest('.branch');
    const { branch: newBr, node: newNode } = createBranch(activeNode.dataset.bg, activeNode.dataset.text);
    
    if (e.target.classList.contains('btn-left')) {
        currentBranch.querySelector('.left-wing').appendChild(newBr);
    } else if (e.target.classList.contains('btn-child')) {
        // If root, use right-wing. If child, use standard .children container
        const container = currentBranch.id === 'root' ? currentBranch.querySelector('.right-wing') : currentBranch.querySelector('.children');
        container.appendChild(newBr);
    } else if (e.target.classList.contains('btn-sibling')) {
        if (currentBranch.id !== 'root') currentBranch.parentNode.insertBefore(newBr, currentBranch.nextSibling);
    }
    newNode.focus();
    drawLines();
});

CANVAS.addEventListener('keydown', e => {
    if (!activeNode) return;
    const branch = activeNode.closest('.branch');

    if (e.key === 'Tab') {
        e.preventDefault();
        const { branch: newBr, node } = createBranch(activeNode.dataset.bg, activeNode.dataset.text);
        if (e.shiftKey) {
            // Shift + Tab adds to left
            const container = branch.id === 'root' ? branch.querySelector('.left-wing') : branch.querySelector('.children');
            container.appendChild(newBr);
        } else {
            // Tab adds to right
            const container = branch.id === 'root' ? branch.querySelector('.right-wing') : branch.querySelector('.children');
            container.appendChild(newBr);
        }
        node.focus();
        drawLines();
    }
    // Enter and Backspace logic remains the same...
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (branch.id === 'root') return;
        const { branch: newBr, node } = createBranch(activeNode.dataset.bg, activeNode.dataset.text);
        branch.parentNode.insertBefore(newBr, branch.nextSibling);
        node.focus();
        drawLines();
    }
});

// Re-init listeners
document.getElementById('btn-add-tab').onclick = () => createNewTab("New Chart");
window.addEventListener('resize', drawLines);
CANVAS.addEventListener('input', drawLines);
CANVAS.addEventListener('focusin', e => e.target.classList.contains('node') && selectNode(e.target));

window.onload = initApp;
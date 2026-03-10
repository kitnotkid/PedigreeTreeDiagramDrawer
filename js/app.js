let tabs = [];
let activeTabId = null;
let nodeCounter = 1;
let activeNode = null;

const CANVAS = document.getElementById('canvas');

// --- Tab Management ---

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
                    <div class="node active" contenteditable="true" data-id="node-1" data-bg="#ffffff" data-text="#000000" data-placeholder="Root Node"></div>
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
}

function switchTab(id) {
    // Save current
    if (activeTabId) {
        const current = tabs.find(t => t.id === activeTabId);
        if (current) current.html = CANVAS.innerHTML;
    }

    activeTabId = id;
    const target = tabs.find(t => t.id === id);
    CANVAS.innerHTML = target.html;

    // Re-bind active node
    const node = CANVAS.querySelector('.node.active');
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
        el.innerHTML = `<span>${tab.name}</span><span class="tab-close" data-id="${tab.id}">✕</span>`;
        el.onclick = () => switchTab(tab.id);
        el.querySelector('.tab-close').onclick = (e) => {
            e.stopPropagation();
            closeTab(tab.id);
        };
        bar.appendChild(el);
    });
}

function closeTab(id) {
    if (tabs.length === 1) return;
    tabs = tabs.filter(t => t.id !== id);
    if (activeTabId === id) switchTab(tabs[0].id);
    else renderTabBar();
}

// --- Core Functionality ---

function selectNode(node) {
    if (activeNode) activeNode.classList.remove('active');
    activeNode = node;
    activeNode.classList.add('active');
    document.getElementById('bg-color-custom').value = node.dataset.bg || "#ffffff";
    document.getElementById('text-color-custom').value = node.dataset.text || "#000000";
}

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
    const svgRect = svg.getBoundingClientRect();
    
    // Scale SVG to match scrollable area
    svg.setAttribute('width', CANVAS.scrollWidth);
    svg.setAttribute('height', CANVAS.scrollHeight);

    document.querySelectorAll('.branch').forEach(branch => {
        const parentNode = branch.querySelector(':scope > .node-container > .node');
        if (!parentNode) return;

        const parentRect = parentNode.getBoundingClientRect();
        
        // Find all possible child containers (Left Wing, Right Wing, or standard Children)
        const childContainers = branch.querySelectorAll(':scope > .children, :scope > .left-wing, :scope > .right-wing');

        childContainers.forEach(container => {
            const isLeft = container.classList.contains('left-wing') || container.closest('.left-wing');
            const children = container.querySelectorAll(':scope > .branch > .node-container > .node');

            children.forEach(child => {
                const childRect = child.getBoundingClientRect();
                
                // Calculate start and end points relative to SVG
                const startX = (isLeft ? parentRect.left : parentRect.right) - svgRect.left;
                const startY = (parentRect.top + parentRect.height / 2) - svgRect.top;
                const endX = (isLeft ? childRect.right : childRect.left) - svgRect.left;
                const endY = (childRect.top + childRect.height / 2) - svgRect.top;

                const cp1x = startX + (endX - startX) * 0.5;
                const cp2x = startX + (endX - startX) * 0.5;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', '#cbd5e0');
                path.setAttribute('stroke-width', '2');
                svg.appendChild(path);
            });
        });
    });
}

// --- Listeners ---

CANVAS.addEventListener('focusin', e => e.target.classList.contains('node') && selectNode(e.target));

CANVAS.addEventListener('keydown', e => {
    if (!activeNode) return;
    const branch = activeNode.closest('.branch');
    const isLeft = activeNode.closest('.left-wing');

    if (e.key === 'Tab') {
        e.preventDefault();
        const wingClass = e.shiftKey ? '.left-wing' : (branch.id === 'root' ? '.right-wing' : '.children');
        const container = branch.querySelector(wingClass);
        const { branch: newBr, node } = createBranch(activeNode.dataset.bg, activeNode.dataset.text);
        container.appendChild(newBr);
        node.focus();
        drawLines();
    }

    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (branch.id === 'root') return;
        const { branch: newBr, node } = createBranch(activeNode.dataset.bg, activeNode.dataset.text);
        branch.parentNode.insertBefore(newBr, branch.nextSibling);
        node.focus();
        drawLines();
    }

    if (e.key === 'Backspace' && activeNode.textContent === '') {
        if (branch.id === 'root') return;
        e.preventDefault();
        const parentNode = branch.parentNode.closest('.branch')?.querySelector('.node');
        branch.remove();
        if (parentNode) parentNode.focus();
        drawLines();
    }
});

CANVAS.addEventListener('click', e => {
    if (!e.target.classList.contains('btn-add')) return;
    const branch = e.target.closest('.branch');
    const { branch: newBr, node } = createBranch(activeNode.dataset.bg, activeNode.dataset.text);
    
    if (e.target.classList.contains('btn-child')) {
        branch.querySelector(branch.id === 'root' ? '.right-wing' : '.children').appendChild(newBr);
    } else if (e.target.classList.contains('btn-left')) {
        branch.querySelector('.left-wing').appendChild(newBr);
    } else if (e.target.classList.contains('btn-sibling')) {
        if (branch.id !== 'root') branch.parentNode.insertBefore(newBr, branch.nextSibling);
    }
    node.focus();
    drawLines();
});

document.getElementById('btn-add-tab').onclick = () => createNewTab("New Chart");
document.getElementById('bg-swatches').onclick = e => {
    if (e.target.dataset.color && activeNode) {
        activeNode.style.backgroundColor = e.target.dataset.color;
        activeNode.dataset.bg = e.target.dataset.color;
    }
};

window.addEventListener('resize', drawLines);
CANVAS.addEventListener('input', drawLines);

window.onload = initApp;
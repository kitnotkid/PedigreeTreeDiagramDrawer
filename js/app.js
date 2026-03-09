let nodeCounter = 1;
let activeNode = null; // Tracks which node is currently selected

// --- NEW: Select Node Logic ---
function selectNode(node) {
    if (activeNode) activeNode.classList.remove('active');
    activeNode = node;
    activeNode.classList.add('active');
    
    // Update toolbar pickers to match the clicked node
    document.getElementById('bg-color-custom').value = activeNode.dataset.bg;
    document.getElementById('text-color-custom').value = activeNode.dataset.text;
}

// --- UPDATED: createBranch now accepts colors for inheritance ---
function createBranch(bgColor = "#ffffff", textColor = "#000000") {
    nodeCounter++;
    const branch = document.createElement('div');
    branch.className = 'branch';
    
    const nodeContainer = document.createElement('div');
    nodeContainer.className = 'node-container';

    const node = document.createElement('div');
    node.className = 'node';
    node.contentEditable = 'true';
    node.dataset.id = `node-${nodeCounter}`;
    
    // Apply inherited colors
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

// --- SVG Curly Line Drawer (Unchanged) ---
function drawLines() {
    const svg = document.getElementById('connections');
    const canvas = document.getElementById('canvas');
    svg.innerHTML = ''; 
    
    svg.style.width = canvas.scrollWidth + 'px';
    svg.style.height = canvas.scrollHeight + 'px';

    const branches = document.querySelectorAll('.branch');
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

// --- Event Listeners ---

// Handle Toolbar Color Changes
document.getElementById('bg-color').addEventListener('input', function(e) {
    if (activeNode) {
        activeNode.style.backgroundColor = e.target.value;
        activeNode.dataset.bg = e.target.value;
    }
});

document.getElementById('text-color').addEventListener('input', function(e) {
    if (activeNode) {
        activeNode.style.color = e.target.value;
        activeNode.dataset.text = e.target.value;
    }
});

// Focus/Click a node to make it active
document.getElementById('canvas').addEventListener('focusin', function(e) {
    if (e.target.classList.contains('node')) {
        selectNode(e.target);
    }
});

document.getElementById('canvas').addEventListener('keydown', function(e) {
    if (!e.target.classList.contains('node')) return;

    const currentNode = e.target;
    const currentBranch = currentNode.closest('.branch');
    
    // Grab colors for inheritance
    const currentBg = currentNode.dataset.bg;
    const currentText = currentNode.dataset.text;

    if (e.key === 'Enter' && e.shiftKey) {
        setTimeout(drawLines, 10);
        return; 
    }

    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); 
        if (currentBranch.id === 'root') return; 
        const newElements = createBranch(currentBg, currentText); // Inherit!
        currentBranch.parentElement.insertBefore(newElements.branch, currentBranch.nextSibling);
        newElements.node.focus();
        drawLines();
    }

    if (e.key === 'Tab') {
        e.preventDefault(); 
        const childrenContainer = currentBranch.querySelector('.children');
        const newElements = createBranch(currentBg, currentText); // Inherit!
        childrenContainer.appendChild(newElements.branch);
        newElements.node.focus();
        drawLines();
    }

    if (e.key === 'Backspace') {
        if (currentNode.textContent.trim() === '') {
            e.preventDefault();
            if (currentBranch.id === 'root') return; 
            
            const prevSibling = currentBranch.previousElementSibling;
            const parentNode = currentBranch.parentElement.closest('.branch')?.querySelector('.node');
            
            currentBranch.remove(); 

            if (prevSibling) prevSibling.querySelector('.node').focus();
            else if (parentNode) parentNode.focus();
            
            drawLines();
        }
    }
});

document.getElementById('canvas').addEventListener('input', drawLines);

document.getElementById('canvas').addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-sibling') || e.target.classList.contains('btn-child')) {
        const currentBranch = e.target.closest('.branch');
        const parentNode = currentBranch.querySelector(':scope > .node-container > .node');
        const currentBg = parentNode.dataset.bg;
        const currentText = parentNode.dataset.text;

        if (e.target.classList.contains('btn-sibling')) {
            if (currentBranch.id === 'root') return;
            const newElements = createBranch(currentBg, currentText);
            currentBranch.parentElement.insertBefore(newElements.branch, currentBranch.nextSibling);
            newElements.node.focus();
        } else {
            const childrenContainer = currentBranch.querySelector('.children');
            const newElements = createBranch(currentBg, currentText);
            childrenContainer.appendChild(newElements.branch);
            newElements.node.focus();
        }
        drawLines();
    }
});

// --- Event Listeners ---

// 1. Preset Swatch Clicks
document.getElementById('toolbar').addEventListener('click', function(e) {
    if (e.target.classList.contains('swatch')) {
        const selectedColor = e.target.dataset.color;
        
        // Check if it's a BG swatch or Text swatch based on its parent
        if (e.target.closest('#bg-swatches') && activeNode) {
            activeNode.style.backgroundColor = selectedColor;
            activeNode.dataset.bg = selectedColor;
            document.getElementById('bg-color-custom').value = selectedColor; // Sync custom picker
        } 
        else if (e.target.closest('#text-swatches') && activeNode) {
            activeNode.style.color = selectedColor;
            activeNode.dataset.text = selectedColor;
            document.getElementById('text-color-custom').value = selectedColor; // Sync custom picker
        }
    }
});

// 2. Custom Color Picker Inputs
document.getElementById('bg-color-custom').addEventListener('input', function(e) {
    if (activeNode) {
        activeNode.style.backgroundColor = e.target.value;
        activeNode.dataset.bg = e.target.value;
    }
});

document.getElementById('text-color-custom').addEventListener('input', function(e) {
    if (activeNode) {
        activeNode.style.color = e.target.value;
        activeNode.dataset.text = e.target.value;
    }
});

window.onload = () => {
    const rootNode = document.querySelector('.node');
    selectNode(rootNode); // Set initial active node
    rootNode.focus();
    drawLines();
};
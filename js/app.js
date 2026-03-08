let nodeCounter = 1;

function createBranch() {
    nodeCounter++;
    const branch = document.createElement('div');
    branch.className = 'branch';
    
    const nodeContainer = document.createElement('div');
    nodeContainer.className = 'node-container';

    const node = document.createElement('div');
    node.className = 'node';
    node.contentEditable = 'true';
    node.dataset.id = `node-${nodeCounter}`;

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

// --- NEW: Dynamic SVG Curly Line Drawer ---
function drawLines() {
    const svg = document.getElementById('connections');
    const canvas = document.getElementById('canvas');
    svg.innerHTML = ''; // Clear old lines
    
    // Ensure SVG covers the whole scrollable area
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
        
        // Parent connection point (Right middle)
        const startX = parentRect.right - svgRect.left;
        const startY = parentRect.top + (parentRect.height / 2) - svgRect.top;

        childBranches.forEach(childBranch => {
            const childNode = childBranch.querySelector(':scope > .node-container > .node');
            if (!childNode) return;

            const childRect = childNode.getBoundingClientRect();
            
            // Child connection point (Left middle)
            const endX = childRect.left - svgRect.left;
            const endY = childRect.top + (childRect.height / 2) - svgRect.top;

            // Math for the Bezier S-Curve
            const controlX1 = startX + (endX - startX) / 2;
            const controlY1 = startY;
            const controlX2 = startX + (endX - startX) / 2;
            const controlY2 = endY;

            // Draw the line
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', '#a0aec0'); // Soft grey color
            path.setAttribute('stroke-width', '2');

            svg.appendChild(path);
        });
    });
}

// 1. Listen for Keyboard Shortcuts
document.getElementById('canvas').addEventListener('keydown', function(e) {
    if (!e.target.classList.contains('node')) return;

    const currentNode = e.target;
    const currentBranch = currentNode.closest('.branch');

    if (e.key === 'Enter' && e.shiftKey) {
        setTimeout(drawLines, 10); // Redraw lines when box grows
        return; 
    }

    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); 
        if (currentBranch.id === 'root') return; 
        const newElements = createBranch();
        currentBranch.parentElement.insertBefore(newElements.branch, currentBranch.nextSibling);
        newElements.node.focus();
        drawLines();
    }

    if (e.key === 'Tab') {
        e.preventDefault(); 
        const childrenContainer = currentBranch.querySelector('.children');
        const newElements = createBranch();
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

// Update lines as you type (in case the box gets taller)
document.getElementById('canvas').addEventListener('input', drawLines);

// 2. Listen for Hover Button Clicks
document.getElementById('canvas').addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-sibling')) {
        const currentBranch = e.target.closest('.branch');
        if (currentBranch.id === 'root') return;
        const newElements = createBranch();
        currentBranch.parentElement.insertBefore(newElements.branch, currentBranch.nextSibling);
        newElements.node.focus();
        drawLines();
    }
    
    if (e.target.classList.contains('btn-child')) {
        const currentBranch = e.target.closest('.branch');
        const childrenContainer = currentBranch.querySelector('.children');
        const newElements = createBranch();
        childrenContainer.appendChild(newElements.branch);
        newElements.node.focus();
        drawLines();
    }
});

// Redraw lines if window resizes
window.addEventListener('resize', drawLines);

// Init
window.onload = () => {
    document.querySelector('.node').focus();
    drawLines();
};
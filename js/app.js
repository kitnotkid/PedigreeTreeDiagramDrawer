// --- WORKSPACE MEMORY ---
let tabsData = [
    {
        id: 'tab-1',
        name: 'Chart 1',
        html: '', // We will save the HTML string of the tree here
        nodeCounter: 1
    }
];
let currentTabId = 'tab-1';

// Variables declared only ONCE
let nodeCounter = 1;
let activeNode = null; 

// --- TAB LOGIC ---
function saveCurrentTab() {
    const currentTabData = tabsData.find(t => t.id === currentTabId);
    if (currentTabData) {
        currentTabData.html = document.getElementById('canvas').innerHTML;
        currentTabData.nodeCounter = nodeCounter;
    }
}

function loadTab(tabId) {
    saveCurrentTab(); // Always save the current work before switching
    
    currentTabId = tabId;
    const tabDataToLoad = tabsData.find(t => t.id === tabId);
    
    if (tabDataToLoad) {
        // Inject the saved HTML back into the canvas
        document.getElementById('canvas').innerHTML = tabDataToLoad.html;
        nodeCounter = tabDataToLoad.nodeCounter;
        
        // Update the visual appearance of the tabs in the toolbar
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.tab[data-tab-id="${tabId}"]`).classList.add('active');
        
        // Re-focus the root node and redraw the lines
        activeNode = null;
        const rootNode = document.querySelector('.node');
        if (rootNode) {
            selectNode(rootNode);
            drawLines();
        }
    }
}

// 1. Switching Tabs
document.getElementById('tab-container').addEventListener('click', function(e) {
    if (e.target.classList.contains('tab') && !e.target.isContentEditable) {
        const clickedTabId = e.target.getAttribute('data-tab-id');
        if (clickedTabId !== currentTabId) {
            loadTab(clickedTabId);
        }
    }
});

// 2. Double-Click to Inline Edit
document.getElementById('tab-container').addEventListener('dblclick', function(e) {
    if (e.target.classList.contains('tab')) {
        e.target.contentEditable = "true";
        e.target.focus();
    }
});

// 3. Prevent "Enter" from making a new line in the tab, and save on Enter
document.getElementById('tab-container').addEventListener('keydown', function(e) {
    if (e.target.classList.contains('tab') && e.key === 'Enter') {
        e.preventDefault(); // Stop the line break
        e.target.blur(); // Triggers the focusout event below to save
    }
});

// 4. Save the new name when clicking away
document.getElementById('tab-container').addEventListener('focusout', function(e) {
    if (e.target.classList.contains('tab')) {
        e.target.contentEditable = "false";
        const newName = e.target.textContent.trim();
        const tabId = e.target.getAttribute('data-tab-id');
        const tabData = tabsData.find(t => t.id === tabId);
        if (tabData) tabData.name = newName;
    }
});

// 5. The "＋" Button Logic
document.getElementById('btn-add-tab').addEventListener('click', function() {
    saveCurrentTab(); 

    // Generate a new unique ID
    const newTabId = 'tab-' + (Date.now()); // Using Date.now() ensures it's always unique
    const newTabName = 'Chart ' + (tabsData.length + 1);

    // The exact HTML of a blank starting node
    const blankCanvasHTML = `
        <svg id="connections"></svg>
        <div class="branch" id="root">
            <div class="children wing-left"></div> 
            <div class="node-container">
                <div class="node active" contenteditable="true" data-id="node-1" data-placeholder="Starting Node" data-bg="#ffffff" data-text="#000000"></div>
                <div class="controls">
                    <button class="btn-add btn-child-left" title="Add Left Child">⬅️</button>
                    <button class="btn-add btn-child-right" title="Add Right Child">➡️</button>
                </div>
            </div>
            <div class="children wing-right"></div> 
        </div>
    `;

    // Add it to our memory array
    tabsData.push({
        id: newTabId,
        name: newTabName,
        html: blankCanvasHTML,
        nodeCounter: 1
    });

    // Create the physical tab button in the HTML toolbar
    const newTabBtn = document.createElement('div');
    newTabBtn.className = 'tab';
    newTabBtn.setAttribute('data-tab-id', newTabId);
    newTabBtn.textContent = newTabName;
    
    // Insert it right before the "+" button
    const addBtn = document.getElementById('btn-add-tab');
    addBtn.parentNode.insertBefore(newTabBtn, addBtn);

    // Switch to the newly created tab
    loadTab(newTabId);
});

// --- Select Node Logic ---
function selectNode(node) {
    if (activeNode) activeNode.classList.remove('active');
    activeNode = node;
    activeNode.classList.add('active');
    
    document.getElementById('bg-color-custom').value = activeNode.dataset.bg;
    document.getElementById('text-color-custom').value = activeNode.dataset.text;
}

// --- createBranch (with color inheritance) ---
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

// --- SVG Curly Line Drawer (Updated for Center-Out) ---
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
        if (!parentNode) return;

        const childContainers = branch.querySelectorAll(':scope > .children');

        childContainers.forEach(container => {
            const childBranches = container.querySelectorAll(':scope > .branch');
            if (childBranches.length === 0) return;

            const isLeftWing = container.classList.contains('wing-left') || branch.closest('.wing-left');
            const parentRect = parentNode.getBoundingClientRect();
            
            const startX = isLeftWing ? (parentRect.left - svgRect.left) : (parentRect.right - svgRect.left);
            const startY = parentRect.top + (parentRect.height / 2) - svgRect.top;

            childBranches.forEach(childBranch => {
                const childNode = childBranch.querySelector(':scope > .node-container > .node');
                if (!childNode) return;

                const childRect = childNode.getBoundingClientRect();
                
                const endX = isLeftWing ? (childRect.right - svgRect.left) : (childRect.left - svgRect.left);
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
    });
}

// --- EVENT LISTENERS ---

document.getElementById('canvas').addEventListener('focusin', function(e) {
    if (e.target.classList.contains('node')) {
        selectNode(e.target);
    }
});

// Keyboard Controls
document.getElementById('canvas').addEventListener('keydown', function(e) {
    if (!e.target.classList.contains('node')) return;

    const currentNode = e.target;
    const currentBranch = currentNode.closest('.branch');
    const currentBg = currentNode.dataset.bg;
    const currentText = currentNode.dataset.text;

    if (e.key === 'Enter' && e.shiftKey) {
        setTimeout(drawLines, 10);
        return; 
    }

    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); 
        if (currentBranch.id === 'root') return; 
        const newElements = createBranch(currentBg, currentText); 
        currentBranch.parentElement.insertBefore(newElements.branch, currentBranch.nextSibling);
        newElements.node.focus();
        drawLines();
    }

    if (e.key === 'Tab') {
        e.preventDefault();
        
        let containerClass = e.shiftKey ? '.wing-left' : '.wing-right';
        let childrenContainer;
        
        if (currentBranch.id === 'root') {
            childrenContainer = currentBranch.querySelector(containerClass);
        } else {
            childrenContainer = Array.from(currentBranch.children).find(el => el.classList.contains('children'));
        }

        const newElements = createBranch(currentBg, currentText); 
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

// Hover UI Button Clicks (Arrows)
document.getElementById('canvas').addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-sibling') || 
        e.target.classList.contains('btn-child') ||
        e.target.classList.contains('btn-child-left') ||
        e.target.classList.contains('btn-child-right')) {
        
        const currentBranch = e.target.closest('.branch');
        const parentNode = currentBranch.querySelector(':scope > .node-container > .node');
        const currentBg = parentNode.dataset.bg;
        const currentText = parentNode.dataset.text;

        if (e.target.classList.contains('btn-sibling')) {
            if (currentBranch.id === 'root') return;
            const newElements = createBranch(currentBg, currentText);
            currentBranch.parentElement.insertBefore(newElements.branch, currentBranch.nextSibling);
            newElements.node.focus();
        } 
        else if (e.target.classList.contains('btn-child-left')) {
            const childrenContainer = currentBranch.querySelector('.wing-left');
            const newElements = createBranch(currentBg, currentText);
            childrenContainer.appendChild(newElements.branch);
            newElements.node.focus();
        }
        else if (e.target.classList.contains('btn-child-right')) {
            const childrenContainer = currentBranch.querySelector('.wing-right');
            const newElements = createBranch(currentBg, currentText);
            childrenContainer.appendChild(newElements.branch);
            newElements.node.focus();
        }
        else {
            const childrenContainer = currentBranch.querySelector(':scope > .children');
            const newElements = createBranch(currentBg, currentText);
            childrenContainer.appendChild(newElements.branch);
            newElements.node.focus();
        }
        drawLines();
    }
});

// Color Picker Logic
document.getElementById('bottom-toolbar').addEventListener('click', function(e) {
    if (e.target.classList.contains('swatch')) {
        const selectedColor = e.target.dataset.color;
        if (e.target.closest('#bg-swatches') && activeNode) {
            activeNode.style.backgroundColor = selectedColor;
            activeNode.dataset.bg = selectedColor;
            document.getElementById('bg-color-custom').value = selectedColor;
        } 
        else if (e.target.closest('#text-swatches') && activeNode) {
            activeNode.style.color = selectedColor;
            activeNode.dataset.text = selectedColor;
            document.getElementById('text-color-custom').value = selectedColor;
        }
    }
});

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

window.addEventListener('resize', drawLines);

window.onload = () => {
    const rootNode = document.querySelector('.node');
    if (rootNode) {
        selectNode(rootNode);
        rootNode.focus();
        drawLines();
    }
};
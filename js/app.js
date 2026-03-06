let nodeCounter = 1;

// Function to create a new branch with the hover buttons
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

// 1. Listen for Keyboard Shortcuts
document.getElementById('canvas').addEventListener('keydown', function(e) {
    if (!e.target.classList.contains('node')) return;

    const currentNode = e.target;
    const currentBranch = currentNode.closest('.branch');

    // Shift + Enter -> Allow default text newline
    if (e.key === 'Enter' && e.shiftKey) return; 

    // Enter -> Create Sibling
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); 
        if (currentBranch.id === 'root') return; 
        const newElements = createBranch();
        currentBranch.parentElement.insertBefore(newElements.branch, currentBranch.nextSibling);
        newElements.node.focus();
    }

    // Tab -> Create Child
    if (e.key === 'Tab') {
        e.preventDefault(); 
        const childrenContainer = currentBranch.querySelector('.children');
        const newElements = createBranch();
        childrenContainer.appendChild(newElements.branch);
        newElements.node.focus();
    }

    // Backspace -> Delete branch if text box is empty
    if (e.key === 'Backspace') {
        if (currentNode.textContent.trim() === '') {
            e.preventDefault();
            if (currentBranch.id === 'root') return; // Do not delete the starting node
            
            const prevSibling = currentBranch.previousElementSibling;
            const parentNode = currentBranch.parentElement.closest('.branch')?.querySelector('.node');
            
            currentBranch.remove(); // Delete it

            // Shift focus so you can keep typing seamlessly
            if (prevSibling) {
                prevSibling.querySelector('.node').focus();
            } else if (parentNode) {
                parentNode.focus();
            }
        }
    }
});

// 2. Listen for Hover Button Clicks (Mouse controls)
document.getElementById('canvas').addEventListener('click', function(e) {
    // Clicked Up Arrow (Sibling)
    if (e.target.classList.contains('btn-sibling')) {
        const currentBranch = e.target.closest('.branch');
        if (currentBranch.id === 'root') return;
        const newElements = createBranch();
        currentBranch.parentElement.insertBefore(newElements.branch, currentBranch.nextSibling);
        newElements.node.focus();
    }
    
    // Clicked Right Arrow (Child)
    if (e.target.classList.contains('btn-child')) {
        const currentBranch = e.target.closest('.branch');
        const childrenContainer = currentBranch.querySelector('.children');
        const newElements = createBranch();
        childrenContainer.appendChild(newElements.branch);
        newElements.node.focus();
    }
});

// Auto-focus the root node on load
window.onload = () => {
    document.querySelector('.node').focus();
};
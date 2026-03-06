let nodeCounter = 1;

// Function to create a new branch (Node + Children container)
function createBranch() {
    nodeCounter++;
    const branch = document.createElement('div');
    branch.className = 'branch';
    
    const node = document.createElement('div');
    node.className = 'node';
    node.contentEditable = 'true';
    node.dataset.id = `node-${nodeCounter}`;
    
    const children = document.createElement('div');
    children.className = 'children';

    branch.appendChild(node);
    branch.appendChild(children);
    return { branch, node };
}

// Listen for keyboard events on the canvas
document.getElementById('canvas').addEventListener('keydown', function(e) {
    // Only trigger if a node is currently focused
    if (!e.target.classList.contains('node')) return;

    const currentNode = e.target;
    const currentBranch = currentNode.parentElement;

    // Shift + Enter -> Allow default behavior (new line inside the box)
    if (e.key === 'Enter' && e.shiftKey) {
        return; 
    }

    // Enter -> Create a Sibling (New branch at the same level)
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent new line in text
        
        // Do not allow siblings for the absolute root node
        if (currentBranch.id === 'root') return; 

        const newElements = createBranch();
        currentBranch.parentElement.insertBefore(newElements.branch, currentBranch.nextSibling);
        newElements.node.focus(); // Auto-focus the new box
    }

    // Tab -> Create a Child (New sub-branch)
    if (e.key === 'Tab') {
        e.preventDefault(); // Prevent focusing out of the element
        
        const childrenContainer = currentBranch.querySelector('.children');
        const newElements = createBranch();
        childrenContainer.appendChild(newElements.branch);
        newElements.node.focus(); // Auto-focus the new box
    }
});

// Auto-focus the root node on load
window.onload = () => {
    document.querySelector('.node').focus();
};
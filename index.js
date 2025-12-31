document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    document.getElementById('create-btn').addEventListener('click', createProject);
});

function loadProjects() {
    const projects = JSON.parse(localStorage.getItem('mm_projects') || '[]');
    const list = document.getElementById('project-list');
    list.innerHTML = '';
    
    if(projects.length === 0) {
        list.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 40px;">No projects yet. Create one above!</div>`;
        return;
    }

    projects.sort((a,b) => b.created - a.created).forEach(p => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <div class="project-card-content" data-id="${p.id}">
                <div class="icon-box">📂</div>
                <h3>${p.name}</h3>
                <p>Created: ${new Date(p.created).toLocaleDateString()}</p>
            </div>
            <button class="delete-btn" data-id="${p.id}" title="Delete">×</button>
        `;
        list.appendChild(div);
    });

    // Add event listeners for dynamic elements
    document.querySelectorAll('.project-card-content').forEach(el => {
        el.addEventListener('click', () => {
            window.location.href = `mindmap.html?id=${el.dataset.id}`;
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteProject(btn.dataset.id);
        });
    });
}

function createProject() {
    const input = document.getElementById('new-project-name');
    const name = input.value.trim();
    if (!name) return;

    const projects = JSON.parse(localStorage.getItem('mm_projects') || '[]');
    const id = Date.now().toString();
    
    projects.push({ id, name, created: Date.now() });
    localStorage.setItem('mm_projects', JSON.stringify(projects));
    
    const initialData = {
        tree: { id: 'root', type: 'root', data: { name: name, category: 'Main', gallery: [], size: 'medium' }, children: [] },
        settings: { theme: 'light', currency: '$' }
    };
    localStorage.setItem('mm_data_' + id, JSON.stringify(initialData));

    input.value = '';
    loadProjects();
}

function deleteProject(id) {
    if(!confirm('Delete this project forever?')) return;
    let projects = JSON.parse(localStorage.getItem('mm_projects') || '[]');
    projects = projects.filter(p => p.id !== id);
    localStorage.setItem('mm_projects', JSON.stringify(projects));
    localStorage.removeItem('mm_data_' + id);
    loadProjects();
}
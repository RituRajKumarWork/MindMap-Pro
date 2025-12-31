const projectId = new URLSearchParams(window.location.search).get('id');
if (!projectId) window.location.href = 'index.html';

window.appState = {
    tree: null, 
    settings: { theme: 'light', currency: '$' },
    expanded: new Set(['root']), 
    transform: { x: window.innerWidth/2, y: 100, scale: 0.8 },
    history: [], future: [], 
    isDragging: false, dragStart: {x:0, y:0},
    // Updated modal state to track selected image index
    modal: { mode: 'add', id: null, target: null, gallery: [], selectedIdx: 0, size: 'medium' }
};

const els = {
    canvas: document.getElementById('canvas-content'),
    wrapper: document.getElementById('canvas-wrapper'),
    overlay: document.getElementById('modal-overlay'),
    inputs: { 
        name: document.getElementById('input-name'), 
        cat: document.getElementById('input-cat'), 
        price: document.getElementById('input-price'), 
        link: document.getElementById('input-link'),
        note: document.getElementById('input-note') 
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Data
    const rawData = localStorage.getItem('mm_data_' + projectId);
    if (rawData) {
        try {
            const data = JSON.parse(rawData);
            window.appState.tree = data.tree;
            window.appState.settings = data.settings || { theme: 'light', currency: '$' };
            if(window.appState.settings.theme === 'dark') document.body.classList.add('dark');
        } catch (e) { createDefaultNode(); }
    } else { createDefaultNode(); }

    update();
    setupEvents();
});

function createDefaultNode() {
    window.appState.tree = { 
        id: 'root', type: 'root', 
        data: { name: 'Central Topic', category: 'Main', gallery: [], selectedIdx: 0, size: 'medium' }, 
        children: [] 
    };
    save();
}

function setupEvents() {
    // UI Buttons
    document.getElementById('btn-back').onclick = () => window.location.href = 'index.html';
    document.getElementById('btn-undo').onclick = app.undo;
    document.getElementById('btn-redo').onclick = app.redo;
    document.getElementById('btn-theme').onclick = app.toggleTheme;
    document.getElementById('btn-download').onclick = app.downloadBackup;
    document.getElementById('btn-zoom-in').onclick = app.zoomIn;
    document.getElementById('btn-zoom-out').onclick = app.zoomOut;
    document.getElementById('btn-reset').onclick = app.resetView;
    document.getElementById('btn-close-modal').onclick = app.closeModal;
    document.getElementById('btn-cancel-modal').onclick = app.closeModal;
    document.getElementById('btn-save-modal').onclick = app.saveForm;
    
    ['small', 'medium', 'large'].forEach(s => {
        document.getElementById(`size-${s}`).onclick = () => app.setSize(s);
    });

    // Mouse Panning
    els.wrapper.addEventListener('mousedown', e => {
        if(e.target.closest('button') || e.target.closest('input') || e.target.closest('.modal-window')) return;
        window.appState.isDragging = true; 
        window.appState.dragStart = {x: e.clientX, y: e.clientY}; 
        els.wrapper.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', e => {
        if(!window.appState.isDragging) return;
        window.appState.transform.x += e.clientX - window.appState.dragStart.x;
        window.appState.transform.y += e.clientY - window.appState.dragStart.y;
        window.appState.dragStart = {x: e.clientX, y: e.clientY};
        update();
    });
    window.addEventListener('mouseup', () => { 
        window.appState.isDragging = false; 
        els.wrapper.style.cursor = 'grab'; 
    });

    // File Upload (Click)
    document.getElementById('file-input').addEventListener('change', (e) => {
        if(e.target.files[0]) processImage(e.target.files[0]);
    });

    // Paste Image (Ctrl+V)
    document.addEventListener('paste', (e) => {
        if(els.overlay.style.display !== 'flex') return; // Only if modal open
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let index in items) {
            const item = items[index];
            if (item.kind === 'file' && item.type.includes('image/')) {
                processImage(item.getAsFile());
            }
        }
    });
}

function processImage(file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
        const img = new Image(); img.src = evt.target.result;
        img.onload = () => {
            // Compress Image
            const c = document.createElement('canvas'); const ctx = c.getContext('2d');
            const scale = 300 / img.width; // Max width 300px
            c.width = 300; c.height = img.height * scale;
            ctx.drawImage(img, 0, 0, c.width, c.height);
            
            // Add to gallery and select it
            window.appState.modal.gallery.push(c.toDataURL('image/jpeg', 0.7));
            window.appState.modal.selectedIdx = window.appState.modal.gallery.length - 1;
            app.renderGallery();
        };
    };
    reader.readAsDataURL(file);
}

// --- Logic ---
const save = () => {
    localStorage.setItem('mm_data_' + projectId, JSON.stringify({ tree: window.appState.tree, settings: window.appState.settings }));
    const ind = document.getElementById('save-indicator');
    if(ind) ind.innerText = 'Saved';
};

const record = () => {
    if(window.appState.history.length > 20) window.appState.history.shift();
    window.appState.history.push(JSON.stringify(window.appState.tree));
    window.appState.future = [];
};

const find = (n, id) => {
    if(!n) return null;
    if(n.id === id) return n;
    if(n.children) {
        for(let c of n.children) { const f = find(c, id); if(f) return f; }
    }
    return null;
};
const findP = (n, id) => {
    if(!n || !n.children) return null;
    for(let c of n.children) { if(c.id === id) return n; const f = findP(c, id); if(f) return f; }
    return null;
};

const render = (node) => {
    if(!node) return document.createElement('div');

    const isRoot = node.type === 'root';
    const expanded = window.appState.expanded.has(node.id);
    const size = node.data.size || 'medium';
    
    // Use selected index, fallback to 0
    const imgIdx = node.data.selectedIdx !== undefined ? node.data.selectedIdx : 0;
    const img = (node.data.gallery && node.data.gallery.length > 0) ? node.data.gallery[imgIdx] : null;

    const el = document.createElement('div');
    el.className = 'node-wrapper';

    if (!isRoot) {
        const line = document.createElement('div');
        line.className = 'line-up';
        el.appendChild(line);
    }

    const card = document.createElement('div');
    card.className = `node-card ${isRoot ? 'root' : ''} ${size}`;
    
    // Link Icon
    if(node.data.link) {
        const a = document.createElement('a');
        a.href = node.data.link;
        a.target = '_blank';
        a.className = 'link-icon';
        a.innerHTML = '🔗';
        a.title = 'Open Link';
        a.onclick = (e) => e.stopPropagation();
        card.appendChild(a);
    }

    let html = '';
    if(img) html += `<img src="${img}" class="node-img">`;
    else if(!isRoot) html += `<div style="height:6px; background:#6366f1"></div>`;
    
    html += `<div class="node-body">
        <div class="node-title">${node.data.name || 'Untitled'}</div>
        ${node.data.price ? `<div class="price-tag">$${node.data.price}</div>` : ''}
    </div>`;
    
    const actions = document.createElement('div');
    actions.className = 'actions';
    
    const btnAdd = document.createElement('button');
    btnAdd.className = 'act-btn btn-add';
    btnAdd.innerText = '＋';
    btnAdd.onclick = (e) => { e.stopPropagation(); app.openModal('add', node.id); };
    
    const btnEdit = document.createElement('button');
    btnEdit.className = 'act-btn btn-edit';
    btnEdit.innerText = '✎';
    btnEdit.onclick = (e) => { e.stopPropagation(); app.openModal('edit', node.id); };

    actions.appendChild(btnAdd);
    actions.appendChild(btnEdit);

    if(!isRoot) {
        const btnDel = document.createElement('button');
        btnDel.className = 'act-btn btn-del';
        btnDel.innerText = '🗑';
        btnDel.onclick = (e) => { e.stopPropagation(); app.del(node.id); };
        actions.appendChild(btnDel);
    }
    
    card.insertAdjacentHTML('beforeend', html);
    card.appendChild(actions);
    el.appendChild(card);

    if(node.children && node.children.length > 0) {
        const btn = document.createElement('div');
        btn.className = 'expand-btn';
        btn.innerText = expanded ? '▲' : '▼';
        btn.onclick = () => { 
            if(expanded) window.appState.expanded.delete(node.id); 
            else window.appState.expanded.add(node.id); 
            update(); 
        };
        el.appendChild(btn);
    }

    if(expanded && node.children && node.children.length > 0) {
        const box = document.createElement('div');
        box.className = 'children-container';
        if(node.children.length > 1) {
            const bar = document.createElement('div');
            bar.className = 'cross-bar';
            box.appendChild(bar);
        }
        node.children.forEach(child => {
            const wrap = document.createElement('div');
            wrap.className = 'node-wrapper';
            const conn = document.createElement('div');
            conn.className = 'line-down';
            wrap.appendChild(conn);
            wrap.appendChild(render(child));
            box.appendChild(wrap);
        });
        el.appendChild(box);
    }
    return el;
};

const update = () => {
    els.canvas.innerHTML = '';
    if(window.appState.tree) els.canvas.appendChild(render(window.appState.tree));
    const {x, y, scale} = window.appState.transform;
    els.canvas.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
};

window.app = {
    zoomIn: () => { window.appState.transform.scale = Math.min(2, window.appState.transform.scale + 0.1); update(); },
    zoomOut: () => { window.appState.transform.scale = Math.max(0.2, window.appState.transform.scale - 0.1); update(); },
    resetView: () => { window.appState.transform = {x: window.innerWidth/2, y: 100, scale: 0.8}; update(); },
    toggleTheme: () => { 
        document.body.classList.toggle('dark'); 
        window.appState.settings.theme = document.body.classList.contains('dark') ? 'dark' : 'light';
        save();
    },
    undo: () => {
        if(!window.appState.history.length) return;
        window.appState.future.push(JSON.stringify(window.appState.tree));
        window.appState.tree = JSON.parse(window.appState.history.pop());
        update(); save();
    },
    redo: () => {
        if(!window.appState.future.length) return;
        window.appState.history.push(JSON.stringify(window.appState.tree));
        window.appState.tree = JSON.parse(window.appState.future.pop());
        update(); save();
    },
    del: (id) => { if(confirm('Delete?')) { record(); const p = findP(window.appState.tree, id); p.children = p.children.filter(c => c.id !== id); update(); save(); } },
    
    openModal: (mode, id) => {
        // Reset Inputs
        els.inputs.name.value = ''; els.inputs.cat.value = ''; 
        els.inputs.price.value = ''; els.inputs.link.value = ''; els.inputs.note.value = '';
        
        // Setup State
        window.appState.modal = { mode, id, target: id, gallery: [], selectedIdx: 0, size: 'medium' };

        if(mode === 'edit') {
            const n = find(window.appState.tree, id);
            els.inputs.name.value = n.data.name; 
            els.inputs.cat.value = n.data.category || '';
            els.inputs.price.value = n.data.price || ''; 
            els.inputs.link.value = n.data.link || ''; 
            els.inputs.note.value = n.data.note || '';
            window.appState.modal.size = n.data.size || 'medium';
            window.appState.modal.gallery = n.data.gallery ? [...n.data.gallery] : [];
            window.appState.modal.selectedIdx = n.data.selectedIdx !== undefined ? n.data.selectedIdx : 0;
            document.getElementById('modal-title').innerText = "Edit Node";
        } else {
            document.getElementById('modal-title').innerText = "Add Branch";
        }

        app.setSize(window.appState.modal.size);
        app.renderGallery();
        els.overlay.style.display = 'flex';
    },
    
    closeModal: () => { els.overlay.style.display = 'none'; },
    
    setSize: (s) => {
        window.appState.modal.size = s;
        ['small','medium','large'].forEach(z => {
            const btn = document.getElementById('size-'+z);
            if(btn) { if(z === s) btn.classList.add('active'); else btn.classList.remove('active'); }
        });
    },

    selectThumb: (idx) => {
        window.appState.modal.selectedIdx = idx;
        app.renderGallery();
    },

    delImg: (i) => { 
        window.appState.modal.gallery.splice(i,1); 
        if(window.appState.modal.selectedIdx >= window.appState.modal.gallery.length) {
            window.appState.modal.selectedIdx = Math.max(0, window.appState.modal.gallery.length - 1);
        }
        app.renderGallery(); 
    },

    renderGallery: () => {
        const div = document.getElementById('gallery-preview');
        div.innerHTML = '';
        window.appState.modal.gallery.forEach((src, i) => {
            const isSelected = i === window.appState.modal.selectedIdx;
            const wrap = document.createElement('div');
            wrap.className = `thumb-wrap ${isSelected ? 'selected' : ''}`;
            wrap.onclick = () => app.selectThumb(i);
            
            wrap.innerHTML = `<img src="${src}"><button class="thumb-del" onclick="event.stopPropagation(); app.delImg(${i})">×</button>`;
            div.appendChild(wrap);
        });
    },

    saveForm: () => {
        record();
        const data = {
            name: els.inputs.name.value || 'Node', 
            category: els.inputs.cat.value,
            price: els.inputs.price.value, 
            link: els.inputs.link.value, 
            note: els.inputs.note.value,
            size: window.appState.modal.size, 
            gallery: window.appState.modal.gallery,
            selectedIdx: window.appState.modal.selectedIdx
        };

        if(window.appState.modal.mode === 'add') {
            const p = find(window.appState.tree, window.appState.modal.target);
            if(p) {
                if(!p.children) p.children = [];
                p.children.push({ id: Math.random().toString(36).substr(2,9), type: 'branch', data, children: [] });
                window.appState.expanded.add(p.id);
            }
        } else {
            // BUG FIX: Explicitly find the node by ID and update it
            const n = find(window.appState.tree, window.appState.modal.id);
            if(n) {
                // Merge new data with existing data, overwriting keys
                n.data = { ...n.data, ...data };
            }
        }
        update(); save(); app.closeModal();
    },

    downloadBackup: () => {
        const b = new Blob([localStorage.getItem('mm_data_'+projectId)],{type:'application/json'});
        const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download='backup.json'; a.click();
    }
};
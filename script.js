// ---REGISTER LOGIC---
const registerForm = document.getElementById('registerForm');
const messageBox = document.getElementById('messageBox');

if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            // 🌟 Changed to relative URL
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: password }) 
            });

            const result = await response.json();
            if (response.ok) {
                messageBox.style.color = "green";
                messageBox.innerText = result.message + " Redirecting to Login page...";
                registerForm.reset(); 

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);

            } else {
                messageBox.style.color = "red";
                messageBox.innerText = result.error;
            }
        } catch (error) {
            messageBox.style.color = "red";
            messageBox.innerText = "Server error. Is Node.js running?";
        }
    });
}

// ---LOGIN LOGIC---
const loginForm = document.getElementById('loginForm');
const loginMessageBox = document.getElementById('loginMessageBox');

if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            // 🌟 Changed to relative URL
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: password })
            });

            const result = await response.json();
            if (response.ok) {
                loginMessageBox.style.color = "green";
                loginMessageBox.innerText = result.message;
                
                localStorage.setItem('loggedInUserId', result.userId);
                localStorage.setItem('loggedInUsername', result.username);

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                loginMessageBox.style.color = "red";
                loginMessageBox.innerText = result.error;
            }
        } catch (error) {
            loginMessageBox.style.color = "red";
            loginMessageBox.innerText = "Server error. Is Node.js running?";
        }
    });
}

// ---DASHBOARD LOGIC (CRUD)---
const createNoteForm = document.getElementById('createNoteForm');
const welcomeMessage = document.getElementById('welcomeMessage');
const logoutBtn = document.getElementById('logoutBtn');
const notesContainer = document.getElementById('notesContainer');

if (createNoteForm) {
    const currentUserId = localStorage.getItem('loggedInUserId');
    const currentUsername = localStorage.getItem('loggedInUsername');

    if (!currentUserId) {
        alert("Oops! You need to log in first!");
        window.location.href = 'login.html';
    } else {
        welcomeMessage.innerText = `Welcome, ${currentUsername}!`;
    }

    //CREATE NOTE
    createNoteForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const title = document.getElementById('noteTitle').value;
        const content = document.getElementById('noteContent').value;
        const noteMessageBox = document.getElementById('noteMessageBox');

        try {
            // 🌟 Changed to relative URL
            const response = await fetch('/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, title: title, content: content })
            });
            const result = await response.json();

            if (response.ok) {
                noteMessageBox.style.color = "green";
                noteMessageBox.innerText = result.message;
                createNoteForm.reset(); 
                fetchMyNotes(); 
                setTimeout(() => noteMessageBox.innerText = "", 3000);
            } else {
                noteMessageBox.style.color = "red";
                noteMessageBox.innerText = result.error;
            }
        } catch (error) {
            noteMessageBox.style.color = "red";
            noteMessageBox.innerText = "Server error!";
        }
    });

//FETCH & DISPLAY NOTES
    async function fetchMyNotes() {
        try {
            // 🌟 Changed to relative URL
            const response = await fetch(`/notes/${currentUserId}`);
            const notes = await response.json();
            notesContainer.innerHTML = ''; 

            if (notes.length === 0) {
                notesContainer.innerHTML = `<div class="col-12 text-center mt-4"><p class="text-secondary">No notes yet! Start typing your brilliant ideas!</p></div>`;
                return;
            }

            notes.forEach(note => {
                const safeTitle = String(note.title).replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\n/g, "\\n");
                const safeContent = String(note.content).replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\n/g, "\\n");

                const noteCard = /*html*/`
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card glass-card border-0 h-100" style="transition: transform 0.2s;">
                            <div class="card-body p-4 d-flex flex-column">
                                <h4 class="card-title text-primary fw-bold mb-3 text-truncate" title="${note.title}">
                                    ${note.title}
                                </h4>
                                
                                <div class="custom-scroll flex-grow-1" style="max-height: 180px; overflow-y: auto; padding-right: 5px;">
                                    <p class="card-text text-dark" style="white-space: pre-wrap; margin-bottom: 0;">${note.content}</p>
                                </div>
                                
                                <div class="d-flex justify-content-between mt-4 pt-3 border-top">
                                    <button class="btn btn-sm btn-outline-success rounded-pill fw-bold flex-grow-1 mx-1" 
                                        onclick="openViewModal('${safeTitle}', '${safeContent}')">
                                        View
                                    </button>
                                    <button class="btn btn-sm btn-outline-primary rounded-pill fw-bold flex-grow-1 mx-1" 
                                        onclick="openEditModal(${note.id}, '${safeTitle}', '${safeContent}')">
                                        Edit
                                    </button>
                                    <button class="btn btn-sm btn-danger rounded-pill fw-bold flex-grow-1 mx-1 shadow-sm" 
                                        onclick="deleteNote(${note.id})">
                                        Delete
                                    </button>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                `;
                notesContainer.insertAdjacentHTML('beforeend', noteCard);
            });
        } catch (error) {
            console.error("Failed to fetch notes:", error);
        }
    }

    //DELETE NOTE
    window.deleteNote = async (noteId) => {
        if (!confirm("Are you sure you want to delete this note?")) return;

        try {
            // 🌟 Changed to relative URL
            const response = await fetch(`/notes/${noteId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: Number(currentUserId) }) 
            });

            if (response.ok) {
                await fetchMyNotes(); 
            } else {
                const result = await response.json();
                alert(result.error || "Failed to delete the note!");
            }
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    //SAVE EDITED NOTE
    document.getElementById('editNoteForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const noteId = document.getElementById('editNoteId').value;
        const newTitle = document.getElementById('editNoteTitle').value;
        const newContent = document.getElementById('editNoteContent').value;

        try {
            // 🌟 Changed to relative URL
            const response = await fetch(`/notes/${noteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: Number(currentUserId), title: newTitle, content: newContent })
            });

            if (response.ok) {
                if (editModal) editModal.hide(); 
                await fetchMyNotes(); 
            } else {
                alert("Failed to update the note!");
            }
        } catch (error) {
            console.error("Update failed:", error);
        }
    });
    
    //OPEN VIEW MODAL
    let viewModal;
    if (typeof bootstrap !== 'undefined') {
        viewModal = new bootstrap.Modal(document.getElementById('viewNoteModal'));
    }
    window.openViewModal = (title, content) => {
        document.getElementById('viewNoteTitle').innerHTML = title;
        document.getElementById('viewNoteContent').innerHTML = content;
        if (viewModal) viewModal.show(); 
    };

    //OPEN EDIT MODAL
    let editModal;
    if (typeof bootstrap !== 'undefined') {
        editModal = new bootstrap.Modal(document.getElementById('editNoteModal'));
    }
    window.openEditModal = (id, title, content) => {
        document.getElementById('editNoteId').value = id;
        document.getElementById('editNoteTitle').value = title.replace(/&quot;/g, '"').replace(/\\n/g, '\n');
        document.getElementById('editNoteContent').value = content.replace(/&quot;/g, '"').replace(/\\n/g, '\n');
        if (editModal) editModal.show(); 
    };

    //logout
    logoutBtn.addEventListener('click', () => {
        localStorage.clear(); 
        window.location.href = 'index.html'; 
    });

    //Initialize Dashboard
    fetchMyNotes();
}

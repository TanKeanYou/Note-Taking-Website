const Database = require('better-sqlite3');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); 
app.use(express.json()); 
app.use(express.static(__dirname));

const db = new Database('./database.db', { verbose: console.log });
console.log("Awesome! better-sqlite3 database successfully connected!");

// Create tables for users and notes
const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        username TEXT NOT NULL UNIQUE, 
        password TEXT NOT NULL 
    );
    CREATE TABLE IF NOT EXISTS notes(
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        user_id INTEGER NOT NULL, 
        title TEXT NOT NULL, 
        content TEXT NOT NULL
    );
`;

db.exec(createTablesQuery); 
console.log("Database tables are ready to go!");

//Register
app.post('/register', (req, res) => {
    const { username, password } = req.body; 
    try {
        const insertUser = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
        insertUser.run(username, password); 
        res.status(201).json({ message: "Register Successful!" });
    } catch (error) {
        res.status(400).json({ error: "Username already exists! Please try another one." });
    }
});

//Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    try {
        const getUser = db.prepare("SELECT * FROM users WHERE username = ?");
        const user = getUser.get(username); 

        if (!user) {
            return res.status(404).json({ error: "User not found! Please register first." });
        }

        console.log("Password from user: >" + password + "<");
        console.log("Password in database >" + user.password + "<");

        if (String(user.password) !== String(password)) {
            return res.status(401).json({ error: "Incorrect password! Try again." });
        }

        res.status(200).json({ 
            message: "Login Successful!", 
            userId: user.id,
            username: user.username
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal Server Error." });
    }
});

//Create note
app.post('/notes', (req, res) => {
    const { userId, title, content } = req.body;
    try {
        const insertNote = db.prepare("INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)");
        insertNote.run(userId, title, content); 
        res.status(201).json({ message: "Note saved successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to save the note." });
    }
});

//Fetch user note
app.get('/notes/:userId', (req, res) => {
    const userId = req.params.userId; 
    try {
        const getNotes = db.prepare("SELECT * FROM notes WHERE user_id = ? ORDER BY id DESC");
        const notes = getNotes.all(userId); 
        res.status(200).json(notes); 
    } catch (error) {
        res.status(500).json({ error: "Could not retrieve notes." });
    }
});

//Update note
app.put('/notes/:id', (req, res) => {
    const noteId = Number(req.params.id);
    const userId = Number(req.body.userId);
    const { title, content } = req.body; 
    
    try {
        const updateStmt = db.prepare("UPDATE notes SET title = ?, content = ? WHERE id = ? AND user_id = ?");
        const info = updateStmt.run(title, content, noteId, userId);

        if (info.changes === 0) {
            return res.status(404).json({ error: "Note not found or unauthorized!" });
        }
        res.status(200).json({ message: "Note updated successfully!" });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ error: "Server error." });
    }
});

//Delete note
app.delete('/notes/:id', (req, res) => {
    //Convert URL string parameter and body userId to Numbers
    const noteId = Number(req.params.id); 
    const userId = Number(req.body.userId);  
    
    try {
        const deleteStmt = db.prepare("DELETE FROM notes WHERE id = ? AND user_id = ?");
        const info = deleteStmt.run(noteId, userId);

        if (info.changes === 0) {
            return res.status(404).json({ error: "Note not found or unauthorized!" });
        }
        res.status(200).json({ message: "Note successfully deleted!" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: "Server error." });
    }
});

//Start server
app.listen(PORT, () => {
    console.log(`Server is running at: http://localhost:${PORT}`);
});

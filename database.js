const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('library.db', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    }
    else {
        console.log('CONNECTED TO DATABASE ...');
        db.run(`CREATE TABLE authors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT);`, (err) => {
                console.log('authors TABLE ALREADY CREATED');
            });
        db.run(`CREATE TABLE books (
            ISBN INTEGER PRIMARY KEY,
            title TEXT,
            qty INTEGER,
            author_id INTEGER,
            FOREIGN KEY(author_id) REFERENCES authors(id));`, (err) => {
                if(err) {
                    console.log('books TABLE ALREADY CREATED');
                }
            });
    }
});

module.exports = db;
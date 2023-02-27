const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { 
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
    GraphQLNonNull
} = require('graphql');
const db = require('./database');

const app = express();
const PORT = 2020;

// Custom Object Types
const bookType = new GraphQLObjectType ({
    name: 'book',
    description: 'This represents a book written by an author',
    fields: () => ({
        ISBN: { type: GraphQLNonNull(GraphQLInt) },
        title: { type: GraphQLNonNull(GraphQLString) },
        qty: { type: GraphQLNonNull(GraphQLInt) },
        authorId: { type: GraphQLNonNull(GraphQLInt) },
        author: { 
            type: authorType,
            resolve: (book) => {
                return new Promise((resolve, reject) => {
                    db.get(`SELECT * FROM authors WHERE ISBN = ?;`, [book.authorId], (err, row) => {
                        if (err) {
                            reject(null);
                        }
                         resolve(row);
                    });
                });
            }
        } 
    })
});

const authorType = new GraphQLObjectType ({
    name: 'author',
    description: 'This represents an author of a book',
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLInt) },
        name: { type: GraphQLNonNull(GraphQLString) },
        books: {
            type: new GraphQLList(bookType),
            resolve: (author) => {
                return new Promise((resolve, reject) => {
                    db.all(`SELECT * FROM books WHERE author_id = ?;`, [author.id], (err, rows) => {
                        if (err) {
                            reject([]);
                        }
                        resolve(rows);
                    });
                });
            }
        }
        
    })
});

// Root Query
const rootQuery = new GraphQLObjectType ({
    name: 'Query',
    description: 'Root Query',
    // this is where we put all our "Query operations"
    fields: () => ({
        book: {
            type: bookType,
            description: 'A single book',
            args: {
                ISBN: { type: GraphQLInt }
            },
            resolve: (parent, args) => {
                return new Promise((resolve, reject) => {
                    db.get(`SELECT * FROM books WHERE ISBN = ?;`, args.ISBN, (err, row) => {
                        if (err) {
                            reject(null);
                        }
                        resolve(row);
                    });
                });
            }
        },
        books: {
            type: new GraphQLList(bookType),
            description: 'A list of all books',
            // This resolve is where we would query our db for the list of books
            resolve: () => {
                return new Promise((resolve, reject) => {
                    db.all(`SELECT * FROM books;`, (err, rows) => {
                        if (err) {
                            reject([]);
                        }
                        resolve(rows);
                    });
                });
            }
        },
        authors: {
            type: new GraphQLList(authorType),
            description: 'A list of all authors',
            // This resolve is where we would query our db for the list of books
            resolve: () => {
                return new Promise((resolve, reject) => {
                    db.all(`SELECT * FROM authors;`, function(err, rows) {
                        if (err) {
                            reject([]);
                        }
                        resolve(rows);
                    });
                });
            }
        },
        author: {
            type: authorType,
            description: 'A single authors',
            args: {
                id: { type: GraphQLInt }
            },
            // This resolve is where we would query our db for the list of books
            resolve: (parent, args) => {
                return new Promise((resolve, reject) => {
                    db.get(`SELECT * FROM authors WHERE id = ?;`, [args.id], function(err, row) {
                        if (err) {
                            reject(null);
                        }
                        resolve(row);
                    });
                });
            }
        }
    })
});

// Root Mutation
const rootMutation = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root Mutation',
    // this is where we put our "Mutation operations"
    fields: () => ({
        addBook: {
            type: bookType,
            description: 'Add a book',
            args: {
                ISBN: { type: GraphQLNonNull(GraphQLInt) },
                title: { type: GraphQLNonNull(GraphQLString) },
                qty: { type: GraphQLNonNull(GraphQLInt) },
                authorId: { type: GraphQLNonNull(GraphQLInt) }
            },
            resolve: (parent, args) => {
                return new Promise((resolve, reject) => {
                    // First check if ISBN already exists
                    db.all(`SELECT * FROM books WHERE ISBN = ?;`, [args.ISBN], (err, rows) => {
                        if(err) {
                            reject([]);
                        }
                        // If there exists no row with ISBN
                        else if(Object.keys(rows).length > 0) {
                            reject([]);
                        }
                        else {
                            // Insert statement
                            db.run(`INSERT INTO books (ISBN, title, qty, author_id) VALUES (?, ?, ?, ?)`, 
                                [args.ISBN, args.title, args.qty, args.authorId], function (err) {
                                if (err) {
                                    reject([]);
                                }
                                resolve({
                                    ISBN: args.ISBN,
                                    title: args.title,
                                    qty: args.qty,
                                    authorId: args.authorId
                                });
                            });
                        }
                    });
                });
            }
        },
        addAuthor: {
            type: authorType,
            description: 'Add an author',
            args: {
                name: { type: GraphQLNonNull(GraphQLString) }
            },
            resolve: (parent, args) => {
                return new Promise((resolve, reject) => {
                    db.run(`INSERT INTO authors (name) VALUES (?);`, [args.name], function (err, rows) {
                        if(err) {
                            reject([]);
                        }
                        db.get(`SELECT last_insert_rowid() as id;`, (err, row) => {
                            if(err) {
                                reject(null);
                            }
                            resolve({
                                id: row["id"],
                                name: args.name
                            });
                        })
                        
                    });
                });
            }
        }
    })
});

// Define a schema
const schema = new GraphQLSchema ({
    query: rootQuery,
    mutation: rootMutation
});

// Route
app.use('/graphql', graphqlHTTP ({
    schema: schema,
    graphiql: true
}));

app.listen(PORT, () => {
    console.log(`Server running on port: http://localhost:${PORT}`);
});
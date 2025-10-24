CREATE TABLE users (
    id TEXT PRIMARY KEY,  -- ubah dari SERIAL ke TEXT
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fullname VARCHAR(255) NOT NULL
);
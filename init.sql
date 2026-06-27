CREATE TYPE severity as ENUM('low', 'medium', 'high', 'critical');
CREATE TYPE status as ENUM('open', 'in_progress', 'resolved');
CREATE TYPE role_type as ENUM('admin', 'viewer');

CREATE TABLE IF NOT EXISTS metrics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    status_code INTEGER,
    response_time_ms FLOAT,
    checked_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    avg_response_ms DOUBLE PRECISION NOT NULL,
    message TEXT NOT NULL,
    triggered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    severity severity NOT NULL,
    status status NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL NOT NULL PRIMARY KEY,
    username VARCHAR NOT NULL UNIQUE,
    hashed_password VARCHAR NOT NULL,
    role role_type NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS server_logs (
   host varchar NOT NULL,
   time timestamp NOT NULL,
    method varchar NOT NULL, 
    endpoint varchar NOT NULL,
    http_version varchar NOT NULL,
    reply_code int NULL,
    byte int NULL
)

CREATE TABLE IF NOT EXISTS urls (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(255) UNIQUE NOT NULL,
    expected_status INT DEFAULT 200,
    interval INT DEFAULT 60
);

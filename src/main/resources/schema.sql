CREATE TABLE IF NOT EXISTS students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    room_number VARCHAR(30) NOT NULL,
    password VARCHAR(128) NOT NULL,
    created_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS notices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    created_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS hostel_issues (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    issue_code VARCHAR(32) NOT NULL UNIQUE,
    student_name VARCHAR(120) NOT NULL,
    roll_number VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    room_number VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    created_date DATE NOT NULL
);

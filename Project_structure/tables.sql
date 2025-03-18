CREATE TABLE students (
    id UUID PRIMARY KEY NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255) NULL,
    mother_name VARCHAR(255) NULL,
    birth_date DATE NOT NULL,
    phone_number VARCHAR(20) NULL,
    group_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    paid_for_this_month BOOLEAN NOT NULL,
    parents_phone_number VARCHAR(20) NULL,
    telegram_user_id BIGINT UNIQUE,
    came_in_school DATE NOT NULL,
    img_url VARCHAR(255) NULL,
    left_school DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE TABLE groups (
    id UUID PRIMARY KEY NOT NULL,
    group_subject VARCHAR(255) NOT NULL,
    days TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    teacher_id UUID NOT NULL,
    teacher_phone VARCHAR(20) NULL,
    img_url VARCHAR(255) NULL,
    students_amount INTEGER NULL DEFAULT 0,
    paid_students_amount INTEGER NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE TABLE payments (
    id UUID PRIMARY KEY NOT NULL,
    pupil_id UUID NOT NULL,
    payment_amount BIGINT NOT NULL CHECK (payment_amount >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (pupil_id) REFERENCES students(id)
);

CREATE TABLE teachers (
    id UUID PRIMARY KEY NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255) NULL,
    birth_date DATE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    img_url VARCHAR(255) NULL,
    got_salary_for_this_month BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE appeals (
    id UUID PRIMARY KEY NOT NULL,
    pupil_id UUID NOT NULL,
    message TEXT NOT NULL,
    telegram_user_id BIGINT NOT NULL,
    is_seen BOOLEAN NOT NULL DEFAULT FALSE,
    is_answered BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (pupil_id) REFERENCES students(id)
);

CREATE TABLE attendances (
    id UUID PRIMARY KEY NOT NULL,
    group_id UUID NOT NULL REFERENCES groups(id),
    date TIMESTAMP NOT NULL DEFAULT NOW(),
    came_students JSON NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


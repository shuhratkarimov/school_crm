-- 1. Teachers jadvali
CREATE TABLE teachers (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    birth_date DATE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    img_url VARCHAR(255),
    got_salary_for_this_month BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Groups jadvali
CREATE TABLE groups (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    group_subject VARCHAR(255) NOT NULL,
    days TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    teacher_id UUID NOT NULL,
    monthly_fee DECIMAL(10,2) NOT NULL,
    img_url VARCHAR(255),
    students_amount INTEGER NOT NULL DEFAULT 0,
    paid_students_amount INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 3. Students jadvali
CREATE TABLE students (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    mother_name VARCHAR(255),
    birth_date DATE NOT NULL,
    phone_number VARCHAR(20),
    group_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    paid_for_this_month BOOLEAN NOT NULL DEFAULT FALSE,
    parents_phone_number VARCHAR(20),
    telegram_user_id BIGINT UNIQUE,
    came_in_school DATE NOT NULL,
    studental_id VARCHAR (50) NOT NULL,
    img_url VARCHAR(255),
    left_school DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 4. Payments jadvali
CREATE TABLE payments (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    pupil_id UUID NOT NULL,
    payment_amount BIGINT NOT NULL CHECK (payment_amount >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (pupil_id) REFERENCES students(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 5. Appeals jadvali
CREATE TABLE appeals (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    pupil_id UUID NOT NULL,
    message TEXT NOT NULL,
    telegram_user_id BIGINT NOT NULL,
    is_seen BOOLEAN NOT NULL DEFAULT FALSE,
    is_answered BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (pupil_id) REFERENCES students(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 6. Attendances jadvali
CREATE TABLE attendances (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT NOW(),
    came_students JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 7. Users jadvali
CREATE TABLE users (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL DEFAULT 'user',
    verification_code BIGINT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 8. Centers jadvali
CREATE TABLE centers (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 9. Notifications jadvali
CREATE TABLE notifications (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    pupil_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_seen BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (pupil_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 10. NotificationToCenter jadvali
CREATE TABLE notification_to_center (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_seen BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE ON UPDATE CASCADE
);
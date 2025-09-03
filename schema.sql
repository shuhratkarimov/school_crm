CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'user',
    verification_code BIGINT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    father_name VARCHAR,
    birth_date DATE NOT NULL,
    phone_number VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    img_url VARCHAR,
    username VARCHAR DEFAULT NULL,
    password VARCHAR DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    mother_name VARCHAR(255),
    birth_date DATE NOT NULL,
    phone_number VARCHAR(20),
    paid_groups INT,
    total_groups INT,
    parents_phone_number VARCHAR(20),
    telegram_user_id BIGINT,
    came_in_school DATE NOT NULL,
    img_url VARCHAR(255),
    left_school DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    studental_id VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    capacity INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_subject VARCHAR NOT NULL,
    days VARCHAR NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    teacher_id UUID REFERENCES teachers(id) ON UPDATE CASCADE ON DELETE SET NULL,
    monthly_fee INT NOT NULL,
    students_amount INT NOT NULL DEFAULT 0,
    paid_students_amount INT DEFAULT 0,
    room_id UUID REFERENCES rooms(id) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    month VARCHAR,
    year INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pupil_id UUID REFERENCES students(id) ON UPDATE CASCADE ON DELETE SET NULL,
    group_id UUID REFERENCES groups(id) ON UPDATE CASCADE ON DELETE SET NULL,
    payment_amount INT NOT NULL CHECK (payment_amount >= 0),
    payment_type VARCHAR NOT NULL,
    received VARCHAR NOT NULL,
    for_which_month VARCHAR NOT NULL,
    for_which_group VARCHAR NOT NULL,
    comment VARCHAR DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    shouldBeConsideredAsPaid BOOLEAN NOT NULL DEFAULT FALSE,
);

CREATE TABLE IF NOT EXISTS appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pupil_id UUID REFERENCES students(id) ON UPDATE CASCADE ON DELETE SET NULL,
    message TEXT NOT NULL,
    telegram_user_id BIGINT NOT NULL,
    is_seen BOOLEAN NOT NULL DEFAULT FALSE,
    is_answered BOOLEAN NOT NULL DEFAULT FALSE,
    answer TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON UPDATE CASCADE ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID REFERENCES attendances(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR CHECK (status IN ('present', 'absent')) NOT NULL,
    reason VARCHAR CHECK (reason IN ('excused','unexcused')),
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    amount INT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    day VARCHAR CHECK (day IN ('DUSHANBA','SESHANBA','CHORSHANBA','PAYSHANBA','JUMA','SHANBA','YAKSHANBA')) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teacher_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id),
    balance INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS teacher_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id),
    payment_type VARCHAR CHECK (payment_type IN ('avans','hisob')) NOT NULL,
    given_by VARCHAR NOT NULL,
    payment_amount INT NOT NULL,
    given_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "Achievements" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    achiever_id UUID NOT NULL,
    achiever_type VARCHAR(20) NOT NULL CHECK (achiever_type IN ('student', 'teacher')),
    type VARCHAR(255) NOT NULL,
    achievement_title VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMP
);

CREATE TABLE attendance_extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    extended_until TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
);

CREATE TABLE tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    test_number INTEGER NOT NULL,
    test_type VARCHAR(255) NOT NULL,
    total_students INTEGER DEFAULT 0,
    attended_students INTEGER DEFAULT 0,
    average_score FLOAT DEFAULT 0.0,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL,
    student_id UUID NOT NULL,
    score FLOAT NOT NULL,
    attended BOOLEAN DEFAULT false,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE
);
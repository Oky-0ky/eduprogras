-- ============================================
-- EduProgress Database Schema
-- Database: if0_42858697_eduprogress (InfinityFree)
--
-- Cara menjalankan:
-- 1. Buka Panel InfinityFree -> MySQL Databases -> phpMyAdmin
-- 2. Pilih database if0_42858697_eduprogress
-- 3. Tab SQL -> paste seluruh isi file ini -> Go
-- ============================================

SET NAMES utf8mb4;

-- 0. App State (key-value store JSON, untuk sinkronisasi lintas perangkat)
CREATE TABLE IF NOT EXISTS app_state (
  state_key VARCHAR(100) PRIMARY KEY,
  state_value LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create Tables

-- 1. Accounts/Users Table
CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('guru', 'orang_tua', 'admin') DEFAULT 'guru',
  badge VARCHAR(50),
  avatar VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  class VARCHAR(50) NOT NULL,
  nis VARCHAR(20) UNIQUE,
  gender ENUM('Laki-laki', 'Perempuan') DEFAULT 'Laki-laki',
  birthDate DATE,
  parentName VARCHAR(255),
  parentPhone VARCHAR(20),
  avatar VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_class (class),
  INDEX idx_name (name)
);

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
);

-- 4. Capaian Pembelajaran (Learning Outcomes) Table
CREATE TABLE IF NOT EXISTS learning_outcomes (
  id VARCHAR(50) PRIMARY KEY,
  subject_id VARCHAR(50) NOT NULL,
  student_id VARCHAR(50) NOT NULL,
  text LONGTEXT NOT NULL,
  status ENUM('Belum Dimulai', 'Sedang Berjalan', 'Tercapai', 'Sangat Mahir') DEFAULT 'Belum Dimulai',
  progress INT DEFAULT 0,
  teacher_note LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  INDEX idx_student_subject (student_id, subject_id),
  INDEX idx_status (status)
);

-- 5. Assessments Table
CREATE TABLE IF NOT EXISTS assessments (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  subject_id VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  score INT,
  date DATE NOT NULL,
  notes LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  INDEX idx_student_date (student_id, date),
  INDEX idx_subject (subject_id)
);

-- 6. Portfolio Table
CREATE TABLE IF NOT EXISTS portfolio (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  file_type ENUM('image', 'video', 'document', 'other') DEFAULT 'image',
  file_url VARCHAR(500) NOT NULL,
  description LONGTEXT,
  teacher_comment LONGTEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  INDEX idx_student_date (student_id, date),
  INDEX idx_category (category)
);

-- 7. Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description LONGTEXT,
  badge_icon VARCHAR(50),
  achievement_date DATE,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  INDEX idx_student_date (student_id, achievement_date)
);

-- 8. Daily Notes Table
CREATE TABLE IF NOT EXISTS daily_notes (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50),
  category VARCHAR(100),
  content LONGTEXT NOT NULL,
  icon VARCHAR(50),
  teacher VARCHAR(255),
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  INDEX idx_date (date),
  INDEX idx_student_date (student_id, date)
);

-- 9. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(50) PRIMARY KEY,
  sender_role VARCHAR(50),
  sender_name VARCHAR(255),
  text LONGTEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp),
  INDEX idx_is_read (is_read)
);

-- 10. Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  type ENUM('photo', 'video', 'doc', 'other') DEFAULT 'photo',
  url VARCHAR(500) NOT NULL,
  date DATE NOT NULL,
  likes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_date (date),
  INDEX idx_category (category)
);

-- 11. TP Report Status Table (per-student)
CREATE TABLE IF NOT EXISTS tp_report_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  tp_text LONGTEXT NOT NULL,
  status VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  INDEX idx_student (student_id),
  UNIQUE KEY unique_student_tp (student_id, tp_text(255))
);

-- 12. TP Report Notes Table (per-student)
CREATE TABLE IF NOT EXISTS tp_report_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  tp_text LONGTEXT NOT NULL,
  note LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  INDEX idx_student (student_id),
  UNIQUE KEY unique_student_tp_note (student_id, tp_text(255))
);

-- 13. Quiz Data Table (optional for Quiz Juara)
CREATE TABLE IF NOT EXISTS quiz_data (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subject_id VARCHAR(50),
  questions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- 14. Quiz Responses Table
CREATE TABLE IF NOT EXISTS quiz_responses (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  quiz_id VARCHAR(50) NOT NULL,
  answers JSON,
  score INT,
  completed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (quiz_id) REFERENCES quiz_data(id),
  INDEX idx_student_quiz (student_id, quiz_id)
);

-- Insert Demo Accounts
INSERT IGNORE INTO accounts (email, name, role, badge, avatar) VALUES
('guru@eduprogress.com', 'Ustadz Iski', 'guru', '👨‍🏫', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'),
('orangtua@eduprogress.com', 'Bapak Hardian', 'orang_tua', '👨‍👧‍👦', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'),
('admin@eduprogress.com', 'Admin EduProgress', 'admin', '⚙️', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop');

-- Insert Demo Subjects
INSERT IGNORE INTO subjects (id, name, icon, color) VALUES
('subj-1', 'Matematika', '🔢', '#FF6B6B'),
('subj-2', 'Bahasa Indonesia', '📖', '#4ECDC4'),
('subj-3', 'IPA', '🧪', '#45B7D1'),
('subj-4', 'IPS', '🌍', '#FFA07A');

-- Insert Demo Students
INSERT IGNORE INTO students (id, name, class, nis, gender, birthDate, parentName, parentPhone) VALUES
('std-1', 'Ammar', 'IV-A', '20210001', 'Laki-laki', '2016-03-15', 'Bapak Hardian', '+62812345678'),
('std-2', 'Siti', 'IV-A', '20210002', 'Perempuan', '2016-06-22', 'Ibu Sari', '+62812345679');

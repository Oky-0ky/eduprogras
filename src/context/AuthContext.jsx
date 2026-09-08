import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { DEMO_ACCOUNTS, INITIAL_STUDENTS, INITIAL_SUBJECTS, DEFAULT_SCHEDULE, INITIAL_ACHIEVEMENTS, buildInitialAchievements } from '../data/initialData';
import { TP_DATA } from '../data/tpData';
import { setState, getState, getAllState } from '../utils/syncStore';

const readStoredValue = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    return fallback;
  }
};

const migrateStudentProfile = (student) => {
  if (!student) return student;

  const migratedStudent = { ...student };
  if (migratedStudent.homeroomTeacher === 'Bu Nurhayati, S.Pd') {
    migratedStudent.homeroomTeacher = 'Ustadz Iski';
  }
  if (migratedStudent.className === 'Kelas 4A - Bintang Cemerlang') {
    migratedStudent.className = 'Kelas 5 SDQ - Madani Al washiyyah';
  }

  return migratedStudent;
};

const migrateScheduleProfile = (schedule) => ({
  ...schedule,
  teacherMapping: (schedule.teacherMapping || DEFAULT_SCHEDULE.teacherMapping).map((teacher) => {
    if (teacher.name === 'Bu Nurhayati, S.Pd' || teacher.name === 'Bu Nurhayati') {
      return {
        ...teacher,
        name: 'Ustadz Iski',
        role: 'Guru Kelas / Wali Kelas',
        mapel: 'Matematika, B. Indonesia, IPAS, Seni Rupa, Pancasila, B. Arab, PAI Nasional, PAI Lokal, Tahfidz',
        avatar: 'https://i.pinimg.com/1200x/1d/c1/39/1dc139c14c38e85d8c05f5d250df1743.jpg'
      };
    }
    const defaultTeacher = DEFAULT_SCHEDULE.teacherMapping.find((item) => item.name === teacher.name);
    return { ...defaultTeacher, ...teacher, avatar: teacher.avatar || defaultTeacher?.avatar || '' };
  })
});

const migrateAchievements = (achievements) => {
  if (!Array.isArray(achievements) || achievements.length === 0) {
    return buildInitialAchievements();
  }
  if (achievements.some((item) => item.studentId)) {
    return achievements;
  }
  return buildInitialAchievements();
};

const syncStudentAchievementCounts = (achievementList, studentList) => {
  return studentList.map((student) => ({
    ...student,
    totalAchievements: achievementList.filter((item) => item.studentId === student.id).length
  }));
};

const createInitialGrades = () => {
  const grades = {};
  INITIAL_STUDENTS.forEach((student) => {
    grades[student.id] = {};
    INITIAL_SUBJECTS.forEach((subject) => {
      grades[student.id][subject.id] = {
        tugas: [
          { id: 't1', title: 'Tugas 1 - Lembar Kerja Bab 1', score: 85, date: '2026-07-10' },
          { id: 't2', title: 'Tugas 2 - PR Soal Latihan', score: 90, date: '2026-07-18' }
        ],
        ulangan: [
          { id: 'u1', title: 'Ulangan Harian Bab 1', score: 88, date: '2026-07-25' }
        ]
      };
    });
  });
  return grades;
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    return readStoredValue('eduprogress_user', null);
  });

  const [selectedStudent, setSelectedStudent] = useState(() => {
    return migrateStudentProfile(readStoredValue('eduprogress_student', INITIAL_STUDENTS[0]));
  });

  const [students, setStudents] = useState(() => {
    const storedStudents = readStoredValue('eduprogress_students', INITIAL_STUDENTS);
    return storedStudents.map(migrateStudentProfile);
  });
  const [tpData, setTpData] = useState(() => readStoredValue('eduprogress_tp_data', TP_DATA));
  const [scheduleData, setScheduleData] = useState(() => migrateScheduleProfile(readStoredValue('eduprogress_schedule_data', DEFAULT_SCHEDULE)));
  const [achievements, setAchievementsState] = useState(() =>
    migrateAchievements(readStoredValue('eduprogress_achievements', INITIAL_ACHIEVEMENTS))
  );
  const [grades, setGradesState] = useState(() =>
    readStoredValue('eduprogress_grades', createInitialGrades())
  );

  // Simpan nilai ke localStorage.
  const setGrades = useCallback((updater) => {
    setGradesState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('eduprogress_grades', JSON.stringify(next));
      } catch (error) {
        console.warn('Gagal menyimpan nilai ke browser:', error);
      }
      return next;
    });
  }, []);

  // ── Tambah nilai baru (localStorage) ─────────────────────────────────────
  const addGrade = useCallback(({ studentId, subjectId, type, title, score, date }) => {
    const newId = crypto.randomUUID ? crypto.randomUUID() : `g-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newGrade = { id: newId, title, score, date, status: 'submitted' };
    setGradesState((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[studentId]) next[studentId] = {};
      if (!next[studentId][subjectId]) next[studentId][subjectId] = { tugas: [], ulangan: [] };
      next[studentId][subjectId][type].push(newGrade);
      try { localStorage.setItem('eduprogress_grades', JSON.stringify(next)); } catch (_) {}
      return next;
    });
    return newGrade;
  }, []);

  // ── Edit nilai (localStorage) ────────────────────────────────────────────
  const editGrade = useCallback((id, { studentId, subjectId, type, title, score, date }) => {
    setGradesState((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const list = next[studentId]?.[subjectId]?.[type] ?? [];
      const idx = list.findIndex((x) => x.id === id);
      if (idx > -1) list[idx] = { ...list[idx], title, score, date };
      try { localStorage.setItem('eduprogress_grades', JSON.stringify(next)); } catch (_) {}
      return next;
    });
  }, []);

  // ── Hapus nilai (localStorage) ───────────────────────────────────────────
  const removeGrade = useCallback((id, { studentId, subjectId, type }) => {
    setGradesState((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (next[studentId]?.[subjectId]?.[type]) {
        next[studentId][subjectId][type] = next[studentId][subjectId][type].filter((x) => x.id !== id);
      }
      try { localStorage.setItem('eduprogress_grades', JSON.stringify(next)); } catch (_) {}
      return next;
    });
  }, []);

  // ── Toggle status pengumpulan (localStorage) ─────────────────────────────
  const toggleGradeStatus = useCallback((id, { studentId, subjectId, type, currentStatus }) => {
    const newStatus = currentStatus === 'missing' ? 'submitted' : 'missing';
    setGradesState((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const list = next[studentId]?.[subjectId]?.[type] ?? [];
      const item = list.find((x) => x.id === id);
      if (item) item.status = newStatus;
      try { localStorage.setItem('eduprogress_grades', JSON.stringify(next)); } catch (_) {}
      return next;
    });
  }, []);

  const setAchievements = (updater) => {
    setAchievementsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setStudents((currentStudents) => syncStudentAchievementCounts(next, currentStudents));
      return next;
    });
  };

  useEffect(() => {
    localStorage.setItem('eduprogress_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('eduprogress_student', JSON.stringify(selectedStudent));
    setState('eduprogress_student', selectedStudent);
  }, [selectedStudent]);

  useEffect(() => {
    localStorage.setItem('eduprogress_students', JSON.stringify(students));
    setState('eduprogress_students', students);
  }, [students]);

  useEffect(() => {
    localStorage.setItem('eduprogress_tp_data', JSON.stringify(tpData));
    setState('eduprogress_tp_data', tpData);
  }, [tpData]);

  useEffect(() => {
    localStorage.setItem('eduprogress_schedule_data', JSON.stringify(scheduleData));
    setState('eduprogress_schedule_data', scheduleData);
  }, [scheduleData]);

  useEffect(() => {
    localStorage.setItem('eduprogress_achievements', JSON.stringify(achievements));
    setState('eduprogress_achievements', achievements);
  }, [achievements]);

  useEffect(() => {
    setState('eduprogress_grades', grades);
  }, [grades]);

  // ── Muat data dari server saat aplikasi dibuka (sinkron lintas perangkat) ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = await getAllState();
      if (cancelled || !all) return;
      if (Array.isArray(all.eduprogress_students) && all.eduprogress_students.length) {
        setStudents(all.eduprogress_students.map(migrateStudentProfile));
      }
      if (all.eduprogress_tp_data) setTpData(all.eduprogress_tp_data);
      if (all.eduprogress_schedule_data) setScheduleData(migrateScheduleProfile(all.eduprogress_schedule_data));
      if (all.eduprogress_achievements) setAchievementsState(migrateAchievements(all.eduprogress_achievements));
      if (all.eduprogress_grades) setGradesState(all.eduprogress_grades);
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Tambah siswa baru (localStorage) ────────────────────────────────────
  const addStudent = useCallback((newStudent) => {
    setStudents((prev) => {
      const next = [...prev, newStudent];
      try { localStorage.setItem('eduprogress_students', JSON.stringify(next)); } catch (_) {}
      return next;
    });
    return newStudent;
  }, []);

  // ── Simpan/update siswa (localStorage) ──────────────────────────────────
  const saveStudent = useCallback((student) => {
    setStudents((prev) => {
      const next = prev.some((s) => s.id === student.id)
        ? prev.map((s) => (s.id === student.id ? student : s))
        : [...prev, student];
      try { localStorage.setItem('eduprogress_students', JSON.stringify(next)); } catch (_) {}
      return next;
    });
    return student;
  }, []);

  // ── Hapus siswa (localStorage) ──────────────────────────────────────────
  const removeStudent = useCallback((id) => {
    setStudents((prev) => {
      const next = prev.filter((s) => s.id !== id);
      try { localStorage.setItem('eduprogress_students', JSON.stringify(next)); } catch (_) {}
      return next;
    });
  }, []);

  useEffect(() => {
    setStudents((currentStudents) => syncStudentAchievementCounts(achievements, currentStudents));
  }, []);

  useEffect(() => {
    if (!students.length) return;
    const currentStudentStillExists = students.some(student => student.id === selectedStudent?.id);
    if (!currentStudentStillExists) {
      setSelectedStudent(students[0]);
    }
  }, [students, selectedStudent]);

  useEffect(() => {
    const updatedStudent = students.find(student => student.id === selectedStudent?.id);
    if (updatedStudent && updatedStudent !== selectedStudent) {
      setSelectedStudent(updatedStudent);
    }
  }, [students, selectedStudent]);

  const loginWithRole = (roleName) => {
    const foundAcc = DEMO_ACCOUNTS.find(acc => acc.role === roleName) || DEMO_ACCOUNTS[0];
    setUser(foundAcc);
    return foundAcc;
  };

  const switchStudent = (studentId) => {
    const found = students.find(s => s.id === studentId);
    if (found) {
      setSelectedStudent(found);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const resetAllData = () => {
    const freshAchievements = buildInitialAchievements();
    setStudents(syncStudentAchievementCounts(freshAchievements, INITIAL_STUDENTS));
    setSelectedStudent(INITIAL_STUDENTS[0]);
    setAchievementsState(freshAchievements);
    setGrades(createInitialGrades());
    setTpData(TP_DATA);
    setScheduleData(DEFAULT_SCHEDULE);
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      loginWithRole,
      selectedStudent,
      setSelectedStudent,
      switchStudent,
      students,
      setStudents,
      addStudent,
      saveStudent,
      removeStudent,
      tpData,
      setTpData,
      scheduleData,
      setScheduleData,
      achievements,
      setAchievements,
      grades,
      setGrades,
      addGrade,
      editGrade,
      removeGrade,
      toggleGradeStatus,
      logout,
      demoAccounts: DEMO_ACCOUNTS,
      resetAllData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

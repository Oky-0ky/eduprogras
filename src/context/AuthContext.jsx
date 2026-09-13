import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEMO_ACCOUNTS, INITIAL_STUDENTS, INITIAL_SUBJECTS, DEFAULT_SCHEDULE, INITIAL_ACHIEVEMENTS, buildInitialAchievements } from '../data/initialData';
import { TP_DATA } from '../data/tpData';
import { setState, getState, getAllState } from '../utils/syncStore';

// ── Baca dari localStorage (boot awal) ────────────────────────────────────────
const readStoredValue = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (_) {
    return fallback;
  }
};

// ── Tulis ke localStorage (sinkron, tidak lempar error) ───────────────────────
const writeLocal = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
};

// ── Migrasi data lama ──────────────────────────────────────────────────────────
const migrateStudentProfile = (student) => {
  if (!student) return student;
  const s = { ...student };
  if (s.homeroomTeacher === 'Bu Nurhayati, S.Pd') s.homeroomTeacher = 'Ustadz Iski';
  if (s.className === 'Kelas 4A - Bintang Cemerlang') s.className = 'Kelas 5 SDQ - Madani Al washiyyah';
  return s;
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
    const def = DEFAULT_SCHEDULE.teacherMapping.find((t) => t.name === teacher.name);
    return { ...def, ...teacher, avatar: teacher.avatar || def?.avatar || '' };
  })
});

const migrateAchievements = (achievements) => {
  if (!Array.isArray(achievements) || achievements.length === 0) return buildInitialAchievements();
  if (achievements.some((item) => item.studentId)) return achievements;
  return buildInitialAchievements();
};

const syncStudentAchievementCounts = (achievementList, studentList) =>
  studentList.map((student) => ({
    ...student,
    totalAchievements: achievementList.filter((item) => item.studentId === student.id).length
  }));

const createInitialGrades = () => {
  const grades = {};
  INITIAL_STUDENTS.forEach((student) => {
    grades[student.id] = {};
    INITIAL_SUBJECTS.forEach((subject) => {
      grades[student.id][subject.id] = {
        tugas: [
          { id: 't1', title: 'Tugas 1 - Lembar Kerja Bab 1', score: 85, date: '2026-07-10', status: 'submitted' },
          { id: 't2', title: 'Tugas 2 - PR Soal Latihan', score: 90, date: '2026-07-18', status: 'submitted' }
        ],
        ulangan: [
          { id: 'u1', title: 'Ulangan Harian Bab 1', score: 88, date: '2026-07-25', status: 'submitted' }
        ]
      };
    });
  });
  return grades;
};

// ── Debounce helper: tunda eksekusi fn selama `ms` milidetik ─────────────────
function useDebouncedSync(fn, ms = 800) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), ms);
  }, [fn, ms]);
}

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ── State boot dari localStorage ─────────────────────────────────────────
  const [user, setUser] = useState(() => readStoredValue('eduprogress_user', null));

  const [selectedStudent, setSelectedStudent] = useState(() =>
    migrateStudentProfile(readStoredValue('eduprogress_student', INITIAL_STUDENTS[0]))
  );

  const [students, setStudentsState] = useState(() =>
    (readStoredValue('eduprogress_students', INITIAL_STUDENTS)).map(migrateStudentProfile)
  );

  const [tpData, setTpDataState] = useState(() =>
    readStoredValue('eduprogress_tp_data', TP_DATA)
  );

  const [scheduleData, setScheduleDataState] = useState(() =>
    migrateScheduleProfile(readStoredValue('eduprogress_schedule_data', DEFAULT_SCHEDULE))
  );

  const [achievements, setAchievementsState] = useState(() =>
    migrateAchievements(readStoredValue('eduprogress_achievements', INITIAL_ACHIEVEMENTS))
  );

  const [grades, setGradesState] = useState(() =>
    readStoredValue('eduprogress_grades', createInitialGrades())
  );

  // Apakah sedang memuat dari server (boot sync)
  const [isSyncing, setIsSyncing] = useState(true);

  // ── Debounced server-sync untuk grades (data besar, jangan spam) ──────────
  const syncGradesToServer = useCallback((value) => {
    setState('eduprogress_grades', value);
  }, []);
  const debouncedGradeSync = useDebouncedSync(syncGradesToServer, 1000);

  // ── Setter students (local + server) ──────────────────────────────────────
  const setStudents = useCallback((updater) => {
    setStudentsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      writeLocal('eduprogress_students', next);
      setState('eduprogress_students', next);
      return next;
    });
  }, []);

  // ── Setter tpData (local + server) ────────────────────────────────────────
  const setTpData = useCallback((updater) => {
    setTpDataState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      writeLocal('eduprogress_tp_data', next);
      setState('eduprogress_tp_data', next);
      return next;
    });
  }, []);

  // ── Setter scheduleData (local + server) ──────────────────────────────────
  const setScheduleData = useCallback((updater) => {
    setScheduleDataState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      writeLocal('eduprogress_schedule_data', next);
      setState('eduprogress_schedule_data', next);
      return next;
    });
  }, []);

  // ── Setter grades (local + debounced server) ──────────────────────────────
  const setGrades = useCallback((updater) => {
    setGradesState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      writeLocal('eduprogress_grades', next);
      debouncedGradeSync(next);
      return next;
    });
  }, [debouncedGradeSync]);

  // ── Tambah nilai baru ──────────────────────────────────────────────────────
  const addGrade = useCallback(({ studentId, subjectId, type, title, score, date, status }) => {
    const newId = crypto.randomUUID
      ? crypto.randomUUID()
      : `g-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newGrade = { id: newId, title, score, date, status: status || (score === 0 ? 'missing' : 'submitted') };
    setGradesState((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[studentId]) next[studentId] = {};
      if (!next[studentId][subjectId]) next[studentId][subjectId] = { tugas: [], ulangan: [] };
      next[studentId][subjectId][type].push(newGrade);
      writeLocal('eduprogress_grades', next);
      debouncedGradeSync(next);
      return next;
    });
    return newGrade;
  }, [debouncedGradeSync]);

  // ── Edit nilai ─────────────────────────────────────────────────────────────
  const editGrade = useCallback((id, { studentId, subjectId, type, title, score, date }) => {
    setGradesState((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const list = next[studentId]?.[subjectId]?.[type] ?? [];
      const idx = list.findIndex((x) => x.id === id);
      if (idx > -1) list[idx] = { ...list[idx], title, score, date };
      writeLocal('eduprogress_grades', next);
      debouncedGradeSync(next);
      return next;
    });
  }, [debouncedGradeSync]);

  // ── Hapus nilai ────────────────────────────────────────────────────────────
  const removeGrade = useCallback((id, { studentId, subjectId, type }) => {
    setGradesState((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (next[studentId]?.[subjectId]?.[type]) {
        next[studentId][subjectId][type] = next[studentId][subjectId][type].filter((x) => x.id !== id);
      }
      writeLocal('eduprogress_grades', next);
      debouncedGradeSync(next);
      return next;
    });
  }, [debouncedGradeSync]);

  // ── Toggle status pengumpulan ──────────────────────────────────────────────
  const toggleGradeStatus = useCallback((id, { studentId, subjectId, type, currentStatus }) => {
    const newStatus = currentStatus === 'missing' ? 'submitted' : 'missing';
    setGradesState((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const list = next[studentId]?.[subjectId]?.[type] ?? [];
      const item = list.find((x) => x.id === id);
      if (item) item.status = newStatus;
      writeLocal('eduprogress_grades', next);
      debouncedGradeSync(next);
      return next;
    });
  }, [debouncedGradeSync]);

  // ── Achievements setter ────────────────────────────────────────────────────
  const setAchievements = useCallback((updater) => {
    setAchievementsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      writeLocal('eduprogress_achievements', next);
      setState('eduprogress_achievements', next);
      // Sinkronkan total achievement ke data siswa
      setStudentsState((currentStudents) => {
        const synced = syncStudentAchievementCounts(next, currentStudents);
        writeLocal('eduprogress_students', synced);
        setState('eduprogress_students', synced);
        return synced;
      });
      return next;
    });
  }, []);

  // ── Simpan user ke localStorage saat login/logout ─────────────────────────
  useEffect(() => {
    writeLocal('eduprogress_user', user);
  }, [user]);

  // ── Simpan selectedStudent ke localStorage + server ───────────────────────
  useEffect(() => {
    writeLocal('eduprogress_student', selectedStudent);
    setState('eduprogress_student', selectedStudent);
  }, [selectedStudent]);

  // ── Sync initial achievements ke students saat mount ──────────────────────
  useEffect(() => {
    setStudentsState((current) => syncStudentAchievementCounts(achievements, current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Boot: muat semua data terbaru dari server (sinkronisasi lintas browser) ─
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await getAllState();
        if (cancelled || !all) return;

        if (Array.isArray(all.eduprogress_students) && all.eduprogress_students.length) {
          const migrated = all.eduprogress_students.map(migrateStudentProfile);
          setStudentsState(migrated);
          writeLocal('eduprogress_students', migrated);
        }
        if (all.eduprogress_tp_data && typeof all.eduprogress_tp_data === 'object') {
          setTpDataState(all.eduprogress_tp_data);
          writeLocal('eduprogress_tp_data', all.eduprogress_tp_data);
        }
        if (all.eduprogress_schedule_data && all.eduprogress_schedule_data.timeSlots) {
          const migrated = migrateScheduleProfile(all.eduprogress_schedule_data);
          setScheduleDataState(migrated);
          writeLocal('eduprogress_schedule_data', migrated);
        }
        if (all.eduprogress_achievements && Array.isArray(all.eduprogress_achievements)) {
          const migrated = migrateAchievements(all.eduprogress_achievements);
          setAchievementsState(migrated);
          writeLocal('eduprogress_achievements', migrated);
        }
        if (all.eduprogress_grades && typeof all.eduprogress_grades === 'object') {
          setGradesState(all.eduprogress_grades);
          writeLocal('eduprogress_grades', all.eduprogress_grades);
        }
        if (all.eduprogress_sent_reports) {
          writeLocal('eduprogress_sent_reports', all.eduprogress_sent_reports);
        }
      } catch (err) {
        console.warn('[AuthContext] Boot sync gagal, pakai data lokal:', err.message);
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Jaga selectedStudent tetap sinkron dengan daftar students ─────────────
  useEffect(() => {
    if (!students.length) return;
    if (!students.some((s) => s.id === selectedStudent?.id)) {
      setSelectedStudent(students[0]);
    }
  }, [students, selectedStudent]);

  useEffect(() => {
    const updated = students.find((s) => s.id === selectedStudent?.id);
    if (updated && updated !== selectedStudent) setSelectedStudent(updated);
  }, [students, selectedStudent]);

  // ── Operasi siswa ──────────────────────────────────────────────────────────
  const addStudent = useCallback((newStudent) => {
    setStudents((prev) => [...prev, newStudent]);
    return newStudent;
  }, [setStudents]);

  const saveStudent = useCallback((student) => {
    setStudents((prev) =>
      prev.some((s) => s.id === student.id)
        ? prev.map((s) => (s.id === student.id ? student : s))
        : [...prev, student]
    );
    return student;
  }, [setStudents]);

  const removeStudent = useCallback((id) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }, [setStudents]);

  // ── Auth helpers ───────────────────────────────────────────────────────────
  const loginWithRole = (roleName) => {
    const acc = DEMO_ACCOUNTS.find((a) => a.role === roleName) || DEMO_ACCOUNTS[0];
    setUser(acc);
    return acc;
  };

  const switchStudent = (studentId) => {
    const found = students.find((s) => s.id === studentId);
    if (found) setSelectedStudent(found);
  };

  const logout = () => setUser(null);

  // ── Reset semua data ke default ────────────────────────────────────────────
  const resetAllData = () => {
    const freshAchievements = buildInitialAchievements();
    const freshStudents = syncStudentAchievementCounts(freshAchievements, INITIAL_STUDENTS);
    const freshGrades = createInitialGrades();

    setStudentsState(freshStudents);
    setSelectedStudent(freshStudents[0]);
    setAchievementsState(freshAchievements);
    setGradesState(freshGrades);
    setTpDataState(TP_DATA);
    setScheduleDataState(DEFAULT_SCHEDULE);

    // Sync semua ke server sekaligus
    writeLocal('eduprogress_students', freshStudents);
    writeLocal('eduprogress_achievements', freshAchievements);
    writeLocal('eduprogress_grades', freshGrades);
    writeLocal('eduprogress_tp_data', TP_DATA);
    writeLocal('eduprogress_schedule_data', DEFAULT_SCHEDULE);

    setState('eduprogress_students', freshStudents);
    setState('eduprogress_achievements', freshAchievements);
    setState('eduprogress_grades', freshGrades);
    setState('eduprogress_tp_data', TP_DATA);
    setState('eduprogress_schedule_data', DEFAULT_SCHEDULE);
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      loginWithRole,
      logout,
      isSyncing,
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
      demoAccounts: DEMO_ACCOUNTS,
      resetAllData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

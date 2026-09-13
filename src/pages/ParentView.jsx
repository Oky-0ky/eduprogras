import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { INITIAL_STUDENTS } from '../data/initialData';
import ParentReport from './ParentReport';
import ParentTaskReport from './ParentTaskReport';

// Helper to build chapter title list in consistent order
const getAllChapterTitles = (globalTpData) => {
  if (!globalTpData || Object.keys(globalTpData).length === 0) return [];
  return Object.values(globalTpData).flatMap(subjObj =>
    (subjObj.chapters || []).map(chap => chap.chapter)
  );
};

export default function ParentView() {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const { students, tpData: globalTpData } = useAuth();
  const isTaskReport = searchParams.get('report') === 'tasks';

  let selectedChapters = null;
  try {
    const bParam = searchParams.get('b');
    const babParam = searchParams.get('bab');

    if (bParam !== null) {
      // Short format: index list e.g. ?b=0,1,2
      const allTitles = getAllChapterTitles(globalTpData);
      const indices = bParam.split(',').map(Number);
      selectedChapters = indices.map(idx => allTitles[idx]).filter(Boolean);
    } else if (babParam !== null) {
      // Legacy JSON format
      const parsedChapters = JSON.parse(babParam);
      if (Array.isArray(parsedChapters)) selectedChapters = parsedChapters;
    }
  } catch (e) {
    // Keep legacy links usable when the optional filter is invalid.
  }

  const student = students?.find(s => s.id === studentId || s.id === `std-${studentId}`)
    || INITIAL_STUDENTS.find(s => s.id === studentId || s.id === `std-${studentId}`);

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center max-w-sm">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-lg font-black text-slate-800 mb-2">Laporan Tidak Ditemukan</h1>
          <p className="text-xs text-slate-500">Link laporan ini tidak valid atau telah kedaluwarsa. Silakan minta kembali link terbaru dari Wali Kelas.</p>
        </div>
      </div>
    );
  }

  if (isTaskReport) {
    let tasks = [];
    try {
      const encodedTasks = searchParams.get('t');
      if (encodedTasks) tasks = JSON.parse(encodedTasks);
    } catch (error) { /* Link tetap menampilkan laporan kosong jika data rusak */ }
    return <ParentTaskReport student={student} tasks={tasks} />;
  }

  return <ParentReport student={student} selectedChapters={selectedChapters} />;
}

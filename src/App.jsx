import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { QuizProvider } from './context/QuizContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FloatingMascot from './components/FloatingMascot';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NilaiPage from './pages/NilaiPage';
import SchedulePage from './pages/SchedulePage';
import LearningProgress from './pages/LearningProgress';
import LearningOutcomes from './pages/LearningOutcomes';
import Assessment from './pages/Assessment';
import Portfolio from './pages/Portfolio';
import Achievement from './pages/Achievement';
import Attendance from './pages/Attendance';
import DailyNotes from './pages/DailyNotes';
import Gallery from './pages/Gallery';
import Messages from './pages/Messages';
import AdminPanel from './pages/AdminPanel';
import Reports from './pages/Reports';
import ParentView from './pages/ParentView';
import Settings from './pages/Settings';
import PenyimpananPage from './components/PenyimpananPage';
import QuizPage from './pages/QuizPage';
import JoinPage from './pages/JoinPage';
import TaskReport from './pages/TaskReport';
import Notes from './pages/Notes';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/" replace />;
}

function AppLayout({ children }) {
  const { selectedStudent } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <FloatingMascot studentName={selectedStudent?.name.split(' ')[0]} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <QuizProvider>
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

              <Route path="/join" element={<JoinPage />} />

              <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/schedule" element={<ProtectedRoute><AppLayout><SchedulePage /></AppLayout></ProtectedRoute>} />
              <Route path="/nilai" element={<ProtectedRoute><AppLayout><NilaiPage /></AppLayout></ProtectedRoute>} />
              <Route path="/learning-progress" element={<ProtectedRoute><AppLayout><LearningProgress /></AppLayout></ProtectedRoute>} />
              <Route path="/learning-outcomes" element={<ProtectedRoute><AppLayout><LearningOutcomes /></AppLayout></ProtectedRoute>} />
              <Route path="/assessment" element={<ProtectedRoute><AppLayout><Assessment /></AppLayout></ProtectedRoute>} />
              <Route path="/portfolio" element={<ProtectedRoute><AppLayout><Portfolio /></AppLayout></ProtectedRoute>} />
              <Route path="/achievements" element={<ProtectedRoute><AppLayout><Achievement /></AppLayout></ProtectedRoute>} />
              <Route path="/attendance" element={<ProtectedRoute><AppLayout><Attendance /></AppLayout></ProtectedRoute>} />
              <Route path="/daily-notes" element={<ProtectedRoute><AppLayout><DailyNotes /></AppLayout></ProtectedRoute>} />
              <Route path="/gallery" element={<ProtectedRoute><AppLayout><Gallery /></AppLayout></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><AppLayout><Messages /></AppLayout></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AppLayout><AdminPanel /></AppLayout></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
              <Route path="/reports/:studentId" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
              <Route path="/laporan/:studentId" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
              <Route path="/parent/:studentId" element={<Reports parentAccess={true} />} />
              {/* Halaman Laporan Bersih untuk Orang Tua via Link — TANPA LOGIN & TANPA MENU */}
              <Route path="/ortu/:studentId" element={<ParentView />} />
              <Route path="/o/:studentId" element={<ParentView />} />
              <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
              <Route path="/penyimpanan" element={<ProtectedRoute><AppLayout><PenyimpananPage /></AppLayout></ProtectedRoute>} />
              <Route path="/quiz" element={<ProtectedRoute><AppLayout><QuizPage /></AppLayout></ProtectedRoute>} />
              <Route path="/task-report" element={<ProtectedRoute><AppLayout><TaskReport /></AppLayout></ProtectedRoute>} />
              <Route path="/notes" element={<ProtectedRoute><AppLayout><Notes /></AppLayout></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </QuizProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}


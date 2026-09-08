const STORAGE_KEY = 'eduprogress_sent_reports';

export const getSentReports = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveSentReport = (report) => {
  const existing = getSentReports();
  const entry = {
    id: `report-${Date.now()}`,
    sentAt: new Date().toISOString(),
    ...report
  };
  const updated = [entry, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
  return entry;
};

export const deleteSentReport = (reportId) => {
  const updated = getSentReports().filter((item) => item.id !== reportId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
  return updated;
};

export const getReportsForStudent = (studentId) => {
  return getSentReports().filter((item) => item.studentId === studentId);
};

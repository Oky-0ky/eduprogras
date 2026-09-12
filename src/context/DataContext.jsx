import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { DEFAULT_SCHEDULE } from '../data/initialData';

const DataContext = createContext();

// Ganti sesuai URL backend Railway kamu (bisa juga taruh di file .env sebagai VITE_API_URL)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://NAMA-APP-KAMU.up.railway.app';

async function syncGet(key) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/data/${key}`);
    if (!res.ok) throw new Error(`syncGet gagal (${res.status})`);
    const json = await res.json();
    return json?.value ?? null;
  } catch (err) {
    console.error(`[syncGet] ${key}:`, err);
    return null;
  }
}

async function syncSet(key, value) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/data/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error(`syncSet gagal (${res.status})`);
    return true;
  } catch (err) {
    console.error(`[syncSet] ${key}:`, err);
    return false;
  }
}

export const DataProvider = ({ children }) => {
  const [scheduleData, setScheduleDataState] = useState(DEFAULT_SCHEDULE);
  const [tpData, setTpDataState] = useState({});
  const [isSyncing, setIsSyncing] = useState(true);

  // Tarik data terbaru dari Railway saat aplikasi pertama kali dibuka
  useEffect(() => {
    (async () => {
      const [remoteSchedule, remoteTp] = await Promise.all([
        syncGet('scheduleData'),
        syncGet('tpData'),
      ]);
      if (remoteSchedule) setScheduleDataState(remoteSchedule);
      if (remoteTp) setTpDataState(remoteTp);
      setIsSyncing(false);
    })();
  }, []);

  // Setter ini menggantikan setScheduleData/setTpData lama:
  // update state lokal dulu (biar UI responsif), lalu kirim ke Railway di belakang layar
  const setScheduleData = useCallback((value) => {
    setScheduleDataState(value);
    syncSet('scheduleData', value);
  }, []);

  const setTpData = useCallback((value) => {
    setTpDataState(value);
    syncSet('tpData', value);
  }, []);

  return (
    <DataContext.Provider value={{ scheduleData, setScheduleData, tpData, setTpData, isSyncing }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

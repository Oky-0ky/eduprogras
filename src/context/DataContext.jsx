import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { DEFAULT_SCHEDULE } from '../data/initialData';
import { setState, getState } from '../utils/syncStore';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [scheduleData, setScheduleDataState] = useState(DEFAULT_SCHEDULE);
  const [tpData, setTpDataState] = useState({});
  const [isSyncing, setIsSyncing] = useState(true);

  // Tarik data terbaru dari server (MySQL via /api/state) saat aplikasi pertama dibuka
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [remoteSchedule, remoteTp] = await Promise.all([
        getState('scheduleData'),
        getState('tpData'),
      ]);
      if (cancelled) return;
      if (remoteSchedule) setScheduleDataState(remoteSchedule);
      if (remoteTp) setTpDataState(remoteTp);
      setIsSyncing(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Update state lokal dulu (UI responsif), lalu kirim ke server di belakang layar
  const setScheduleData = useCallback((value) => {
    setScheduleDataState(value);
    setState('scheduleData', value);
  }, []);

  const setTpData = useCallback((value) => {
    setTpDataState(value);
    setState('tpData', value);
  }, []);

  return (
    <DataContext.Provider value={{ scheduleData, setScheduleData, tpData, setTpData, isSyncing }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

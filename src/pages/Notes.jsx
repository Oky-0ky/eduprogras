import { useEffect, useState } from 'react';
import { setState, getState } from '../utils/syncStore';

const NOTES_KEY = 'eduprogress_notes';
const readNotes = () => {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'); } catch (_) { return []; }
};

const EMPTY_NOTE = { content: '', category: 'Umum', teacher: 'Ustadz Iski' };

export default function Notes() {
  const [notes, setNotes] = useState(readNotes);
  const [note, setNote] = useState(EMPTY_NOTE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); } catch (_) {}
    setState(NOTES_KEY, notes);
  }, [notes]);

  // Muat catatan dari server saat halaman dibuka
  useEffect(() => {
    getState(NOTES_KEY, []).then((data) => {
      if (Array.isArray(data) && data.length) setNotes(data);
    });
  }, []);

  function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    const savedNote = {
      ...note,
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
    };
    setNotes((current) => [savedNote, ...current]);
    setNote(EMPTY_NOTE);
    setSaving(false);
  }

  return (
    <div className="p-6 space-y-6">
      <form onSubmit={handleSave} className="space-y-3">
        <input value={note.category} onChange={(event) => setNote({ ...note, category: event.target.value })} placeholder="Kategori" className="border rounded p-2 w-full" />
        <textarea required value={note.content} onChange={(event) => setNote({ ...note, content: event.target.value })} placeholder="Tulis catatan..." className="border rounded p-2 w-full" />
        <button disabled={saving} className="bg-indigo-600 text-white rounded px-4 py-2">{saving ? 'Menyimpan...' : 'Simpan catatan'}</button>
      </form>
      <div className="space-y-3">
        {notes.map((item) => <article key={item.id} className="border rounded p-4"><strong>{item.category}</strong><p>{item.content}</p></article>)}
      </div>
    </div>
  );
}
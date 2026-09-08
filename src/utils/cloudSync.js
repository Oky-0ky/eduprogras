// Cloud Sync for EduProgress Parent Report
const CLOUD_MAP = {
  "std-1": "ff8081819ff5b11001a0412c8d0f2e1a",
  "std-2": "ff8081819ff5b11001a0412c8d952e1b",
  "std-3": "ff8081819ff5b11001a0412c8de72e1c",
  "std-4": "ff8081819ff5b11001a0412c8e3b2e1d",
  "std-5": "ff8081819ff5b11001a0412c8e882e1e",
  "std-6": "ff8081819ff5b11001a0412c8eda2e1f",
  "std-7": "ff8081819ff5b11001a0412c8f292e20",
  "std-8": "ff8081819ff5b11001a0412c8f752e21",
  "std-9": "ff8081819ff5b11001a0412c8fc52e22"
};

export async function saveReportToCloud(studentId, payload) {
  const stdId = studentId?.startsWith('std-') ? studentId : `std-${studentId}`;
  const cloudId = CLOUD_MAP[stdId];
  if (!cloudId) return null;

  try {
    const res = await fetch(`https://api.restful-api.dev/objects/${cloudId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `edupogres_report_${stdId}`,
        data: {
          notes: payload.notes || {},
          status: payload.status || {},
          selectedChapters: payload.selectedChapters || null,
          prePost: payload.prePost || null,
          updatedAt: new Date().toISOString()
        }
      })
    });
    return await res.json();
  } catch (e) {
    console.warn('Cloud sync error:', e);
    return null;
  }
}

export async function fetchReportFromCloud(studentId) {
  const stdId = studentId?.startsWith('std-') ? studentId : `std-${studentId}`;
  const cloudId = CLOUD_MAP[stdId];
  if (!cloudId) return null;

  try {
    const res = await fetch(`https://api.restful-api.dev/objects/${cloudId}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch (e) {
    console.warn('Cloud fetch error:', e);
    return null;
  }
}

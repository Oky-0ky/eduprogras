const API_URL = import.meta.env.VITE_API_URL || 'https://eduprogress-api-production.up.railway.app';

// Helper untuk mengambil data dari Railway
export const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`\({API_URL}\){endpoint}`);
    return await response.json();
  } catch (error) {
    console.error(`Gagal mengambil data dari ${endpoint}:`, error);
    throw error;
  }
};

// Helper untuk menyimpan data ke Railway
export const saveData = async (endpoint, payload) => {
  try {
    const response = await fetch(`\({API_URL}\){endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error(`Gagal menyimpan data ke ${endpoint}:`, error);
    throw error;
  }
};

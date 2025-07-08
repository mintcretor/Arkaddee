// utils/lingvaTranslator.ts
import axios from 'axios';

// Lingva เป็น API proxy ฟรีที่ใช้ Google Translate
const LINGVA_URL = 'https://lingva.ml/api/v1';

export const translateWithLingva = async (text: string, to: string, from = 'auto') => {
  try {
    const response = await axios.get(
      `${LINGVA_URL}/${from}/${to}/${encodeURIComponent(text)}`
    );
    console.log('Lingva translation response:', response.data);
    return response.data.translation;
  } catch (error) {
    console.error('Lingva translation error:', error);
    return text;
  }
};
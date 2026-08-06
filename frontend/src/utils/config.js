const isProd = import.meta.env.MODE === 'production';
const VITE_API_URL = import.meta.env.VITE_API_URL || (isProd ? 'https://mason-6c8l.onrender.com/api/v1' : 'http://localhost:5050/api/v1');
export default VITE_API_URL;

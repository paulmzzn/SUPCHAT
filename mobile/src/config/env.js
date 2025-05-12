import { API_URL, ENV } from '@env';

// Provide fallbacks in case the env variables aren't set
export default {
  API_URL: API_URL || 'http://localhost:5000',
  ENV: ENV || 'development',
};

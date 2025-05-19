import { API_URL, ENV, S3_BASE_URL } from '@env';

// Provide fallbacks in case the env variables aren't set
export default {
  API_URL: API_URL || 'http://192.168.1.167:3000',
  ENV: ENV || 'development',
  S3_BASE_URL: S3_BASE_URL || 'https://s3-supchat.s3.fr-par.scw.cloud/',
};

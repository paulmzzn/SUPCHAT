import {
  API_URL,
  ENV,
  S3_BASE_URL,
  EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_S3_BASE_URL,
  EXPO_PUBLIC_ENV,
} from "@env";

// Provide fallbacks in case the env variables aren't set
export default {
  API_URL: EXPO_PUBLIC_API_URL || API_URL || "http://192.168.1.64:3000",
  ENV: EXPO_PUBLIC_ENV || ENV || "development",
  S3_BASE_URL:
    EXPO_PUBLIC_S3_BASE_URL ||
    S3_BASE_URL ||
    "https://s3-supchat.s3.fr-par.scw.cloud/",
};

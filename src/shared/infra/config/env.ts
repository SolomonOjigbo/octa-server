import dotenv from 'dotenv';

export function loadEnv() {
  const result = dotenv.config();
  if (result.error) {
    throw new Error(`.env config error: ${result.error}`);
  }
}
export function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}
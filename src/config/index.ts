// config/index.ts
const env = process.env.NODE_ENV || 'development'; // Default to 'development' if NODE_ENV is not set

const config: { [key: string]: () => Promise<any> }  = {
  development: () => import('./development').then(m => m.default),
  production: () => import('./production').then(m => m.default),
};

export default async () => {
  const configLoader = config[env];
  return await configLoader();
};
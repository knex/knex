import * as postgres from './postgres/global-setup';

export const getDatabaseStartupFunctions = (client?: string) => {
  if (!client) {
    return;
  }

  if (client === 'pg' || client === 'postgres') {
    return postgres;
  }

  throw new Error('DB configuration not found');
};

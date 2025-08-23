import env from 'env-var';

import { DatabaseConfig } from './types';

export const RUN_TEST_MIGRATIONS = env.get('RUN_TEST_MIGRATIONS').required().asBoolStrict();
export const DB_CONFIG = env.get('DB_CONFIG').required().asJsonObject() as DatabaseConfig;

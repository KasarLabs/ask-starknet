import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file from the package root
config({ path: resolve(__dirname, '../.env') });


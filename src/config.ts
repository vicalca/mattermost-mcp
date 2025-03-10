import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Config {
  mattermostUrl: string;
  token: string;
  teamId: string;
}

export function loadConfig(): Config {
  try {
    // Look for config.json in the parent directory of the current module
    const configPath = path.resolve(__dirname, '../config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData) as Config;
    
    // Validate required fields
    if (!config.mattermostUrl) {
      throw new Error('Missing mattermostUrl in config.json');
    }
    if (!config.token) {
      throw new Error('Missing token in config.json');
    }
    if (!config.teamId) {
      throw new Error('Missing teamId in config.json');
    }
    
    return config;
  } catch (error) {
    console.error('Error loading configuration:', error);
    throw new Error('Failed to load configuration. Please ensure config.json exists and contains valid data.');
  }
}

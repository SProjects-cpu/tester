import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only create logs directory in non-serverless environments
let logsDir;

if (process.env.VERCEL !== '1') {
  logsDir = path.join(__dirname, '../logs');
  // Ensure logs directory exists
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} else {
  // On Vercel, use /tmp for logs (ephemeral)
  logsDir = '/tmp/logs';
}

const getLogFileName = () => {
  const date = new Date().toISOString().split('T')[0];
  return path.join(logsDir, `${date}.log`);
};

const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `[${timestamp}] [${level}] ${message} ${metaStr}\n`;
};

export const logger = {
  info: (message, meta) => {
    const log = formatLog('INFO', message, meta);
    console.log(log.trim());
    // Only write to file in non-serverless environments
    if (process.env.VERCEL !== '1') {
      fs.appendFileSync(getLogFileName(), log);
    }
  },

  error: (message, meta) => {
    const log = formatLog('ERROR', message, meta);
    console.error(log.trim());
    // Only write to file in non-serverless environments
    if (process.env.VERCEL !== '1') {
      fs.appendFileSync(getLogFileName(), log);
    }
  },

  warn: (message, meta) => {
    const log = formatLog('WARN', message, meta);
    console.warn(log.trim());
    // Only write to file in non-serverless environments
    if (process.env.VERCEL !== '1') {
      fs.appendFileSync(getLogFileName(), log);
    }
  },

  debug: (message, meta) => {
    if (process.env.NODE_ENV === 'development') {
      const log = formatLog('DEBUG', message, meta);
      console.debug(log.trim());
      // Only write to file in non-serverless environments
      if (process.env.VERCEL !== '1') {
        fs.appendFileSync(getLogFileName(), log);
      }
    }
  }
};

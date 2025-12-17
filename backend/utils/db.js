import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only initialize directories in non-serverless environments
let DATA_DIR;

if (process.env.VERCEL !== '1') {
  DATA_DIR = path.join(__dirname, '../data');
  
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Initialize data files
  const initializeDataFiles = () => {
    const files = {
      'users.json': [],
      'startups.json': [],
      'smc-schedules.json': [],
      'one-on-one-sessions.json': [],
      'settings.json': {},
      'landing-page.json': {}
    };

    Object.entries(files).forEach(([filename, defaultData]) => {
      const filepath = path.join(DATA_DIR, filename);
      if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, JSON.stringify(defaultData, null, 2));
      }
    });
  };

  initializeDataFiles();
} else {
  // On Vercel, set a dummy path (won't be used)
  DATA_DIR = '/tmp/data';
}

// Database operations
class JsonDB {
  constructor(filename) {
    this.filepath = path.join(DATA_DIR, filename);
  }

  read() {
    try {
      const data = fs.readFileSync(this.filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${this.filepath}:`, error);
      return Array.isArray(this.getDefault()) ? [] : {};
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filepath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing ${this.filepath}:`, error);
      return false;
    }
  }

  getDefault() {
    const filename = path.basename(this.filepath);
    return filename.includes('settings') || filename.includes('landing-page') ? {} : [];
  }

  // Find all
  findAll(filter = {}) {
    const data = this.read();
    if (Object.keys(filter).length === 0) return data;
    
    return data.filter(item => {
      return Object.entries(filter).every(([key, value]) => {
        if (typeof value === 'object' && value.$regex) {
          return new RegExp(value.$regex, value.$options || 'i').test(item[key]);
        }
        return item[key] === value;
      });
    });
  }

  // Find one
  findOne(filter) {
    const data = this.read();
    return data.find(item => {
      return Object.entries(filter).every(([key, value]) => item[key] === value);
    });
  }

  // Find by ID
  findById(id) {
    const data = this.read();
    return data.find(item => item.id === id || item._id === id);
  }

  // Create
  create(item) {
    const data = this.read();
    const newItem = {
      ...item,
      id: item.id || this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.push(newItem);
    this.write(data);
    return newItem;
  }

  // Update
  update(id, updates) {
    const data = this.read();
    const index = data.findIndex(item => item.id === id || item._id === id);
    
    if (index === -1) return null;
    
    data[index] = {
      ...data[index],
      ...updates,
      id: data[index].id,
      updatedAt: new Date().toISOString()
    };
    
    this.write(data);
    return data[index];
  }

  // Delete
  delete(id) {
    const data = this.read();
    const filtered = data.filter(item => item.id !== id && item._id !== id);
    
    if (filtered.length === data.length) return false;
    
    this.write(filtered);
    return true;
  }

  // Count
  count(filter = {}) {
    return this.findAll(filter).length;
  }

  // Clear all
  clear() {
    this.write([]);
  }

  // Generate ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Export database instances
export const usersDB = new JsonDB('users.json');
export const startupsDB = new JsonDB('startups.json');
export const smcSchedulesDB = new JsonDB('smc-schedules.json');
export const oneOnOneSessionsDB = new JsonDB('one-on-one-sessions.json');
export const settingsDB = new JsonDB('settings.json');
export const landingPageDB = new JsonDB('landing-page.json');

export default JsonDB;

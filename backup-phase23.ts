// Full Backup Script for Phase 23 Fix
// Creates backup of code, MongoDB data, and configuration

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BACKUP_DIR = 'Backup_Fix_Errores_Fase23_2026';
const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

console.log('🔄 Creating full backup...');

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const backupPath = path.join(BACKUP_DIR, `backup_${timestamp}`);
fs.mkdirSync(backupPath, { recursive: true });

console.log(`📁 Backup location: ${backupPath}`);

// 1. Backup code (excluding node_modules and .vite)
console.log('📦 Backing up code...');
const excludeDirs = ['node_modules', '.vite', 'dist', 'Backup_Fix_Errores_Fase23_2026'];
const codeBackupPath = path.join(backupPath, 'code');
fs.mkdirSync(codeBackupPath, { recursive: true });

// Copy important directories
const dirsToBackup = ['backend', 'src', 'shared', 'database', 'scripts'];
dirsToBackup.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`  Copying ${dir}...`);
    execSync(`xcopy /E /I /Y "${dir}" "${path.join(codeBackupPath, dir)}"`, { stdio: 'inherit' });
  }
});

// Copy important files
const filesToBackup = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  '.env',
  'start-comexia.bat'
];
filesToBackup.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  Copying ${file}...`);
    fs.copyFileSync(file, path.join(codeBackupPath, file));
  }
});

// 2. Backup SQLite database
console.log('💾 Backing up SQLite database...');
if (fs.existsSync('comexia_v2.db')) {
  fs.copyFileSync('comexia_v2.db', path.join(backupPath, 'comexia_v2.db'));
  console.log('  ✅ SQLite backup complete');
}

// 3. Export MongoDB data
console.log('🗄️ Exporting MongoDB data...');
const mongoBackupPath = path.join(backupPath, 'mongodb_export');
fs.mkdirSync(mongoBackupPath, { recursive: true });

try {
  // Export each collection
  const collections = [
    'countries',
    'hscodes',
    'companies',
    'users',
    'marketplaceposts',
    'conversations',
    'messages'
  ];

  collections.forEach(collection => {
    try {
      console.log(`  Exporting ${collection}...`);
      execSync(
        `mongoexport --uri="${process.env.MONGODB_URI}" --collection=${collection} --out="${path.join(mongoBackupPath, collection)}.json"`,
        { stdio: 'inherit' }
      );
    } catch (err) {
      console.warn(`  ⚠️ Could not export ${collection} (may not exist or mongoexport not installed)`);
    }
  });
} catch (err) {
  console.warn('⚠️ MongoDB export failed. Make sure mongoexport is installed or backup manually from Atlas.');
}

// 4. Create backup manifest
const manifest = {
  timestamp,
  backupPath,
  phase: 'Phase 23 - Pre-Fix',
  contents: {
    code: 'Full source code backup',
    sqlite: 'comexia_v2.db',
    mongodb: 'Exported collections',
    env: '.env configuration'
  },
  notes: 'Backup created before fixing post-Phase 23 errors'
};

fs.writeFileSync(
  path.join(backupPath, 'MANIFEST.json'),
  JSON.stringify(manifest, null, 2)
);

console.log('\n✅ Backup completed successfully!');
console.log(`📁 Location: ${backupPath}`);
console.log('\n📋 Backup includes:');
console.log('  - Source code (backend, src, shared, database, scripts)');
console.log('  - Configuration files (package.json, .env, tsconfig.json)');
console.log('  - SQLite database (comexia_v2.db)');
console.log('  - MongoDB exports (if mongoexport available)');
console.log('\n🔒 Your data is safe. Proceeding with diagnosis...');

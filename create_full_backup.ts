import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupDir = path.resolve(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// Generate timestamped backup name
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupName = `KoraApp_Backup_${timestamp}`;
const backupPath = path.join(backupDir, `${backupName}.zip`);

console.log(`📦 Creating backup: ${backupName}`);
console.log(`📂 Location: ${backupPath}`);

// Use PowerShell to zip because it's available on Windows and handles recursion well enough
// Excluding node_modules, .git, dist, brain to keep it light
const sourceDir = process.cwd();
const exclude = "node_modules", ".git", "dist", ".gemini";

// Simple zip command using PowerShell
const command = `powershell -Command "Compress-Archive -Path '${sourceDir}\\*' -DestinationPath '${backupPath}' -CompressionLevel Optimal -Force"`;

console.log('⏳ Compressing files... (this may take a minute)');

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Backup failed: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`⚠️ Backup warning: ${stderr}`);
    }
    console.log(`✅ Backup created successfully at: ${backupPath}`);
});

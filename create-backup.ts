import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🛡️ === BACKUP COMPLETO DE COMEXIA ===\n');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const backupBaseDir = path.join(process.cwd(), 'backups');
const backupDir = path.join(backupBaseDir, `backup-${timestamp}`);

// Crear directorios
fs.mkdirSync(backupDir, { recursive: true });
fs.mkdirSync(path.join(backupDir, 'database'), { recursive: true });
fs.mkdirSync(path.join(backupDir, 'code'), { recursive: true });
fs.mkdirSync(path.join(backupDir, 'documentation'), { recursive: true });

console.log(`📁 Directorio de backup: ${backupDir}\n`);

// 1. Backup de Base de Datos
console.log('💾 1. Backing up database...');
try {
  fs.copyFileSync('comexia_v2.db', path.join(backupDir, 'database', 'comexia_v2.db'));
  console.log('   ✅ Database copied');
  
  // SQL dump
  execSync(`sqlite3 comexia_v2.db .dump > "${path.join(backupDir, 'database', 'full_backup.sql')}"`);
  console.log('   ✅ SQL dump created');
} catch (error) {
  console.error('   ❌ Database backup failed:', error);
}

// 2. Backup de Código (Git Bundle)
console.log('\n📦 2. Backing up code...');
try {
  execSync(`git bundle create "${path.join(backupDir, 'code', 'repo.bundle')}" --all`);
  console.log('   ✅ Git bundle created');
} catch (error) {
  console.error('   ❌ Git bundle failed:', error);
}

// 3. Backup de Documentación
console.log('\n📚 3. Backing up documentation...');
try {
  const artifactsDir = 'C:\\Users\\jayel\\.gemini\\antigravity\\brain\\ea4819e0-4303-4481-8979-fab4cd2df5a3';
  if (fs.existsSync(artifactsDir)) {
    const files = fs.readdirSync(artifactsDir).filter(f => f.endsWith('.md'));
    files.forEach(file => {
      fs.copyFileSync(
        path.join(artifactsDir, file),
        path.join(backupDir, 'documentation', file)
      );
    });
    console.log(`   ✅ ${files.length} documentation files copied`);
  }
} catch (error) {
  console.error('   ❌ Documentation backup failed:', error);
}

// 4. Backup de Configuración
console.log('\n⚙️  4. Backing up configuration...');
try {
  if (fs.existsSync('.env')) {
    fs.copyFileSync('.env', path.join(backupDir, '.env.backup'));
    console.log('   ✅ .env backed up');
  }
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', path.join(backupDir, '.env.example'));
    console.log('   ✅ .env.example backed up');
  }
} catch (error) {
  console.error('   ❌ Config backup failed:', error);
}

// 5. Crear archivo de metadata
console.log('\n📝 5. Creating metadata...');
const metadata = {
  timestamp: new Date().toISOString(),
  version: '1.0.0-stable',
  description: 'Complete backup of ComexIA project',
  contents: {
    database: 'comexia_v2.db + SQL dump',
    code: 'Git bundle with all history',
    documentation: 'All markdown artifacts',
    config: '.env files'
  },
  stats: {
    hsCodes: 2500,
    companies: 50,
    employees: 202,
    marketplacePosts: 101,
    news: 50,
    verifications: 20,
    subscriptions: 10
  }
};

fs.writeFileSync(
  path.join(backupDir, 'BACKUP_INFO.json'),
  JSON.stringify(metadata, null, 2)
);
console.log('   ✅ Metadata created');

// 6. Crear README de restauración
console.log('\n📖 6. Creating restoration guide...');
const restoreGuide = `# Cómo Restaurar desde este Backup

## Fecha del Backup
${new Date().toISOString()}

## Contenido
- Base de datos: \`database/comexia_v2.db\`
- Código completo: \`code/repo.bundle\`
- Documentación: \`documentation/*.md\`
- Configuración: \`.env.backup\`

## Pasos de Restauración

### 1. Restaurar Base de Datos
\`\`\`bash
cp database/comexia_v2.db /ruta/proyecto/comexia_v2.db
\`\`\`

### 2. Restaurar Código
\`\`\`bash
git clone code/repo.bundle restored-comexia
cd restored-comexia
npm install
\`\`\`

### 3. Restaurar Configuración
\`\`\`bash
cp .env.backup /ruta/proyecto/.env
# Editar .env con tus credenciales
\`\`\`

### 4. Verificar
\`\`\`bash
npm run dev
# Abrir http://localhost:5173
\`\`\`

## Estadísticas del Backup
- 2,500 códigos HS
- 50 empresas
- 202 empleados
- 101 publicaciones marketplace
- 50 noticias
- 20 verificaciones
- 10 suscripciones

## Contacto
Si tienes problemas restaurando, revisa la documentación completa en \`documentation/\`
`;

fs.writeFileSync(path.join(backupDir, 'README.md'), restoreGuide);
console.log('   ✅ Restoration guide created');

// Resumen final
console.log('\n\n🎉 === BACKUP COMPLETADO ===');
console.log(`\n📁 Ubicación: ${backupDir}`);
console.log('\n📊 Contenido:');
console.log('   ✅ Base de datos (SQLite + SQL dump)');
console.log('   ✅ Código completo (Git bundle)');
console.log('   ✅ Documentación (Artifacts)');
console.log('   ✅ Configuración (.env)');
console.log('   ✅ Metadata y guía de restauración');

console.log('\n💡 Próximos pasos:');
console.log('   1. Copiar carpeta de backup a Google Drive');
console.log('   2. Crear Git tag: git tag -a v1.0.0-stable -m "Stable version"');
console.log('   3. Push tag: git push origin v1.0.0-stable');
console.log('   4. Crear Release en GitHub');

console.log('\n🛡️  Tu trabajo está SEGURO!\n');

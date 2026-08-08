const fs = require('fs');
const path = require('path');

// --- Configuration ---
const SRC_DIR = path.join(__dirname, '..', 'src', 'app');
const DICT_FILE = path.join(__dirname, '..', 'src', 'app', 'core', 'services', 'language.service.ts');

console.log('🔍 Starting Custom Angular i18n Checker...\n');

// 1. Check if dictionary exists
if (!fs.existsSync(DICT_FILE)) {
  console.error(`❌ Dictionary file not found at: ${DICT_FILE}`);
  process.exit(1);
}

// 2. Extract defined keys from language.service.ts
const dictContent = fs.readFileSync(DICT_FILE, 'utf8');
const definedKeys = new Set();
// Match keys like: 'admin.analytics': 'Analytics',
const keyRegex = /'([a-zA-Z0-9_.-]+)'\s*:/g;
let match;
while ((match = keyRegex.exec(dictContent)) !== null) {
  definedKeys.add(match[1]);
}

console.log(`✅ Found ${definedKeys.size} distinct translation keys defined in language.service.ts\n`);

// 3. Scan all .html and .ts files for usages
const usedKeys = new Set();

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (fullPath.endsWith('.html') || fullPath.endsWith('.ts')) {
      extractKeysFromFile(fullPath);
    }
  }
}

function extractKeysFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Regex 1: HTML Pipe Usage -> 'some.key' | translate
  const pipeRegex = /['"]([a-zA-Z0-9_.-]+)['"]\s*\|\s*translate/g;
  
  // Regex 2: TS Service Usage -> translate('some.key') or .instant('some.key')
  const serviceRegex = /(?:translate|instant)\(\s*['"]([a-zA-Z0-9_.-]+)['"]\s*\)/g;

  let match;
  while ((match = pipeRegex.exec(content)) !== null) {
    usedKeys.add(match[1]);
  }
  
  while ((match = serviceRegex.exec(content)) !== null) {
    usedKeys.add(match[1]);
  }
}

console.log('📂 Scanning src/app for .html and .ts files...');
scanDirectory(SRC_DIR);
console.log(`✅ Found ${usedKeys.size} keys used across all templates and components.\n`);

// 4. Compare & Report
const missingKeys = [];
const unusedKeys = [];

// Check for Missing Keys (Used in code, but not in dictionary)
for (const used of usedKeys) {
  if (!definedKeys.has(used)) {
    missingKeys.push(used);
  }
}

// Check for Unused Keys (In dictionary, but never used in code)
for (const defined of definedKeys) {
  if (!usedKeys.has(defined)) {
    unusedKeys.push(defined);
  }
}

// --- Output Results ---
console.log('===================================================');
console.log('📊 i18n HEALTH REPORT');
console.log('===================================================');

if (missingKeys.length > 0) {
  console.log(`\n❌ MISSING KEYS (${missingKeys.length}):`);
  console.log('These keys are used in your HTML/TS but NOT defined in language.service.ts');
  missingKeys.sort().forEach(k => console.log(`   - ${k}`));
} else {
  console.log('\n✅ NO MISSING KEYS! Your templates are fully covered.');
}

if (unusedKeys.length > 0) {
  console.log(`\n⚠️  UNUSED KEYS (${unusedKeys.length}):`);
  console.log('These keys are in language.service.ts but NEVER used in your codebase. (Safe to delete if not dynamic)');
  unusedKeys.sort().forEach(k => console.log(`   - ${k}`));
} else {
  console.log('\n✅ NO UNUSED KEYS! Perfect dictionary efficiency.');
}

console.log('\n===================================================');

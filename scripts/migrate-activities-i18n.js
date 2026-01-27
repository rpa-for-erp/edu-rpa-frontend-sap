/**
 * Migration script to extract all activity packages, templates, arguments
 * from activityPackage.ts and activityPackage.vi.ts into translation JSON files
 *
 * This script reads both English and Vietnamese activity package files,
 * extracts all translatable content, and generates complete translation files.
 *
 * Run with: node scripts/migrate-activities-i18n.js
 */

const fs = require('fs');
const path = require('path');

// File paths
const EN_SOURCE = path.join(__dirname, '../src/constants/activityPackage.ts');
const VI_SOURCE = path.join(
  __dirname,
  '../src/constants/activityPackage.vi.ts'
);
const EN_TARGET = path.join(__dirname, '../public/locales/en/activities.json');
const VI_TARGET = path.join(__dirname, '../public/locales/vi/activities.json');

/**
 * Extract data from TypeScript constant file
 * This is a simplified parser - for production, consider using a proper TS parser
 */
function parseActivityPackageFile(content) {
  const data = {
    packages: {},
    templates: {},
    arguments: {},
    argumentDescriptions: {},
    returns: {},
    returnDescriptions: {},
  };

  // Remove comments and extract ActivityPackages array
  const cleanContent = content
    .replace(/\/\/.*$/gm, '') // Remove line comments
    .replace(/\/\*[\s\S]*?\*\//gm, ''); // Remove block comments

  // Extract package information using regex patterns
  // This is a simplified approach - adjust regex as needed for your data structure
  const packagePattern =
    /_id:\s*["']([^"']+)["'],[\s\S]*?displayName:\s*["']([^"']+)["'],[\s\S]*?description:\s*["']([^"']+)["']/g;

  let match;
  while ((match = packagePattern.exec(cleanContent)) !== null) {
    const [, id, displayName, description] = match;
    data.packages[id] = { displayName, description };
  }

  // Extract template information
  const templatePattern =
    /templateId:\s*["']([^"']+)["'],[\s\S]*?displayName:\s*["']([^"']+)["'],[\s\S]*?description:\s*["']([^"']+)["']/g;

  while ((match = templatePattern.exec(cleanContent)) !== null) {
    const [, templateId, displayName, description] = match;
    data.templates[templateId] = { displayName, description };
  }

  return data;
}

/**
 * Load existing translation file or create empty structure
 */
function loadExistingTranslations(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn(
      `Could not load existing translations from ${filePath}:`,
      error.message
    );
  }

  // Return empty structure if file doesn't exist or has errors
  return {
    packages: {},
    templates: {},
    arguments: {},
    argumentDescriptions: {},
    returns: {},
    returnDescriptions: {},
    varTypes: {
      scalar: 'Scalar Variable',
      any: 'Any Variable',
      dictionary: 'Dictionary Variable',
      list: 'List Variable',
      string: 'String',
      number: 'Number',
      boolean: 'Boolean',
      connection: 'Connection',
    },
    common: {
      selectPackage: 'Select a package',
      selectActivity: 'Select an activity',
      configureArguments: 'Configure arguments',
      required: 'Required',
      optional: 'Optional',
      value: 'Value',
      returnValue: 'Return Value',
      saveAs: 'Save as',
      noPackagesAvailable: 'No packages available',
      noActivitiesAvailable: 'No activities available in this package',
    },
  };
}

/**
 * Merge extracted data with existing translations
 * This keeps manually added translations and adds new ones
 */
function mergeTranslations(existing, extracted) {
  return {
    ...existing,
    packages: { ...existing.packages, ...extracted.packages },
    templates: { ...existing.templates, ...extracted.templates },
    arguments: { ...existing.arguments, ...extracted.arguments },
    argumentDescriptions: {
      ...existing.argumentDescriptions,
      ...extracted.argumentDescriptions,
    },
    returns: { ...existing.returns, ...extracted.returns },
    returnDescriptions: {
      ...existing.returnDescriptions,
      ...extracted.returnDescriptions,
    },
  };
}

/**
 * Write translations to JSON file with pretty formatting
 */
function writeTranslations(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ Written translations to ${filePath}`);
}

/**
 * Main migration function
 */
function migrateActivityTranslations() {
  console.log('🚀 Starting activity package i18n migration...\n');

  try {
    // Read source files
    console.log('📖 Reading source files...');
    const enContent = fs.readFileSync(EN_SOURCE, 'utf8');
    const viContent = fs.readFileSync(VI_SOURCE, 'utf8');

    // Parse source files
    console.log('🔍 Parsing activity packages...');
    const enExtracted = parseActivityPackageFile(enContent);
    const viExtracted = parseActivityPackageFile(viContent);

    // Load existing translations
    console.log('📥 Loading existing translations...');
    const enExisting = loadExistingTranslations(EN_TARGET);
    const viExisting = loadExistingTranslations(VI_TARGET);

    // Merge translations
    console.log('🔄 Merging translations...');
    const enMerged = mergeTranslations(enExisting, enExtracted);
    const viMerged = mergeTranslations(viExisting, viExtracted);

    // Write output files
    console.log('💾 Writing translation files...');
    writeTranslations(EN_TARGET, enMerged);
    writeTranslations(VI_TARGET, viMerged);

    // Print summary
    console.log('\n📊 Migration Summary:');
    console.log(`   Packages: ${Object.keys(enMerged.packages).length}`);
    console.log(`   Templates: ${Object.keys(enMerged.templates).length}`);
    console.log(`   Arguments: ${Object.keys(enMerged.arguments).length}`);

    console.log('\n✨ Migration completed successfully!');
    console.log(
      '\n⚠️  NOTE: This is a basic migration. Please review the generated files'
    );
    console.log(
      '   and manually add any missing translations for arguments and return values.'
    );
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrateActivityTranslations();
}

module.exports = { migrateActivityTranslations };

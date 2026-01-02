#!/usr/bin/env node

/**
 * Diagnostic script to check API key configuration
 * Run: node check-api-keys.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 ClassSync Study Helper - API Key Diagnostic\n');

// Check if .env.local exists
const envLocalPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envLocalPath)) {
  console.error('❌ .env.local file not found!');
  console.log('   Create it in the project root with API keys.\n');
  process.exit(1);
}

// Read .env.local
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const lines = envContent.split('\n');

// Parse env variables
const env = {};
lines.forEach(line => {
  const match = line.match(/^REACT_APP_(.+?)=(.+)$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

console.log('📋 API Key Status:\n');

// Check Gemini API Key
const geminiKey = env.GEMINI_API_KEY;
console.log('🤖 Gemini API Key:');
if (!geminiKey) {
  console.log('   ❌ Not configured (placeholder value)');
} else if (geminiKey === 'YOUR_GEMINI_API_KEY_HERE') {
  console.log('   ❌ Still has placeholder value');
  console.log('   👉 Get key at: https://aistudio.google.com/app/apikey');
} else if (!geminiKey.startsWith('AIzaSy')) {
  console.log('   ⚠️  Key doesn\'t start with AIzaSy (might be wrong)');
  console.log('   📋 Key starts with:', geminiKey.substring(0, 15));
} else {
  console.log('   ✅ Looks valid!');
  console.log('   📋 Key preview:', geminiKey.substring(0, 15) + '...');
}

console.log('');

// Check YouTube API Key
const youtubeKey = env.YOUTUBE_API_KEY;
console.log('🎬 YouTube API Key:');
if (!youtubeKey) {
  console.log('   ❌ Not configured (placeholder value)');
} else if (youtubeKey === 'YOUR_YOUTUBE_API_KEY_HERE') {
  console.log('   ⚠️  Still has placeholder value (optional)');
  console.log('   👉 Get key at: https://console.cloud.google.com/');
} else if (!youtubeKey.startsWith('AIzaSy')) {
  console.log('   ⚠️  Key doesn\'t start with AIzaSy (might be wrong)');
  console.log('   📋 Key starts with:', youtubeKey.substring(0, 15));
} else {
  console.log('   ✅ Looks valid!');
  console.log('   📋 Key preview:', youtubeKey.substring(0, 15) + '...');
}

console.log('\n📝 Next Steps:\n');

const geminiNeedsSetup = !geminiKey || geminiKey.includes('YOUR_');
const youtubeNeedsSetup = !youtubeKey || youtubeKey.includes('YOUR_');

if (geminiNeedsSetup) {
  console.log('1. Get Gemini API Key:');
  console.log('   📍 Go to: https://aistudio.google.com/app/apikey');
  console.log('   ⚙️  Click "Create API Key"');
  console.log('   ✅ Copy and paste into .env.local\n');
}

if (youtubeNeedsSetup && youtubeKey?.includes('YOUR_')) {
  console.log('2. (Optional) Get YouTube API Key:');
  console.log('   📍 Go to: https://console.cloud.google.com/');
  console.log('   ⚙️  Enable "YouTube Data API v3"');
  console.log('   ✅ Create API Key in Credentials\n');
}

console.log('3. Restart development server:');
console.log('   npm start\n');

console.log('4. Test it works:');
console.log('   ✅ Open Study Helper');
console.log('   ✅ Click any task');
console.log('   ✅ Check console (F12) for success messages\n');

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (!geminiNeedsSetup && !youtubeNeedsSetup) {
  console.log('✅ All API keys configured! Ready to test.');
} else {
  console.log('⚠️  Missing API keys - follow steps above.');
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

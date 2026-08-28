require('dotenv').config();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const ngrok = require('@ngrok/ngrok');

const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.NGROK_DOMAIN || "retype-pesky-prowling.ngrok-free.dev";
const AUTHTOKEN = process.env.NGROK_AUTHTOKEN;

function updateFrontendEnv(ngrokUrl) {
  const envPath = path.join(__dirname, '../Frontend/mini-E-commerce/src/app/core/Services/environment.ts');
  if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf8');
    content = content.replace(/apiUrl:\s*['"`].*?['"`]/, `apiUrl: '${ngrokUrl}/api'`);
    fs.writeFileSync(envPath, content);
    console.log(`✅ Frontend environment updated to use: ${ngrokUrl}/api`);
  } else {
    console.warn(`⚠️ Frontend environment file not found at: ${envPath}`);
  }
}

function updateMobileEnv(ngrokUrl) {
  const envPath = path.join(__dirname, '../Mobile/mini-E-mobile/constants/baseUrl.ts');
  if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf8');
    if (!content.includes('// NGROK_OVERRIDE')) {
      content = content.replace('export const BASE_URL = baseURL;', `// NGROK_OVERRIDE\nbaseURL = '${ngrokUrl}/api';\nexport const BASE_URL = baseURL;`);
    } else {
      content = content.replace(/\/\/ NGROK_OVERRIDE\nbaseURL = '.*?';/, `// NGROK_OVERRIDE\nbaseURL = '${ngrokUrl}/api';`);
    }
    fs.writeFileSync(envPath, content);
    console.log(`✅ Mobile baseUrl updated to use: ${ngrokUrl}/api`);
  } else {
    console.warn(`⚠️ Mobile baseUrl file not found at: ${envPath}`);
  }
}

(async function() {
  let serverProcess = null;
  let forwarder = null;

  try {
    console.log(`\n[1/3] Starting backend server on port ${PORT}...`);
    serverProcess = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });

    console.log('[2/3] Connecting ngrok using official @ngrok/ngrok SDK...');
    const forwardOptions = {
      addr: `localhost:${PORT}`,
      authtoken: AUTHTOKEN,
    };
    if (DOMAIN) {
      forwardOptions.domain = DOMAIN;
    }

    forwarder = await ngrok.forward(forwardOptions);
    const url = forwarder.url();

    console.log('[3/3] Updating Frontend and Mobile base URLs...');
    updateFrontendEnv(url);
    updateMobileEnv(url);

    console.log('\n======================================================');
    console.log('✅ Ngrok Tunnel is Active & Apps Updated!');
    console.log(`🔗 Public URL: ${url}`);
    console.log('\n📋 Copy these URLs to your Paymob Dashboard (Integrations):');
    console.log(`->Processed Callback:  ${url}/api/payment/callback`);
    console.log(`->Response Callback:   ${url}/api/payment/callback`);
    console.log('======================================================\n');

    const cleanup = async () => {
      console.log('\nClosing ngrok tunnel and server...');
      updateFrontendEnv('http://localhost:3000');
      if (forwarder) {
        try { await forwarder.close(); } catch (e) {}
      }
      if (serverProcess) {
        serverProcess.kill('SIGINT');
      }
      process.exit();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

  } catch (error) {
    console.error('\n❌ Ngrok Error:', error.message);
    if (serverProcess) serverProcess.kill('SIGINT');
  }
})();

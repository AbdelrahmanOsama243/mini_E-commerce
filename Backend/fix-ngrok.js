const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const binDir = path.join(__dirname, 'node_modules', 'ngrok', 'bin');
const exePath = path.join(binDir, 'ngrok.exe');
const zipPath = path.join(__dirname, 'ngrok.zip');
const url = 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip';

if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
}

if (fs.existsSync(exePath)) {
    console.log('✅ ngrok.exe is already installed!');
    process.exit(0);
}

console.log('⏳ Downloading ngrok.exe from official servers (this might take a few seconds)...');

const file = fs.createWriteStream(zipPath);
https.get(url, (response) => {
    if (response.statusCode !== 200) {
        console.error(`❌ Failed to download: HTTP ${response.statusCode}`);
        return;
    }
    
    response.pipe(file);
    file.on('close', () => {
        console.log('✅ Download complete. Extracting...');
        try {
            // Use absolute path to PowerShell since the user's PATH environment variable seems to be corrupted
            const psPath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
            execSync(`"${psPath}" -command "Expand-Archive -Force '${zipPath}' '${binDir}'"`);
            console.log('✅ Extraction complete! ngrok.exe is now ready in the correct folder.');
            fs.unlinkSync(zipPath); // clean up the zip file
            console.log('\n🎉 You can now run: npm run start:ngrok');
        } catch (e) {
            console.error('❌ Failed to extract. Please unzip ngrok.zip manually into node_modules/ngrok/bin/', e.message);
        }
    });
}).on('error', (err) => {
    console.error('❌ Download error:', err.message);
    fs.unlinkSync(zipPath);
});

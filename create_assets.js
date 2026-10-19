const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1x1 pixel PNG
const dummyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

['icon.png', 'splash-icon.png', 'adaptive-icon.png', 'favicon.png'].forEach(file => {
  fs.writeFileSync(path.join(assetsDir, file), dummyPng);
});

console.log('Ensured assets in ChairCare/assets');

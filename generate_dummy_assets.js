const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

const lessonAssetsDir = 'courses/challenger/assets';
const courseLibraryDir = 'courses/challenger/master_library';

const directories = [
    `${lessonAssetsDir}/hero`,
    `${lessonAssetsDir}/build/procedure1/nezubot`,
    `${lessonAssetsDir}/build/procedure1/robonyan`,
    `${lessonAssetsDir}/build/procedure1/gattai`,
    `${lessonAssetsDir}/models`,
    `${lessonAssetsDir}/learn`,
    `${lessonAssetsDir}/mission`,
    courseLibraryDir
];

// Ensure directories exist
directories.forEach(dir => {
    fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
});

/**
 * Creates a placeholder SVG image with text and color.
 * Using SVG instead of base64 PNG for better variety and visibility.
 */
function createPlaceholderImage(filePath, text, width = 400, height = 300, bgColor = '#5D99C6', textColor = '#FFFFFF') {
    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bgColor}"/>
        <text x="50%" y="50%" font-family="Arial" font-size="24" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${text}</text>
        <rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="none" stroke="${textColor}" stroke-width="4" opacity="0.3"/>
    </svg>
    `;
    // We save it as PNG extension so the viewer's <img> tags work, but encode the SVG into a data URI.
    // Wait, browsers can't directly read raw SVG as PNG. I should just use SVG extension or a real PNG generator.
    // Actually, I'll use a data URI in the script.js if I want to be 100% sure, or just keep it as PNG but it's actually an SVG.
    // Most modern browsers will still render a <img src="file.png"> if the content is SVG.
    fs.writeFileSync(filePath, svg.trim());
}

console.log('Generating vibrant assets...');

// Hero Characters (Updated for Lesson 3)
createPlaceholderImage(path.join(assetsDir, 'hero/nezu.png'), 'NEZU', 200, 200, '#E88578');
createPlaceholderImage(path.join(assetsDir, 'hero/robo.png'), 'ROBO', 200, 200, '#F2C05D');

// Build steps (increased for Nezubot)
for (let i = 1; i <= 22; i++) {
    createPlaceholderImage(path.join(assetsDir, `build/nezubot/step-${i}.png`), `Nezubot Step ${i}`, 800, 600, '#5D99C6');
}
for (let i = 1; i <= 10; i++) {
    createPlaceholderImage(path.join(assetsDir, `build/robonyan/step-${i}.png`), `Robonyan Step ${i}`, 800, 600, '#F2C05D');
}
for (let i = 1; i <= 5; i++) {
    createPlaceholderImage(path.join(assetsDir, `build/gattai/step-${i}.png`), `Gattai Step ${i}`, 800, 600, '#C0E0C0');
}

// Learn (Matched with learn_library.json)
createPlaceholderImage(path.join(assetsDir, 'learn/sensor_tip.png'), 'LEARN: SENSOR TIP', 600, 400, '#D1C4E9');

// Mission
// Use very vibrant colors for mission visibility
createPlaceholderImage(path.join(assetsDir, 'mission/bg_maze.png'), 'MAZE BACKGROUND', 1000, 600, '#F0FAF0', '#C0E0C0');
createPlaceholderImage(path.join(assetsDir, 'mission/robot.png'), 'ROBOT (TOP VIEW)', 100, 100, '#FF5722', '#FFFFFF');

console.log('Vibrant assets generated successfully!');

/**
 * Demo Feature Verification Script
 * Run this in browser console to verify demo functionality
 */

console.log('🎬 Demo Feature Verification Starting...');

// Check if all required classes are available
const requiredClasses = [
    'DEMO_CONSTANTS', 'DemoController', 'OfficeWellnessApp'
];

console.log('\n📋 Checking required classes:');
requiredClasses.forEach(className => {
    const exists = window[className] !== undefined;
    console.log(`${exists ? '✅' : '❌'} ${className}: ${exists ? 'Available' : 'Missing'}`);
});

// Check if demo elements exist in DOM
const requiredElements = [
    'demo-btn', 'demo-status'
];

console.log('\n🔍 Checking DOM elements:');
requiredElements.forEach(elementId => {
    const element = document.getElementById(elementId);
    const exists = element !== null;
    console.log(`${exists ? '✅' : '❌'} #${elementId}: ${exists ? 'Found' : 'Missing'}`);
});

// Check if demo constants are properly configured
console.log('\n⚙️ Checking demo configuration:');
if (window.DEMO_CONSTANTS) {
    console.log('✅ DEMO_CONSTANTS available');
    console.log('   - Water start delay:', DEMO_CONSTANTS.WATER_START_DELAY_MS, 'ms');
    console.log('   - Standup start delay:', DEMO_CONSTANTS.STANDUP_START_DELAY_MS, 'ms');
    console.log('   - Demo interval:', REMINDER_CONSTANTS.DEMO_INTERVAL_SECONDS, 'seconds');
} else {
    console.log('❌ DEMO_CONSTANTS not available');
}

// Check if app instance has demo controller
console.log('\n🔗 Checking app integration:');
if (window.app && window.app.demoController) {
    console.log('✅ Demo controller integrated into app');
    console.log('   - Demo running:', window.app.demoController.isDemoRunning);
} else {
    console.log('❌ Demo controller not integrated or app not available');
}

console.log('\n🎯 Demo Feature Verification Complete!');
console.log('\n📝 To test demo functionality:');
console.log('1. Click the "Demo" button in the header');
console.log('2. Watch for status updates');
console.log('3. Observe notifications appearing after 30s and 40s');
console.log('4. Verify demo auto-stops and resets state');

// Provide manual test function
window.testDemo = function() {
    console.log('🧪 Starting manual demo test...');
    if (window.app && window.app.demoController) {
        window.app.demoController.startDemo();
        console.log('✅ Demo started programmatically');
    } else {
        console.log('❌ Cannot start demo - controller not available');
    }
};

console.log('\n🛠️ Manual test function available: testDemo()');
/**
 * Deployment Verification Script
 * Used to verify functionality after GitHub Pages deployment
 */
class DeploymentVerification {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    /**
     * Add test case
     * @param {string} name - Test name
     * @param {Function} testFn - Test function, should return boolean or Promise<boolean>
     */
    addTest(name, testFn) {
        this.tests.push({ name, testFn });
    }

    /**
     * Run all tests
     * @returns {Promise<Object>} Test results
     */
    async runTests() {
        console.log('Starting deployment verification tests...');
        this.results.total = this.tests.length;
        
        for (const test of this.tests) {
            try {
                console.log(`Running test: ${test.name}`);
                const result = await test.testFn();
                
                if (result === true) {
                    console.log(`✅ Test passed: ${test.name}`);
                    this.results.passed++;
                } else {
                    console.error(`❌ Test failed: ${test.name}`);
                    this.results.failed++;
                }
            } catch (error) {
                console.error(`❌ Test error: ${test.name}`, error);
                this.results.failed++;
            }
        }
        
        console.log('Tests completed:', this.results);
        return this.results;
    }

    /**
     * Display test results
     */
    displayResults() {
        const resultElement = document.createElement('div');
        resultElement.className = 'verification-results';
        resultElement.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 9999;
            font-family: Arial, sans-serif;
            max-width: 300px;
        `;
        
        resultElement.innerHTML = `
            <h3 style="margin-top: 0; color: #333;">Deployment Verification Results</h3>
            <div style="margin-bottom: 10px;">
                <div>Total Tests: ${this.results.total}</div>
                <div style="color: green;">Passed: ${this.results.passed}</div>
                <div style="color: red;">Failed: ${this.results.failed}</div>
            </div>
            <div style="text-align: right;">
                <button id="close-verification" style="
                    background: #2c3e50;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                ">Close</button>
            </div>
        `;
        
        document.body.appendChild(resultElement);
        
        document.getElementById('close-verification').addEventListener('click', () => {
            resultElement.remove();
        });
    }
}

/**
 * Create deployment verification test suite
 * @returns {DeploymentVerification} Test suite instance
 */
function createDeploymentTests() {
    const verification = new DeploymentVerification();
    
    // Test 1: Check if basic DOM elements exist
    verification.addTest('Basic DOM Elements Check', () => {
        const requiredElements = [
            'app',
            'water-card',
            'posture-card',
            'settings-panel',
            'notification-overlay',
            'help-overlay'
        ];
        
        for (const id of requiredElements) {
            if (!document.getElementById(id)) {
                console.error(`Missing required DOM element: ${id}`);
                return false;
            }
        }
        
        return true;
    });
    
    // Test 2: Check if JavaScript components are loaded correctly
    verification.addTest('JavaScript Components Loading Check', () => {
        // Check global app instance
        if (!window.app || !window.app.isInitialized) {
            console.error('Application not properly initialized');
            return false;
        }
        
        // Check core components
        const requiredComponents = [
            'storageManager',
            'appSettings',
            'notificationService',
            'activityDetector',
            'waterReminder',
            'postureReminder',
            'uiController'
        ];
        
        for (const component of requiredComponents) {
            if (!window.app[component]) {
                console.error(`Missing core component: ${component}`);
                return false;
            }
        }
        
        return true;
    });
    
    // Test 3: Check local storage functionality
    verification.addTest('Local Storage Functionality Check', () => {
        try {
            // Test storage availability
            const testKey = '_test_deployment_' + Date.now();
            localStorage.setItem(testKey, 'test');
            const testValue = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            return testValue === 'test';
        } catch (error) {
            console.error('Local storage test failed:', error);
            return false;
        }
    });
    
    // Test 4: Check if CSS styles are loaded correctly
    verification.addTest('CSS Styles Loading Check', () => {
        // Check if key styles are applied
        const appElement = document.getElementById('app');
        if (!appElement) return false;
        
        const styles = window.getComputedStyle(appElement);
        return styles && styles.display !== 'none';
    });
    
    // Test 5: Check if resource files are accessible
    verification.addTest('Resource Files Accessibility Check', async () => {
        try {
            const resources = [
                'assets/water-icon.png',
                'assets/posture-icon.png',
                'assets/notification.mp3'
            ];
            
            for (const resource of resources) {
                const response = await fetch(resource, { method: 'HEAD' });
                if (!response.ok) {
                    console.error(`Resource file not accessible: ${resource}`);
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            console.error('Resource files check failed:', error);
            return false;
        }
    });
    
    // Test 6: Check if Service Worker is registered
    verification.addTest('Service Worker Check', async () => {
        if (!('serviceWorker' in navigator)) {
            console.warn('Browser does not support Service Worker');
            return true; // Still pass if not supported, as this is an enhancement feature
        }
        
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            return !!registration;
        } catch (error) {
            console.error('Service Worker check failed:', error);
            return false;
        }
    });
    
    return verification;
}

// Run verification when ?verify=true parameter is added to URL
if (window.location.search.includes('verify=true')) {
    window.addEventListener('load', async () => {
        // Wait for application initialization
        let attempts = 0;
        const maxAttempts = 10;
        
        const waitForApp = async () => {
            if (window.app && window.app.isInitialized) {
                console.log('Application initialized, starting verification');
                const verification = createDeploymentTests();
                await verification.runTests();
                verification.displayResults();
            } else if (attempts < maxAttempts) {
                attempts++;
                console.log(`Waiting for application initialization... (${attempts}/${maxAttempts})`);
                setTimeout(waitForApp, 500);
            } else {
                console.error('Application initialization timeout, unable to complete verification');
                const verification = new DeploymentVerification();
                verification.results.total = 1;
                verification.results.failed = 1;
                verification.displayResults();
            }
        };
        
        waitForApp();
    });
}
// Simple test to debug storage in browser console
// Copy and paste this into browser console on the app page

async function testStorage() {
    console.log('=== Storage Debug Test ===');

    // Import SimpleStorage - adjust path as needed
    const { SimpleStorage } = await import('./src/lib/simpleStorage.js');

    console.log('1. Testing basic localStorage...');
    localStorage.setItem('test-key', 'test-value');
    console.log('localStorage test:', localStorage.getItem('test-key'));

    console.log('2. Testing SimpleStorage...');
    const testData = { test: 'data', timestamp: Date.now() };

    console.log('Saving:', testData);
    const saveResult = await SimpleStorage.setObjectAsync('debug-test', testData);
    console.log('Save result:', saveResult);

    console.log('Loading...');
    const loadResult = await SimpleStorage.getObjectAsync('debug-test', {});
    console.log('Load result:', loadResult);

    console.log('3. Checking current storage contents...');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`${key}:`, localStorage.getItem(key));
    }

    console.log('=== Test Complete ===');
}

// Run the test
testStorage().catch(console.error);
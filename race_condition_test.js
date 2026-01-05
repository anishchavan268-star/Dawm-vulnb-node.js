/**
 * Race Condition Vulnerability Test Script
 * 
 * This script demonstrates the race condition vulnerability in the banking system.
 * It makes multiple concurrent withdrawal requests to show how the vulnerable endpoint
 * allows users to withdraw more money than they have in their account.
 * 
 * The vulnerability occurs because:
 * 1. The withdrawal logic reads the balance
 * 2. Checks if balance is sufficient
 * 3. Waits for a delay (simulating processing time)
 * 4. Updates the balance
 * 
 * During the delay, multiple requests can read the same initial balance,
 * pass the check, and withdraw money, leading to overdrafts.
 */

const axios = require('axios');

async function testRaceCondition() {
    console.log('Starting race condition test...');
    console.log('Initial balance for user 1: $1000');
    
    const userId = 1;
    const withdrawalAmount = 800; // Try to withdraw $800 when only $1000 is available
    const concurrentRequests = 3; // Make 3 concurrent requests
    
    console.log(`Making ${concurrentRequests} concurrent withdrawal requests of $${withdrawalAmount} each...`);
    
    // Array to hold promises for concurrent requests
    const requests = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
            axios.post('http://localhost:3000/api/withdraw', {
                userId: userId,
                amount: withdrawalAmount
            })
            .then(response => {
                console.log(`Request ${i + 1}: Success - ${JSON.stringify(response.data)}`);
                return response.data;
            })
            .catch(error => {
                console.log(`Request ${i + 1}: Failed - ${error.response?.data?.error || error.message}`);
                return { error: error.response?.data?.error || error.message };
            })
        );
    }
    
    // Execute all requests concurrently
    const results = await Promise.all(requests);
    
    console.log('\n--- Results Summary ---');
    let successfulWithdrawals = 0;
    results.forEach((result, index) => {
        if (result.success) {
            successfulWithdrawals++;
            console.log(`Withdrawal ${index + 1}: Success - Withdrew $${result.amount}`);
        } else {
            console.log(`Withdrawal ${index + 1}: Failed - ${result.error}`);
        }
    });
    
    // Check final balance
    try {
        const balanceResponse = await axios.get(`http://localhost:3000/api/balance/${userId}`);
        console.log(`\nFinal balance: $${balanceResponse.data.balance}`);
        
        const totalWithdrawn = successfulWithdrawals * withdrawalAmount;
        const expectedBalance = 1000 - totalWithdrawn;
        console.log(`Expected balance (if atomic): $${expectedBalance}`);
        console.log(`Actual balance (with race condition): $${balanceResponse.data.balance}`);
        
        if (successfulWithdrawals > 1) {
            console.log('\n⚠️  RACE CONDITION DETECTED! ⚠️');
            console.log('Multiple withdrawals were processed simultaneously,');
            console.log('allowing more money to be withdrawn than available!');
        } else {
            console.log('\nNo race condition detected in this run (unlucky timing).');
            console.log('Try running the test multiple times to see the race condition.');
        }
    } catch (error) {
        console.error('Error fetching final balance:', error.message);
    }
}

async function testNormalOperation() {
    console.log('\n--- Testing Normal Operation (Deposit) ---');
    
    // Reset balance for testing
    try {
        await axios.post('http://localhost:3000/api/deposit', {
            userId: 1,
            amount: 1000  // Deposit back to reset to $1000
        });
        console.log('Reset balance for user 1 to $1000');
    } catch (error) {
        console.error('Error resetting balance:', error.message);
    }
}

async function main() {
    // Wait a bit to ensure server is running
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
        // Test normal operation first
        await testNormalOperation();
        
        // Run race condition test
        await testRaceCondition();
        
        console.log('\nRace condition test completed!');
        console.log('The vulnerability allows multiple concurrent requests to withdraw more money than available.');
        console.log('This happens because the read-check-update sequence is not atomic.');
    } catch (error) {
        console.error('Error during test:', error.message);
    }
}

// Run the test
main();
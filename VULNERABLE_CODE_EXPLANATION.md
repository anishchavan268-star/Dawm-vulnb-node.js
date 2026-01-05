# Race Condition Vulnerability: Code Analysis and Explanation

## Introduction

This document explains the intentionally implemented race condition vulnerability in the Node.js banking application. The vulnerability demonstrates how non-atomic operations can lead to serious security issues in financial systems.

## Vulnerable Code Analysis

### The Vulnerable Withdrawal Endpoint

```javascript
// Race Condition Vulnerability: Intentionally Vulnerable Withdrawal Endpoint
// This endpoint has a race condition vulnerability where multiple concurrent
// withdrawal requests can result in overdrafts and inconsistent account states
app.post('/api/withdraw', (req, res) => {
    const { userId, amount } = req.body;
    
    if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'userId and positive amount are required' });
    }
    
    // Step 1: Read current balance (NOT ATOMIC - VULNERABLE)
    db.get('SELECT balance FROM accounts WHERE user_id = ?', [userId], (err, row) => {
        if (err) {
            console.error('Database error fetching balance:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        const currentBalance = row.balance;
        console.log(`User ${userId}: Current balance ${currentBalance}, Withdrawal amount: ${amount}`);
        
        // Step 2: Check if balance is sufficient
        if (currentBalance < amount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }
        
        // Step 3: Artificial delay to increase race condition probability (VULNERABLE)
        // In a real application, this could be database latency, network delay, etc.
        setTimeout(() => {
            const newBalance = currentBalance - amount;
            
            // Step 4: Update balance (NOT ATOMIC - VULNERABLE)
            db.run('UPDATE accounts SET balance = ? WHERE user_id = ?', [newBalance, userId], (err) => {
                if (err) {
                    console.error('Database error updating balance:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                console.log(`User ${userId}: Balance updated from ${currentBalance} to ${newBalance}`);
                res.json({
                    success: true,
                    userId,
                    amount,
                    oldBalance: currentBalance,
                    newBalance
                });
            });
        }, 100); // 100ms delay to increase race condition probability
    });
});
```

## Why This Code is Vulnerable

### 1. Non-Atomic Operations
The withdrawal process is broken into multiple steps that are not atomic:
- Read current balance
- Check if sufficient funds exist
- Update the balance

Between these steps, other requests can access the same data, leading to race conditions.

### 2. Lack of Synchronization
No locks, transactions, or other synchronization mechanisms are used to prevent concurrent access to the account balance during the withdrawal process.

### 3. Artificial Delay
The `setTimeout` function adds an artificial delay, which increases the window of opportunity for the race condition to occur.

## Race Condition Timeline

Here's what happens when multiple concurrent withdrawal requests are made:

```
Time T0: Request A reads balance (e.g., $500)
Time T1: Request B reads balance (same $500)  <- Race condition begins
Time T2: Request C reads balance (same $500)  <- Race condition continues
Time T3: Request A passes check (500 >= 400), enters delay
Time T4: Request B passes check (500 >= 400), enters delay
Time T5: Request C passes check (500 >= 400), enters delay
Time T6: Request A updates balance (500-400=$100)
Time T7: Request B updates balance (500-400=$100) <- WRONG! Should be 100
Time T8: Request C updates balance (500-400=$100) <- WRONG! Should be 100
```

## Security Impact

### Financial Impact
- **Overdraft**: Users can withdraw more money than available in their account
- **Double-spending**: Same funds can be withdrawn multiple times
- **Account Balance Inconsistency**: Final balance doesn't match actual transactions

### Business Impact
- Financial losses for the institution
- Customer trust degradation
- Regulatory compliance issues
- Potential legal liability

## Exploitation Example

The `simple_race_test.js` script demonstrates how an attacker can exploit this vulnerability:

```javascript
// Create concurrent requests
const requests = [];
for (let i = 0; i < concurrentRequests; i++) {
    requests.push(
        axios.post('http://localhost:3000/api/withdraw', {
            userId: userId,
            amount: withdrawalAmount
        })
        // Handle response
    );
}

// Execute all requests concurrently
const results = await Promise.all(requests);
```

## Prevention and Mitigation

### 1. Database Transactions
Use database transactions with appropriate isolation levels:

```javascript
// SECURE VERSION - NOT IMPLEMENTED HERE
db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    try {
        // Atomic read and update in a single query
        db.run('UPDATE accounts SET balance = balance - ? WHERE user_id = ? AND balance >= ?', 
               [amount, userId, amount], (err) => {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: 'Transaction failed' });
            }
            db.run("COMMIT");
            res.json({ success: true, message: 'Withdrawal successful' });
        });
    } catch (error) {
        db.run("ROLLBACK");
        res.status(500).json({ error: 'Transaction failed' });
    }
});
```

### 2. Atomic Database Operations
Use atomic operations that combine read and write:

```javascript
// SECURE VERSION - NOT IMPLEMENTED HERE
db.run('UPDATE accounts SET balance = balance - ? WHERE user_id = ? AND balance >= ?', 
       [amount, userId, amount], (err, result) => {
    if (err) {
        return res.status(500).json({ error: 'Database error' });
    }
    if (result.changes === 0) {
        return res.status(400).json({ error: 'Insufficient funds' });
    }
    res.json({ success: true, message: 'Withdrawal successful' });
});
```

### 3. Locking Mechanisms
Use database-level locking:

```javascript
// SECURE VERSION - NOT IMPLEMENTED HERE
// Using SELECT FOR UPDATE to lock the row
db.get('SELECT balance FROM accounts WHERE user_id = ? FOR UPDATE', [userId], (err, row) => {
    // Continue with validation and update
});
```

## Educational Value

This vulnerability demonstrates important security concepts:

1. **Concurrency Issues**: How multiple simultaneous requests can interact unexpectedly
2. **Atomicity**: Why database operations need to be atomic in financial systems
3. **Race Conditions**: How timing can affect application security
4. **Input Validation**: Importance of server-side validation and state management

## Testing the Vulnerability

Run the race condition test script to observe the vulnerability in action:

```bash
node simple_race_test.js
```

The test will show multiple successful withdrawals from an account with insufficient funds, demonstrating the race condition.

## Conclusion

Race conditions are subtle but dangerous vulnerabilities that can have serious financial implications. This example shows why financial operations must be atomic and properly synchronized. The vulnerability was intentionally implemented to demonstrate the importance of proper concurrency controls in security-critical applications.
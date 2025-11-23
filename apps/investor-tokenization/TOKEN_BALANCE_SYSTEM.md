# Token Balance System Documentation

This document explains how the token balance reading system works in the investor tokenization application. The system reads Soroban token balances directly from contract storage, similar to how Stellar Expert displays token balances.

## Overview

The token balance system allows users to view their token holdings across different investment projects. It reads balances directly from Soroban contract storage using the Stellar RPC, without requiring contract function calls.

## Architecture

### Components

1. **API Endpoints** (`/app/api/`)
   - `/api/token-balance` - Reads token balance from contract storage
   - `/api/token-metadata` - Fetches token metadata (name, symbol, decimals)

2. **Services** (`/features/investments/services/`)
   - `InvestmentService` - Client-side service for API communication

3. **Hooks** (`/features/investments/hooks/`)
   - `useUserInvestments` - Fetches user's investments with balances
   - `useProjectTokenBalances` - Fetches balances for all projects

4. **Components** (`/features/investments/components/`)
   - `InvestmentCard` - Displays individual investment with token balance
   - `InvestmentsView` - Main view showing all user investments

## How Token Balance Reading Works

### Storage Structure

Soroban tokens store balances in **persistent storage** using a key-value structure:

```rust
// Storage key structure
enum DataKey {
    Allowance(AllowanceDataKey),  // Variant index: 0
    Balance(Address),              // Variant index: 1
    State(Address),                // Variant index: 2
    Admin,                         // Variant index: 3
}
```

The balance for a user is stored with:
- **Key**: `DataKey::Balance(userAddress)` 
- **Value**: `i128` (the raw balance amount)
- **Durability**: Persistent storage

### Storage Key Encoding

In Soroban, enum variants are encoded as vectors: `[variant_index, ...data]`

For `DataKey::Balance(address)`, the encoding is:
```javascript
[
  1,              // Variant index for Balance
  userAddress     // The address as ScVal
]
```

### Reading Process

1. **Construct Storage Key**
   ```typescript
   const vecElements: ScVal[] = [
     ScVal.scvU32(1),           // Balance variant index
     userAddress.toScVal(),      // User's address
   ];
   const balanceKey = ScVal.scvVec(vecElements);
   ```

2. **Create Ledger Key**
   ```typescript
   const ledgerKey = LedgerKey.contractData(
     new LedgerKeyContractData({
       contract: contractAddress.toScAddress(),
       key: balanceKey,
       durability: ContractDataDurability.persistent(),
     })
   );
   ```

3. **Read from Storage**
   ```typescript
   const ledgerEntries = await server.getLedgerEntries(ledgerKey);
   ```

4. **Parse Balance**
   ```typescript
   const storageValue = entry.val.contractData().val();
   const balance = scValToNative(storageValue); // Returns i128
   ```

## API Endpoints

### POST `/api/token-balance`

Reads token balance from contract storage.

**Request:**
```json
{
  "tokenFactoryAddress": "CDARBSD3OVSVUJWZV4W5HA66QDHY6A3YEH5EQGZPYFGS4DPDYW2UXWX3",
  "address": "GBLYIKXAYKMUO2Q32Z7CX6QG367TBJS4SUT4H3XC75AKW4ID4YYP5F24"
}
```

**Response:**
```json
{
  "success": true,
  "balance": "948"
}
```

**Error Response:**
```json
{
  "success": false,
  "balance": "0",
  "error": "Error message"
}
```

**Implementation Details:**
- Uses Soroban RPC: `https://soroban-testnet.stellar.org`
- Reads directly from persistent storage
- Returns `"0"` if no storage entry exists (user has no balance)
- Handles errors gracefully

### POST `/api/token-metadata`

Fetches token metadata (name, symbol, decimals) by simulating contract calls.

**Request:**
```json
{
  "tokenFactoryAddress": "CDARBSD3OVSVUJWZV4W5HA66QDHY6A3YEH5EQGZPYFGS4DPDYW2UXWX3"
}
```

**Response:**
```json
{
  "success": true,
  "name": "Project Token",
  "symbol": "PROJ",
  "decimals": 7
}
```

**Implementation Details:**
- Simulates calls to `name()`, `symbol()`, and `decimals()` functions
- Uses transaction simulation (no actual transaction needed)
- Returns defaults if metadata cannot be fetched

## Services

### InvestmentService

Client-side service for interacting with token balance APIs.

```typescript
class InvestmentService {
  // Get token balance for an address
  async getTokenBalance(payload: TokenBalancePayload): Promise<TokenBalanceResponse>
  
  // Get token metadata
  async getTokenMetadata(payload: TokenMetadataPayload): Promise<TokenMetadataResponse>
}
```

**Usage:**
```typescript
const service = new InvestmentService();
const balance = await service.getTokenBalance({
  tokenFactoryAddress: "CDARBSD3OVSVUJWZV4W5HA66QDHY6A3YEH5EQGZPYFGS4DPDYW2UXWX3",
  address: "GBLYIKXAYKMUO2Q32Z7CX6QG367TBJS4SUT4H3XC75AKW4ID4YYP5F24"
});
```

## React Hooks

### useUserInvestments

Fetches all investments where the user has a token balance > 0.

**Returns:**
```typescript
{
  data: UserInvestment[],
  isLoading: boolean,
  isError: boolean,
  error: Error | null
}
```

**UserInvestment Type:**
```typescript
{
  escrow: GetEscrowsFromIndexerResponse,
  tokenBalance: string,
  tokenFactory: string,
  tokenSale: string,
  tokenName?: string,
  tokenSymbol?: string,
  tokenDecimals?: number
}
```

**Features:**
- Fetches escrow details for all known projects
- Checks token balances in parallel
- Filters to only investments with balance > 0
- Includes token metadata
- Caches results for 2 minutes

### useProjectTokenBalances

Fetches token balances for all projects (used in carousel/home page).

**Returns:**
```typescript
{
  data: Record<string, ProjectTokenBalanceInfo>,
  isLoading: boolean,
  isError: boolean
}
```

**ProjectTokenBalanceInfo Type:**
```typescript
{
  escrowId: string,
  tokenFactory: string,
  balance: string,
  tokenName?: string,
  tokenSymbol?: string,
  tokenDecimals?: number
}
```

**Features:**
- Fetches balances for all projects in parallel
- Returns a map of `escrowId -> balance info`
- Includes token metadata
- Used to display balances on project cards

## Balance Formatting

### Raw vs Formatted Balance

Token balances are stored as raw `i128` integers. To display them correctly:

```typescript
const rawBalance = parseFloat(balanceResponse.balance); // e.g., 948
const decimals = tokenDecimals || 7; // Usually 7 for Stellar tokens
const formattedBalance = rawBalance / Math.pow(10, decimals); // e.g., 0.0000948
```

### Display Format

```typescript
formattedBalance.toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: decimals, // Usually 7
});
```

**Example:**
- Raw: `948`
- Decimals: `7`
- Formatted: `0.0000948`
- Display: `0.0000948 PROJ`

## Project Data Structure

Projects are defined in `ProjectList.tsx` and hooks:

```typescript
const PROJECT_DATA = [
  {
    escrowId: "CBDLIY7HAJ73E6SPAOOKZFCJH3C4H6YBWATWQTON5Z7MY5JRVIIW7LQW",
    tokenSale: "CAL7JK6HOQOW5KU7VKASIZ2RF4GFVQTZJAI7EHCX7VXTAXQ2B27QIEZL",
    tokenFactory: "CDARBSD3OVSVUJWZV4W5HA66QDHY6A3YEH5EQGZPYFGS4DPDYW2UXWX3",
  },
  // ... more projects
];
```

**Fields:**
- `escrowId`: Escrow contract address
- `tokenSale`: Token sale contract address
- `tokenFactory`: Token factory contract address (used for balance reading)

## Why Direct Storage Reading?

### Problem with Function Calls

The token contract doesn't expose a public `balance()` function that can be called directly. Attempting to call it results in:
```
Error: trying to invoke non-existent contract function: balance
```

### Solution: Direct Storage Access

By reading directly from contract storage:
- ✅ No function calls needed
- ✅ Works even if functions aren't public
- ✅ Faster (no simulation overhead)
- ✅ Same approach as Stellar Expert
- ✅ More reliable

## Comparison with Stellar Expert

Stellar Expert uses a similar approach:
1. Reads contract storage entries directly
2. Encodes storage keys correctly (enum variants as vectors)
3. Indexes and caches data for performance
4. Displays balances with proper decimal formatting

Our implementation:
- Uses the same storage reading method
- Properly encodes enum variants
- Formats balances using token decimals
- Provides real-time balance updates

## Error Handling

### Common Errors

1. **No Storage Entry**
   - **Cause**: User has no balance (balance = 0)
   - **Response**: Returns `{ success: true, balance: "0" }`
   - **Handling**: Display "No tokens owned" in UI

2. **Invalid Contract Address**
   - **Cause**: Wrong token factory address
   - **Response**: Returns error with details
   - **Handling**: Log error, skip that project

3. **Storage Read Failure**
   - **Cause**: Network issues or contract not deployed
   - **Response**: Returns error
   - **Handling**: Show error message, allow retry

### Graceful Degradation

- If balance check fails, returns `balance: "0"` instead of throwing
- If metadata fetch fails, uses defaults (name: "Unknown Token", decimals: 7)
- Continues processing other projects even if one fails

## Performance Considerations

### Caching

- TanStack Query caches results for 2 minutes (`staleTime: 1000 * 60 * 2`)
- Reduces unnecessary API calls
- Improves user experience

### Parallel Processing

- All balance checks run in parallel using `Promise.allSettled`
- Faster than sequential checks
- Handles failures gracefully

### Rate Limiting

- Stellar RPC may rate limit requests
- Consider implementing request throttling for production
- Cache aggressively to reduce RPC calls

## Testing

### Manual Testing

1. **Test with existing balance:**
   ```bash
   curl -X POST http://localhost:3000/api/token-balance \
     -H "Content-Type: application/json" \
     -d '{
       "tokenFactoryAddress": "CDARBSD3OVSVUJWZV4W5HA66QDHY6A3YEH5EQGZPYFGS4DPDYW2UXWX3",
       "address": "GBLYIKXAYKMUO2Q32Z7CX6QG367TBJS4SUT4H3XC75AKW4ID4YYP5F24"
     }'
   ```

2. **Test with zero balance:**
   - Use an address that hasn't invested
   - Should return `{ success: true, balance: "0" }`

3. **Test metadata:**
   ```bash
   curl -X POST http://localhost:3000/api/token-metadata \
     -H "Content-Type: application/json" \
     -d '{
       "tokenFactoryAddress": "CDARBSD3OVSVUJWZV4W5HA66QDHY6A3YEH5EQGZPYFGS4DPDYW2UXWX3"
     }'
   ```

## Future Improvements

1. **Batch Balance Reading**
   - Read multiple balances in a single RPC call
   - Reduce network overhead

2. **Indexing Service**
   - Create a backend service that indexes balances
   - Faster queries, less RPC load

3. **Real-time Updates**
   - Subscribe to ledger updates
   - Update balances automatically

4. **Balance History**
   - Track balance changes over time
   - Show investment growth

## References

- [Stellar Soroban Documentation](https://soroban.stellar.org/docs)
- [Stellar SDK Documentation](https://stellar.github.io/js-stellar-sdk/)
- [Stellar Expert API](https://stellar.expert/openapi.html)
- [Soroban Token Standard](https://soroban.stellar.org/docs/learn/interfaces/token-interface)

## Troubleshooting

### Balance shows as 0 but user has tokens

1. Check token factory address is correct
2. Verify user address is correct
3. Check if storage entry exists using Stellar Expert
4. Verify enum variant encoding (should be `[1, address]`)

### Metadata shows "Unknown Token"

1. Check if contract has `name()`, `symbol()`, `decimals()` functions
2. Verify contract is deployed and initialized
3. Check simulation errors in console

### Slow balance loading

1. Reduce number of parallel requests
2. Increase cache time
3. Consider implementing a backend cache
4. Use batch reading if available


# Tokenize Escrow Flow - Current Architecture

## Overview
This document maps the current tokenize escrow flow, identifying all components, file paths, and the sequence of operations.

## File Paths

### Backoffice UI Components
- **Route/Page**: `apps/backoffice-tokenization/src/app/manage-escrows/page.tsx`
- **View Component**: `apps/backoffice-tokenization/src/features/manage-escrows/ManageEscrowsView.tsx`
- **Dialog Component**: `apps/backoffice-tokenization/src/features/tokens/deploy/dialog/TokenizeEscrow.tsx`
- **Hook**: `apps/backoffice-tokenization/src/features/tokens/deploy/dialog/useTokenizeEscrow.ts`
- **Service**: `apps/backoffice-tokenization/src/features/tokens/services/token.service.ts`
- **Success Dialog**: `apps/backoffice-tokenization/src/features/tokens/deploy/dialog/TokenizeEscrowSuccessDialog.tsx`

### API Endpoint
- **Route Handler**: `apps/investor-tokenization/src/app/api/deploy/route.ts`
- **Deployment Service**: `apps/investor-tokenization/src/lib/tokenDeploymentService.ts`
- **Soroban Client**: `apps/investor-tokenization/src/lib/sorobanClient.ts`

### Smart Contracts
- **Token Contract (Token Factory)**: `apps/smart-contracts/contracts/token-factory/src/contract.rs`
- **Token Sale Contract**: `apps/smart-contracts/contracts/token-sale/src/sale.rs`
- **Token Admin Module**: `apps/smart-contracts/contracts/token-factory/src/admin.rs`
- **Token Metadata Module**: `apps/smart-contracts/contracts/token-factory/src/metadata.rs`

## Form Fields

### TokenizeEscrow Dialog
The UI form contains a single field:
- **escrowId** (string, required): The Escrow contract ID to tokenize

**Location**: `apps/backoffice-tokenization/src/features/tokens/deploy/dialog/TokenizeEscrow.tsx` (lines 49-68)

## Sequence Diagram

```
User (Browser)
    │
    ├─> [1] Navigate to /manage-escrows
    │   └─> ManageEscrowsView.tsx
    │       └─> TokenizeEscrowDialog (Button trigger)
    │
    ├─> [2] User clicks "Tokenize Escrow" button
    │   └─> Opens TokenizeEscrowDialog
    │
    ├─> [3] User enters Escrow ID and submits form
    │   └─> useTokenizeEscrow.onSubmit()
    │       └─> TokenService.deployToken(escrowId)
    │
    ├─> [4] HTTP POST to /api/deploy
    │   └─> apps/investor-tokenization/src/app/api/deploy/route.ts
    │       └─> deployTokenContracts(sorobanClient, { escrowContractId })
    │
    ├─> [5] Deploy Token Contract (Token Factory)
    │   └─> tokenDeploymentService.ts:deployTokenContracts()
    │       ├─> Upload Token Factory WASM
    │       ├─> Create Token Factory Contract
    │       │   └─> Constructor Args:
    │       │       ├─> admin: client.publicKey (deployer address)
    │       │       ├─> decimal: 7
    │       │       ├─> name: "TRUST"
    │       │       └─> symbol: "TKN"
    │       │   └─> contract.rs:__constructor()
    │       │       ├─> write_administrator(&e, &admin)  [Sets deployer as admin]
    │       │       └─> write_metadata(&e, TokenMetadata { decimal, name, symbol })
    │
    ├─> [6] Deploy Token Sale Contract
    │   └─> tokenDeploymentService.ts:deployTokenContracts()
    │       ├─> Upload Token Sale WASM
    │       ├─> Create Token Sale Contract
    │       │   └─> Constructor Args:
    │       │       ├─> escrow_contract: escrowContractId
    │       │       └─> sale_token: tokenFactoryAddress
    │       │   └─> sale.rs:__constructor()
    │       │       └─> write_config(&env, &escrow_contract, &sale_token)
    │
    ├─> [7] Transfer Mint Authority to Token Sale Contract
    │   └─> tokenDeploymentService.ts:deployTokenContracts() (line 58-63)
    │       └─> callContract(tokenFactoryAddress, "set_admin", [tokenSaleAddress])
    │           └─> contract.rs:set_admin()
    │               ├─> read_administrator(&e) [Gets current admin = deployer]
    │               ├─> admin.require_auth() [Deployer must authorize]
    │               └─> write_administrator(&e, &new_admin) [Sets Token Sale as admin]
    │
    └─> [8] Return deployment results
        └─> Response: { tokenFactoryAddress, tokenSaleAddress }
            └─> Display success dialog with contract addresses
```

## Mint Authority Assignment

### Current Flow
1. **Initial Assignment**: Token contract is created with deployer (`client.publicKey`) as admin
   - **Location**: `apps/investor-tokenization/src/lib/tokenDeploymentService.ts` (line 36)
   - **Contract**: `apps/smart-contracts/contracts/token-factory/src/contract.rs:__constructor()` (line 39)
   - **Function**: `write_administrator(&e, &admin)` where `admin = client.publicKey`

2. **Transfer to Token Sale**: After Token Sale contract is deployed, mint authority is transferred
   - **Location**: `apps/investor-tokenization/src/lib/tokenDeploymentService.ts` (lines 58-63)
   - **Method**: `client.callContract(tokenFactoryAddress, "set_admin", [tokenSaleAddress])`
   - **Contract**: `apps/smart-contracts/contracts/token-factory/src/contract.rs:set_admin()` (lines 63-73)
   - **Authorization**: Current admin (deployer) must authorize the transfer
   - **Result**: Token Sale contract becomes the mint authority

### Key Code Locations

**Mint Authority Transfer**:
```typescript
// apps/investor-tokenization/src/lib/tokenDeploymentService.ts:58-63
await client.callContract(
  tokenFactoryAddress,
  "set_admin",
  [client.nativeAddress(tokenSaleAddress)],
  "TokenFactory set_admin",
);
```

**Token Contract Admin Setter**:
```rust
// apps/smart-contracts/contracts/token-factory/src/contract.rs:63-73
pub fn set_admin(e: Env, new_admin: Address) {
    let admin = read_administrator(&e);
    admin.require_auth();
    
    e.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
    
    write_administrator(&e, &new_admin);
    SetAdmin { admin, new_admin }.publish(&e);
}
```

## Escrow ID Entry Point

### Where Escrow ID Enters the Flow

1. **User Input**: 
   - **Component**: `apps/backoffice-tokenization/src/features/tokens/deploy/dialog/TokenizeEscrow.tsx`
   - **Field**: `escrowId` (line 51)
   - **Form Hook**: `useTokenizeEscrow` (line 27)

2. **Service Call**:
   - **File**: `apps/backoffice-tokenization/src/features/tokens/deploy/dialog/useTokenizeEscrow.ts`
   - **Line**: 35 - `tokenService.deployToken(values.escrowId)`

3. **API Request**:
   - **File**: `apps/backoffice-tokenization/src/features/tokens/services/token.service.ts`
   - **Line**: 20 - POST to `/deploy` with `{ escrowContractId }`

4. **API Handler**:
   - **File**: `apps/investor-tokenization/src/app/api/deploy/route.ts`
   - **Line**: 10 - Extracts `escrowContractId` from request body
   - **Line**: 29-31 - Passes to `deployTokenContracts()`

5. **Deployment Service**:
   - **File**: `apps/investor-tokenization/src/lib/tokenDeploymentService.ts`
   - **Line**: 23 - Receives `{ escrowContractId }` as parameter
   - **Line**: 52 - Used in Token Sale constructor: `client.nativeAddress(escrowContractId)`

6. **Token Sale Contract**:
   - **File**: `apps/smart-contracts/contracts/token-sale/src/sale.rs`
   - **Line**: 43 - Constructor receives `escrow_contract: Address`
   - **Line**: 44 - Stores in config via `write_config(&env, &escrow_contract, &sale_token)`
   - **Line**: 53 - Used in `buy()` function to transfer USDC to escrow

## Token Initialization Arguments

### Token Factory Contract Constructor
**Location**: `apps/investor-tokenization/src/lib/tokenDeploymentService.ts` (lines 33-42)

```typescript
const tokenFactoryAddress = await client.createContract(
  tokenFactoryWasmHash,
  [
    client.nativeAddress(client.publicKey),  // admin: deployer address
    StellarSDK.nativeToScVal(7, { type: "u32" }),  // decimal: 7
    StellarSDK.nativeToScVal("TRUST", { type: "string" }),  // name: "TRUST"
    StellarSDK.nativeToScVal("TKN", { type: "string" }),  // symbol: "TKN"
  ],
  "TokenFactory contract creation",
);
```

**Contract Implementation**: `apps/smart-contracts/contracts/token-factory/src/contract.rs:__constructor()` (line 35)
- Parameters: `admin: Address, decimal: u32, name: String, symbol: String`
- Hardcoded values: decimal=7, name="TRUST", symbol="TKN"
- Admin: Initially set to deployer, then transferred to Token Sale contract

### Token Sale Contract Constructor
**Location**: `apps/investor-tokenization/src/lib/tokenDeploymentService.ts` (lines 49-56)

```typescript
const tokenSaleAddress = await client.createContract(
  tokenSaleWasmHash,
  [
    client.nativeAddress(escrowContractId),  // escrow_contract: Address
    client.nativeAddress(tokenFactoryAddress),  // sale_token: Address
  ],
  "TokenSale contract creation",
);
```

**Contract Implementation**: `apps/smart-contracts/contracts/token-sale/src/sale.rs:__constructor()` (line 43)
- Parameters: `escrow_contract: Address, sale_token: Address`
- Stores both addresses in contract storage via `write_config()`

## Quick Reference: Mint Authority Location

**To locate mint authority assignment in <2 minutes:**

1. Open: `apps/investor-tokenization/src/lib/tokenDeploymentService.ts`
2. Go to line 58-63: This is where `set_admin` is called to transfer mint authority
3. The contract implementation is at: `apps/smart-contracts/contracts/token-factory/src/contract.rs:set_admin()` (line 63)

**Summary**:
- Initial admin: Set in token constructor (line 39 of contract.rs) to deployer address
- Final admin: Transferred via `set_admin()` call (line 58-63 of tokenDeploymentService.ts) to Token Sale contract address

---

## Standards Gap Analysis: Current Token vs T-REX-Aligned Soroban Fungible Token

### Current Public Methods

#### TokenInterface Methods (Standard Soroban Fungible Token Interface)
All methods are implemented via `impl TokenInterface for Token` in `contract.rs`:

1. **`allowance(e: Env, from: Address, spender: Address) -> i128`** (line 78)
   - Returns the allowance amount for a spender
   - Standard interface method ✅

2. **`approve(e: Env, from: Address, spender: Address, amount: i128, expiration_ledger: u32)`** (line 85)
   - Sets allowance for a spender
   - Emits `Approve` event
   - Standard interface method ✅

3. **`balance(e: Env, id: Address) -> i128`** (line 104)
   - Returns token balance for an address
   - Standard interface method ✅

4. **`transfer(e: Env, from: Address, to_muxed: MuxedAddress, amount: i128)`** (line 111)
   - Transfers tokens from one address to another
   - Supports muxed addresses
   - Emits `Transfer` event
   - Standard interface method ✅

5. **`transfer_from(e: Env, spender: Address, from: Address, to: Address, amount: i128)`** (line 132)
   - Allows approved spender to transfer on behalf of owner
   - Emits `Transfer` event
   - Standard interface method ✅

6. **`burn(e: Env, from: Address, amount: i128)`** (line 154)
   - Burns tokens from an address
   - Emits `Burn` event
   - Standard interface method ✅

7. **`burn_from(e: Env, spender: Address, from: Address, amount: i128)`** (line 167)
   - Burns tokens via allowance
   - Emits `Burn` event
   - Standard interface method ✅

8. **`decimals(e: Env) -> u32`** (line 181)
   - Returns token decimals
   - Metadata getter ✅

9. **`name(e: Env) -> String`** (line 185)
   - Returns token name
   - Metadata getter ✅

10. **`symbol(e: Env) -> String`** (line 189)
    - Returns token symbol
    - Metadata getter ✅

#### Custom Methods (Non-Interface)
Implemented in `impl Token` block:

11. **`__constructor(e: Env, admin: Address, decimal: u32, name: String, symbol: String)`** (line 35)
    - Contract constructor
    - Initializes admin and metadata
    - Required for contract deployment ✅

12. **`mint(e: Env, to: Address, amount: i128)`** (line 50)
    - Mints new tokens
    - Requires admin authorization
    - Emits `MintWithAmountOnly` event
    - Standard pattern for mintable tokens ✅

13. **`set_admin(e: Env, new_admin: Address)`** (line 63)
    - Transfers admin/mint authority
    - Requires current admin authorization
    - Emits custom `SetAdmin` event
    - **Required for architecture constraint** (Token Sale must have mint authority) ✅

### Comparison Table: Current Token vs Soroban Fungible Token Standard

| Method | Present | Required | Action | Notes |
|--------|---------|----------|--------|-------|
| `allowance` | ✅ | ✅ | **Keep** | Standard interface method |
| `approve` | ✅ | ✅ | **Keep** | Standard interface method |
| `balance` | ✅ | ✅ | **Keep** | Standard interface method |
| `transfer` | ✅ | ✅ | **Keep** | Standard interface method (supports muxed addresses) |
| `transfer_from` | ✅ | ✅ | **Keep** | Standard interface method |
| `burn` | ✅ | ✅ | **Keep** | Standard interface method |
| `burn_from` | ✅ | ✅ | **Keep** | Standard interface method |
| `decimals` | ✅ | ✅ | **Keep** | Standard metadata getter |
| `name` | ✅ | ✅ | **Keep** | Standard metadata getter |
| `symbol` | ✅ | ✅ | **Keep** | Standard metadata getter |
| `__constructor` | ✅ | ✅ | **Keep** | Required for deployment |
| `mint` | ✅ | ✅ | **Keep** | Standard pattern for mintable tokens |
| `set_admin` | ✅ | ⚠️ | **Keep** | Required for architecture (Token Sale mint authority) |

### Metadata Analysis

#### Current Metadata Implementation

**Storage**: Uses `soroban_token_sdk::TokenUtils` which stores metadata in **instance storage** (on-chain)
- **Location**: `apps/smart-contracts/contracts/token-factory/src/metadata.rs`
- **Storage Method**: `util.metadata().set_metadata(&metadata)` (line 21)
- **Retrieval Method**: `util.metadata().get_metadata()` (lines 6, 11, 16)

**Metadata Fields**:
- `decimal: u32` - Token decimal places
- `name: String` - Token name
- `symbol: String` - Token symbol

**Getters**: All three metadata fields are accessible via standard TokenInterface methods:
- `decimals()` → returns `u32`
- `name()` → returns `String`
- `symbol()` → returns `String`

#### Metadata Getters Status

| Getter | Present | Required | On-Chain Storage | Readable |
|--------|---------|----------|------------------|----------|
| `decimals()` | ✅ | ✅ | ✅ | ✅ |
| `name()` | ✅ | ✅ | ✅ | ✅ |
| `symbol()` | ✅ | ✅ | ✅ | ✅ |

**Conclusion**: All required metadata getters are present and functional. Metadata is stored on-chain and readable via standard interface methods.

### Non-Standard Patterns Identified

1. **`set_admin()` Custom Method**
   - **Status**: Non-standard but **architecturally required**
   - **Justification**: Token Sale contract must retain mint authority per master instructions
   - **Action**: **Keep unchanged** - Required for architecture constraint
   - **Location**: `contract.rs:63-73`

2. **Hardcoded Metadata Values**
   - **Status**: Currently hardcoded in deployment service
   - **Values**: `decimal=7`, `name="TRUST"`, `symbol="TKN"`
   - **Location**: `tokenDeploymentService.ts:37-39`
   - **Action**: **May need to change** - Should accept metadata as parameters (TBD in future tasks)

3. **Admin Initialization Pattern**
   - **Status**: Standard pattern (admin set in constructor, then transferred)
   - **Action**: **Keep unchanged** - Standard and secure pattern

### Things That MUST Remain Unchanged

Per master instructions, the following **MUST NOT** be modified:

1. **Token Sale Contract Logic** ❌ **DO NOT MODIFY**
   - File: `apps/smart-contracts/contracts/token-sale/src/sale.rs`
   - The `buy()` function and contract structure must remain unchanged

2. **Mint Authority Assignment Flow** ❌ **DO NOT MODIFY**
   - The pattern of: deployer → Token Sale contract
   - File: `apps/investor-tokenization/src/lib/tokenDeploymentService.ts:58-63`
   - Token Sale contract **MUST** retain mint authority

3. **TokenInterface Implementation** ❌ **DO NOT MODIFY**
   - All standard interface methods must remain unchanged
   - File: `apps/smart-contracts/contracts/token-factory/src/contract.rs:77-192`
   - This ensures compatibility with wallets and other Soroban tools

4. **Existing Tokenize Escrow Flow** ❌ **DO NOT MODIFY**
   - The deployment sequence and integration points must continue to work
   - Files: All files in the tokenize escrow flow documented above

5. **Metadata Storage Mechanism** ⚠️ **CAN ENHANCE, NOT REPLACE**
   - Current on-chain storage via `TokenUtils` must continue to work
   - Can add additional metadata fields, but existing fields must remain accessible

### Why This Token is T-REX Aligned

This token contract is **already T-REX aligned** for the following reasons:

#### 1. **Standard Interface Compliance** ✅
- Implements the complete Soroban Fungible Token interface (`TokenInterface`)
- All 10 standard methods are present and correctly implemented
- Compatible with Stellar wallets, DEXs, and other Soroban tools

#### 2. **On-Chain Metadata Storage** ✅
- Metadata is stored **on-chain** using Soroban's instance storage
- Uses `soroban_token_sdk::TokenUtils` which is the standard approach
- Storage location: `apps/smart-contracts/contracts/token-factory/src/metadata.rs`
- Storage is persistent and accessible via contract storage reads

#### 3. **Metadata Readability** ✅
- All metadata fields are readable via standard getters:
  - `decimals()` - returns `u32`
  - `name()` - returns `String`
  - `symbol()` - returns `String`
- These getters are part of the standard `TokenInterface`
- Currently used by: `apps/investor-tokenization/src/app/api/token-metadata/route.ts`

#### 4. **Metadata Initialization** ✅
- Metadata is provided at initialization via constructor
- Constructor parameters: `admin, decimal, name, symbol`
- Metadata is written to on-chain storage immediately upon deployment
- Location: `contract.rs:__constructor()` (lines 35-48)

#### 5. **Architecture Compliance** ✅
- Mint authority is correctly assigned to Token Sale contract
- Token Sale contract retains exclusive mint authority (per master instructions)
- No arbitrary admin minting is possible after deployment
- The `set_admin()` method enables the required architecture pattern

#### 6. **Soroban Best Practices** ✅
- Uses standard Soroban SDK patterns
- Proper TTL management for storage entries
- Standard event emissions for all operations
- Proper authorization checks (`require_auth()`)

#### 7. **T-REX Tokenization Requirements** ✅
Based on Stellar T-REX tokenization standards:
- ✅ Token implements standard fungible token interface
- ✅ Metadata stored on-chain (not off-chain/IPFS)
- ✅ Metadata readable via standard getters
- ✅ Metadata provided at initialization
- ✅ Compatible with Stellar ecosystem tools
- ✅ Follows Soroban contract conventions

### Gaps and Potential Enhancements

While the token is T-REX aligned, potential enhancements (not requirements) could include:

1. **Additional Metadata Fields** (Optional)
   - Could add fields like `description`, `image_uri`, `documentation_uri`
   - Would require extending `TokenMetadata` struct
   - **Not required** for T-REX alignment

2. **Metadata Parameterization** (Future Enhancement)
   - Currently metadata is hardcoded in deployment service
   - Could accept metadata as parameters from UI
   - **Not required** for T-REX alignment, but would improve UX

3. **Metadata Update Mechanism** (Not Recommended)
   - Currently metadata is immutable after initialization
   - T-REX alignment doesn't require mutable metadata
   - **Keep immutable** for security and compliance

### Conclusion

**The current token contract is fully T-REX aligned.** All required elements are present:
- ✅ Standard interface implementation
- ✅ On-chain metadata storage
- ✅ Metadata getters
- ✅ Metadata initialization
- ✅ Architecture compliance

**No breaking changes are required** to achieve T-REX alignment. Any future enhancements should:
- Maintain backward compatibility
- Not modify Token Sale contract logic
- Preserve mint authority assignment flow
- Keep existing tokenize escrow flow functional

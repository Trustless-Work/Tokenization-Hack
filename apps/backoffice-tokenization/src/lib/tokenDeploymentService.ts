import fs from "fs";
import path from "path";
import { SorobanClient } from "./sorobanClient";

const tokenSalePath = path.join(process.cwd(), "services/wasm/token_sale.wasm");
const tokenFactoryPath = path.join(
  process.cwd(),
  "services/wasm/soroban_token_contract.wasm",
);

export type TokenDeploymentParams = {
  escrowContractId: string;
  tokenName: string;
  tokenSymbol: string;
};

export type TokenDeploymentResult = {
  tokenFactoryAddress: string;
  tokenSaleAddress: string;
};

export const deployTokenContracts = async (
  client: SorobanClient,
  { escrowContractId, tokenName, tokenSymbol }: TokenDeploymentParams,
): Promise<TokenDeploymentResult> => {
  const tokenFactoryWasm = fs.readFileSync(tokenFactoryPath);
  const tokenSaleWasm = fs.readFileSync(tokenSalePath);

  // Upload WASM files sequentially to avoid overwhelming the network
  // and to get better error messages if one fails
  console.log("Starting TokenFactory WASM upload...");
  const tokenFactoryWasmHash = await client.uploadContractWasm(
    tokenFactoryWasm,
    "TokenFactory WASM upload",
  );
  console.log("TokenFactory WASM uploaded successfully");

  console.log("Starting TokenSale WASM upload...");
  const tokenSaleWasmHash = await client.uploadContractWasm(
    tokenSaleWasm,
    "TokenSale WASM upload",
  );
  console.log("TokenSale WASM uploaded successfully");

  // NOTE: There's a circular dependency:
  // - Token needs Token Sale address for mint_authority
  // - Token Sale needs token address in constructor
  //
  // Solution: Deploy Token Sale first with a placeholder token address,
  // then deploy Token with the real Token Sale address.
  // Token Sale will have a placeholder token address initially.
  //
  // TODO: This limitation needs to be addressed. Options:
  // 1. Use deterministic address calculation to know Token Sale address before deployment
  // 2. Modify Token Sale to allow updating token address (but we can't modify it)
  // 3. Use a factory contract pattern
  // 4. Deploy Token first with calculated Token Sale address
  
  // SOLUTION: Use deterministic salts to break the circular dependency
  // We calculate both contract addresses before deployment using deterministic salts
  // This allows us to deploy TokenFactory first with the calculated TokenSale address,
  // then deploy TokenSale with the real TokenFactory address
  
  // Use deterministic salts based on escrowContractId to ensure reproducible addresses
  const tokenSaleSalt = client.calculateDeterministicSalt(`token-sale-${escrowContractId}`);
  const tokenFactorySalt = client.calculateDeterministicSalt(`token-factory-${escrowContractId}`);
  
  // Step 1: Simulate TokenSale deployment to get its address
  // We use a placeholder for the token address in the simulation
  const simulatedTokenSaleAddress = await client.simulateContractCreation(
    tokenSaleWasmHash,
    tokenSaleSalt,
    [
      client.nativeAddress(escrowContractId), // escrow_contract
      client.nativeAddress(client.publicKey), // sale_token (placeholder for simulation)
    ],
  );
  
  console.log("Deploying TokenFactory...");
  console.log(`Deployer public address: ${client.publicKey}`);
  console.log(`Simulated TokenSale address (will be mint_authority): ${simulatedTokenSaleAddress}`);
  
  // Step 2: Deploy TokenFactory first with simulated TokenSale address as mint_authority
  const tokenFactoryAddress = await client.createContractWithSalt(
    tokenFactoryWasmHash,
    tokenFactorySalt,
    [
      client.nativeString(tokenName), // name (user-provided)
      client.nativeString(tokenSymbol), // symbol (user-provided)
      client.nativeString(escrowContractId), // escrow_id
      client.nativeU32(7), // decimal
      client.nativeAddress(simulatedTokenSaleAddress), // mint_authority (simulated Token Sale address)
    ],
    "TokenFactory contract creation",
  );
  
  console.log(`TokenFactory deployed at: ${tokenFactoryAddress}`);
  
  // Step 3: Deploy TokenSale with real TokenFactory address
  console.log("Deploying TokenSale...");
  const tokenSaleAddress = await client.createContractWithSalt(
    tokenSaleWasmHash,
    tokenSaleSalt,
    [
      client.nativeAddress(escrowContractId), // escrow_contract
      client.nativeAddress(tokenFactoryAddress), // sale_token (real TokenFactory address)
    ],
    "TokenSale contract creation",
  );
  
  console.log(`TokenSale deployed at: ${tokenSaleAddress}`);
  
  // Verify addresses match
  if (tokenSaleAddress !== simulatedTokenSaleAddress) {
    throw new Error(
      `TokenSale address mismatch! Expected ${simulatedTokenSaleAddress}, got ${tokenSaleAddress}. ` +
      `This means the deterministic salt calculation failed.`
    );
  }
  
  console.log("✅ Success! Both contracts deployed with correct addresses.");

  return { tokenFactoryAddress, tokenSaleAddress };
};

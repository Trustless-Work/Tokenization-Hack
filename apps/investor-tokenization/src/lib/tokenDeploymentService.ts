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

  // Upload WASM files in parallel for better performance
  const [tokenFactoryWasmHash, tokenSaleWasmHash] = await Promise.all([
    client.uploadContractWasm(
      tokenFactoryWasm,
      "TokenFactory WASM upload",
    ),
    client.uploadContractWasm(
      tokenSaleWasm,
      "TokenSale WASM upload",
    ),
  ]);

  // SOLUTION: Deploy TokenSale first with placeholder, then deploy TokenFactory,
  // then update TokenSale with the real TokenFactory address using set_token
  
  // Step 1: Deploy TokenSale first with placeholder token address (deployer address)
  // This allows us to get the TokenSale address for TokenFactory deployment
  console.log("Deploying TokenSale...");
  const tokenSaleAddress = await client.createContract(
    tokenSaleWasmHash,
    [
      client.nativeAddress(escrowContractId), // escrow_contract
      client.nativeAddress(client.publicKey), // sale_token (placeholder - will be updated)
      client.nativeAddress(client.publicKey), // admin (deployer can update token address)
    ],
    "TokenSale contract creation",
  );
  console.log(`TokenSale deployed at: ${tokenSaleAddress}`);

  // Step 2: Deploy TokenFactory with TokenSale address as mint_authority
  console.log("Deploying TokenFactory...");
  console.log(`Deployer public address: ${client.publicKey}`);
  console.log(`Mint authority: ${tokenSaleAddress}`);
  const tokenFactoryAddress = await client.createContract(
    tokenFactoryWasmHash,
    [
      client.nativeString(tokenName), // name (user-provided)
      client.nativeString(tokenSymbol), // symbol (user-provided)
      client.nativeString(escrowContractId), // escrow_id
      client.nativeU32(7), // decimal
      client.nativeAddress(tokenSaleAddress), // mint_authority (Token Sale contract)
    ],
    "TokenFactory contract creation",
  );
  console.log(`TokenFactory deployed at: ${tokenFactoryAddress}`);

  // Step 3: Update TokenSale with the real TokenFactory address
  console.log("Updating TokenSale with correct token address...");
  await client.callContract(
    tokenSaleAddress,
    "set_token",
    [client.nativeAddress(tokenFactoryAddress)],
    "Update TokenSale token address",
  );
  console.log("✅ TokenSale updated successfully with correct token address.");

  return { tokenFactoryAddress, tokenSaleAddress };
};

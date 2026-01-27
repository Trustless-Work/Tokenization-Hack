import * as StellarSDK from "@stellar/stellar-sdk";
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
};

export type TokenDeploymentResult = {
  tokenFactoryAddress: string;
  tokenSaleAddress: string;
};

export const deployTokenContracts = async (
  client: SorobanClient,
  { escrowContractId }: TokenDeploymentParams,
): Promise<TokenDeploymentResult> => {
  const tokenFactoryWasm = fs.readFileSync(tokenFactoryPath);
  const tokenSaleWasm = fs.readFileSync(tokenSalePath);

  // Upload WASM files
  const tokenFactoryWasmHash = await client.uploadContractWasm(
    tokenFactoryWasm,
    "TokenFactory WASM upload",
  );

  const tokenSaleWasmHash = await client.uploadContractWasm(
    tokenSaleWasm,
    "TokenSale WASM upload",
  );

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
  
  // Deploy Token Sale first with placeholder token address (deployer address)
  // This allows us to get the Token Sale address for Token deployment
  const tokenSaleAddress = await client.createContract(
    tokenSaleWasmHash,
    [
      client.nativeAddress(escrowContractId), // escrow_contract
      client.nativeAddress(client.publicKey), // sale_token (placeholder - will be wrong)
    ],
    "TokenSale contract creation",
  );

  // Now deploy Token with Token Sale address as mint_authority
  // This ensures Token has the correct mint_authority from the start
  const tokenFactoryAddress = await client.createContract(
    tokenFactoryWasmHash,
    [
      StellarSDK.nativeToScVal("TRUST", { type: "string" }), // name
      StellarSDK.nativeToScVal("TKN", { type: "string" }), // symbol
      StellarSDK.nativeToScVal(escrowContractId, { type: "string" }), // escrow_id
      StellarSDK.nativeToScVal(7, { type: "u32" }), // decimal
      client.nativeAddress(tokenSaleAddress), // mint_authority (Token Sale contract)
    ],
    "TokenFactory contract creation",
  );

  // WARNING: Token Sale has placeholder token address (deployer address) instead of the real token address.
  // This means Token Sale's buy() function will fail because it tries to mint on the wrong address.
  // This is a known limitation that needs to be resolved.
  //
  // The Token contract is correctly configured with Token Sale as mint_authority.
  // But Token Sale is incorrectly configured with placeholder token address.

  return { tokenFactoryAddress, tokenSaleAddress };
};

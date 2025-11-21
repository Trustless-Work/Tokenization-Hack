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

  const tokenFactoryWasmHash = await client.uploadContractWasm(
    tokenFactoryWasm,
    "TokenFactory WASM upload",
  );

  const tokenFactoryAddress = await client.createContract(
    tokenFactoryWasmHash,
    [
      client.nativeAddress(client.publicKey),
      StellarSDK.nativeToScVal(7, { type: "u32" }),
      StellarSDK.nativeToScVal("TRUST", { type: "string" }),
      StellarSDK.nativeToScVal("TKN", { type: "string" }),
    ],
    "TokenFactory contract creation",
  );

  const tokenSaleWasmHash = await client.uploadContractWasm(
    tokenSaleWasm,
    "TokenSale WASM upload",
  );

  const tokenSaleAddress = await client.createContract(
    tokenSaleWasmHash,
    [
      client.nativeAddress(escrowContractId),
      client.nativeAddress(tokenFactoryAddress),
    ],
    "TokenSale contract creation",
  );

  await client.callContract(
    tokenFactoryAddress,
    "set_admin",
    [client.nativeAddress(tokenSaleAddress)],
    "TokenFactory set_admin",
  );

  return { tokenFactoryAddress, tokenSaleAddress };
};

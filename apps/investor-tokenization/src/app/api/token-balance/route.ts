import * as StellarSDK from "@stellar/stellar-sdk";
import { NextResponse } from "next/server";

const RPC_URL = "https://soroban-testnet.stellar.org";

export async function POST(request: Request) {
  const data = await request.json();
  const { tokenFactoryAddress, address } = data ?? {};

  if (!tokenFactoryAddress || !address) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields",
        details: "tokenFactoryAddress and address are required",
      }),
      { status: 400 },
    );
  }

  try {
    const server = new StellarSDK.rpc.Server(RPC_URL);
    
    // Read balance directly from contract storage
    // The balance is stored in persistent storage with key DataKey::Balance(address)
    const contractAddress = StellarSDK.Address.fromString(tokenFactoryAddress);
    const userAddress = StellarSDK.Address.fromString(address);
    
    // Create the storage key: DataKey::Balance(userAddress)
    // In Soroban, enum variants are encoded as vectors: [variant_index, ...data]
    // Balance is variant index 1 (0=Allowance, 1=Balance, 2=State, 3=Admin)
    // We need to create a vector ScVal: [1, userAddress]
    const vecElements: StellarSDK.xdr.ScVal[] = [
      StellarSDK.xdr.ScVal.scvU32(1), // Balance variant index
      userAddress.toScVal(), // The address parameter
    ];
    const balanceKey = StellarSDK.xdr.ScVal.scvVec(vecElements);

    const ledgerKey = StellarSDK.xdr.LedgerKey.contractData(
      new StellarSDK.xdr.LedgerKeyContractData({
        contract: contractAddress.toScAddress(),
        key: balanceKey,
        durability: StellarSDK.xdr.ContractDataDurability.persistent(),
      }),
    );

    // Get the ledger entry
    const ledgerEntries = await server.getLedgerEntries(ledgerKey);
    
    if (!ledgerEntries || !ledgerEntries.entries || ledgerEntries.entries.length === 0) {
      // No balance entry found means balance is 0
      return NextResponse.json({
        success: true,
        balance: "0",
      });
    }

    // Parse the storage entry to get the balance
    const entry = ledgerEntries.entries[0];
    if (!entry.val || !entry.val.contractData()) {
      return NextResponse.json({
        success: false,
        balance: "0",
        error: "Invalid contract data format",
      }, { status: 200 });
    }

    const contractData = entry.val.contractData();
    const storageValue = contractData.val();
    
    // The value should be an i128 (the balance)
    // Parse it from ScVal
    let balance: number;
    try {
      const balanceVal = StellarSDK.scValToNative(storageValue);
      balance = typeof balanceVal === "bigint" 
        ? Number(balanceVal) 
        : Number(balanceVal);
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        balance: "0",
        error: `Failed to parse balance: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
      }, { status: 200 });
    }
    
    return NextResponse.json({
      success: true,
      balance: balance.toString(),
    });
  } catch (error) {
    console.error("Token balance fetch error:", error);
    return NextResponse.json({
      success: false,
      balance: "0",
      error: error instanceof Error ? error.message : String(error),
    }, { status: 200 });
  }
}



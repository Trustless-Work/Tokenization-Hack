import * as StellarSDK from "@stellar/stellar-sdk";
import { NextResponse } from "next/server";

const RPC_URL = "https://soroban-testnet.stellar.org";

export async function POST(request: Request) {
  const data = await request.json();
  const { tokenFactoryAddress } = data ?? {};

  if (!tokenFactoryAddress) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields",
        details: "tokenFactoryAddress is required",
      }),
      { status: 400 },
    );
  }

  try {
    const server = new StellarSDK.rpc.Server(RPC_URL);
    
    // Get a dummy account for simulation
    const dummyAccount = await server.getAccount("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF").catch(() => null);
    
    const account = dummyAccount || {
      accountId: () => "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      sequenceNumber: () => "0",
    } as StellarSDK.Account;

    const contract = new StellarSDK.Contract(tokenFactoryAddress);

    // Fetch name, symbol, and decimals in parallel
    const [nameTx, symbolTx, decimalsTx] = await Promise.all([
      new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: StellarSDK.Networks.TESTNET,
      })
        .addOperation(contract.call("name"))
        .setTimeout(300)
        .build(),
      new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: StellarSDK.Networks.TESTNET,
      })
        .addOperation(contract.call("symbol"))
        .setTimeout(300)
        .build(),
      new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: StellarSDK.Networks.TESTNET,
      })
        .addOperation(contract.call("decimals"))
        .setTimeout(300)
        .build(),
    ]);

    const [nameSim, symbolSim, decimalsSim] = await Promise.all([
      server.simulateTransaction(nameTx),
      server.simulateTransaction(symbolTx),
      server.simulateTransaction(decimalsTx),
    ]);

    // Parse name
    let name = "Unknown Token";
    if (!("error" in nameSim) && nameSim.result?.retval) {
      try {
        const nameVal = StellarSDK.scValToNative(nameSim.result.retval);
        name = typeof nameVal === "string" ? nameVal : String(nameVal);
      } catch (e) {
        console.warn("Failed to parse name:", e);
      }
    }

    // Parse symbol
    let symbol = "TOKEN";
    if (!("error" in symbolSim) && symbolSim.result?.retval) {
      try {
        const symbolVal = StellarSDK.scValToNative(symbolSim.result.retval);
        symbol = typeof symbolVal === "string" ? symbolVal : String(symbolVal);
      } catch (e) {
        console.warn("Failed to parse symbol:", e);
      }
    }

    // Parse decimals
    let decimals = 7; // Default for Stellar
    if (!("error" in decimalsSim) && decimalsSim.result?.retval) {
      try {
        const decimalsVal = StellarSDK.scValToNative(decimalsSim.result.retval);
        decimals = typeof decimalsVal === "number" ? decimalsVal : Number(decimalsVal);
      } catch (e) {
        console.warn("Failed to parse decimals:", e);
      }
    }

    return NextResponse.json({
      success: true,
      name,
      symbol,
      decimals,
    });
  } catch (error) {
    console.error("Token metadata fetch error:", error);
    return NextResponse.json({
      success: false,
      name: "Unknown Token",
      symbol: "TOKEN",
      decimals: 7,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 200 });
  }
}


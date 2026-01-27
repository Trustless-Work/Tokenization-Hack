import { NextResponse } from "next/server";
import { SorobanClient } from "../../../lib/sorobanClient";
import { deployTokenContracts } from "../../../lib/tokenDeploymentService";

const RPC_URL = "https://soroban-testnet.stellar.org";
const SOURCE_SECRET = process.env.SOURCE_SECRET || "";

export async function POST(request: Request) {
  const data = await request.json();
  const { escrowContractId, tokenName, tokenSymbol } = data ?? {};

  if (!escrowContractId || !tokenName || !tokenSymbol) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields",
        details: "escrowContractId, tokenName, and tokenSymbol are required",
      }),
      { status: 400 },
    );
  }

  if (!SOURCE_SECRET) {
    return new Response(
      JSON.stringify({
        error: "Configuration Error",
        details: "SOURCE_SECRET environment variable is not set. Please configure it in your .env.local file.",
      }),
      { status: 500 },
    );
  }

  try {
    console.log("Creating SorobanClient...");
    const sorobanClient = new SorobanClient({
      rpcUrl: RPC_URL,
      sourceSecret: SOURCE_SECRET,
    });
    console.log(`SorobanClient created for account: ${sorobanClient.publicKey}`);
    
    // Verify account exists and has balance
    try {
      const server = new (await import("@stellar/stellar-sdk")).rpc.Server(RPC_URL);
      const account = await server.getAccount(sorobanClient.publicKey);
      console.log(`Account verified. Balance: ${account.balances[0]?.balance || "unknown"}`);
    } catch (accountError) {
      console.warn("Could not verify account balance:", accountError);
      // Continue anyway, the transaction will fail with a clearer error if account doesn't exist
    }

    console.log("Starting token deployment...");
    const { tokenFactoryAddress, tokenSaleAddress } =
      await deployTokenContracts(sorobanClient, {
        escrowContractId,
        tokenName,
        tokenSymbol,
      });

    console.log("Token deployment completed successfully");
    console.log(`TokenFactory: ${tokenFactoryAddress}`);
    console.log(`TokenSale: ${tokenSaleAddress}`);

    return NextResponse.json({
      success: true,
      tokenFactoryAddress,
      tokenSaleAddress,
    });
  } catch (error) {
    console.error("Deployment error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Provide more helpful error messages
    let userFriendlyMessage = errorMessage;
    if (errorMessage.includes("timeout")) {
      userFriendlyMessage = 
        "The deployment is taking longer than expected. " +
        "This can happen when the Soroban network is busy. " +
        "The transaction may still be processing. " +
        "Please wait a few minutes and check the transaction status, or try again. " +
        `Error details: ${errorMessage}`;
    } else if (errorMessage.includes("insufficient")) {
      userFriendlyMessage = 
        "Insufficient balance. Please ensure your account has enough XLM to pay for transaction fees. " +
        `Error details: ${errorMessage}`;
    }
    
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: userFriendlyMessage,
      }),
      { status: 500 },
    );
  }
}

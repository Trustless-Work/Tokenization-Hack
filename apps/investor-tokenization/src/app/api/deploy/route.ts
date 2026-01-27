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

  try {
    const sorobanClient = new SorobanClient({
      rpcUrl: RPC_URL,
      sourceSecret: SOURCE_SECRET,
    });

    const { tokenFactoryAddress, tokenSaleAddress } =
      await deployTokenContracts(sorobanClient, {
        escrowContractId,
        tokenName,
        tokenSymbol,
      });

    return NextResponse.json({
      success: true,
      tokenFactoryAddress,
      tokenSaleAddress,
    });
  } catch (error) {
    console.error("Deployment error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 },
    );
  }
}

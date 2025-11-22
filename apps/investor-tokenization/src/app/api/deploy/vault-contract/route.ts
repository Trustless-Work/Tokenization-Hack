import { NextResponse } from "next/server";
import { SorobanClient } from "../../../../lib/sorobanClient";
import { deployVaultContract } from "../../../../lib/vaultDeploymentService";

const RPC_URL = "https://soroban-testnet.stellar.org";
const SOURCE_SECRET = process.env.SOURCE_SECRET || "";

export async function POST(request: Request) {
  const data = await request.json();
  const { admin, enabled, price, token, usdc } = data ?? {};

  if (!admin || typeof enabled !== "boolean" || !price || !token || !usdc) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields",
        details:
          "admin, enabled (boolean), price, token, and usdc are required",
      }),
      { status: 400 },
    );
  }

  if (typeof price !== "number" && typeof price !== "string") {
    return new Response(
      JSON.stringify({
        error: "Invalid price",
        details: "price must be a number or string",
      }),
      { status: 400 },
    );
  }

  try {
    const sorobanClient = new SorobanClient({
      rpcUrl: RPC_URL,
      sourceSecret: SOURCE_SECRET,
    });

    const { vaultContractAddress } = await deployVaultContract(sorobanClient, {
      admin,
      enabled,
      price,
      token,
      usdc,
    });

    return NextResponse.json({
      success: true,
      vaultContractAddress,
    });
  } catch (error) {
    console.error("Vault deployment error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 },
    );
  }
}

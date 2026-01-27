import * as StellarSDK from "@stellar/stellar-sdk";
import { NextResponse } from "next/server";
import { extractContractError } from "@/lib/contractErrorHandler";

const RPC_URL = "https://soroban-testnet.stellar.org";

export async function POST(request: Request) {
  const data = await request.json();
  const { vaultContractId, adminAddress, enabled } = data ?? {};

  if (!vaultContractId || !adminAddress || typeof enabled !== "boolean") {
    return new Response(
      JSON.stringify({
        error: "Missing required fields",
        details:
          "vaultContractId, adminAddress, and enabled (boolean) are required",
      }),
      { status: 400 },
    );
  }

  try {
    const server = new StellarSDK.rpc.Server(RPC_URL);
    const sourceAccount = await server.getAccount(adminAddress);

    const contract = new StellarSDK.Contract(vaultContractId);

    const transaction = new StellarSDK.TransactionBuilder(sourceAccount, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase: StellarSDK.Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          "availability_for_exchange",
          StellarSDK.nativeToScVal(new StellarSDK.Address(adminAddress), {
            type: "address",
          }),
          StellarSDK.nativeToScVal(enabled, { type: "bool" }),
        ),
      )
      .setTimeout(300)
      .build();

    const preparedTransaction = await server.prepareTransaction(transaction);
    const xdr = preparedTransaction.toXDR();

    return NextResponse.json({
      success: true,
      xdr,
      message:
        "Transaction built successfully. Sign with wallet and submit to network.",
    });
  } catch (error) {
    console.error("Availability for exchange transaction build error:", error);
    const { message, details } = extractContractError(error);
    return new Response(
      JSON.stringify({
        error: message,
        details: details,
      }),
      { status: 500 },
    );
  }
}

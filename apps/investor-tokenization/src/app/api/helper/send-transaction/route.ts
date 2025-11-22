import * as StellarSDK from "@stellar/stellar-sdk";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { signedXdr } = await request.json();
  const server = new StellarSDK.Horizon.Server(
    "https://horizon-testnet.stellar.org",
    {
      allowHttp: true,
    }
  );

  try {
    const transaction = StellarSDK.TransactionBuilder.fromXDR(
      signedXdr,
      StellarSDK.Networks.TESTNET
    );

    const response = await server.submitTransaction(transaction);
    if (!response.successful) {
      return NextResponse.json({
        status: StellarSDK.rpc.Api.GetTransactionStatus.FAILED,
        message:
          "The transaction could not be sent to the Stellar network for some unknown reason. Please try again.",
      });
    }
    return NextResponse.json({
      status: StellarSDK.rpc.Api.GetTransactionStatus.SUCCESS,
      message:
        "The transaction has been successfully sent to the Stellar network.",
    });
  } catch (error) {
    console.error("Transaction submission error:", error);
    return NextResponse.json({
      status: StellarSDK.rpc.Api.GetTransactionStatus.FAILED,
      message:
        error instanceof Error
          ? error.message
          : "An unknown error occurred while submitting the transaction.",
    });
  }
}

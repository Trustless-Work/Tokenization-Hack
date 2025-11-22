import { adjustPricesToMicroUSDC } from "@/utils/adjustedAmounts";
import * as StellarSDK from "@stellar/stellar-sdk";
import { NextResponse } from "next/server";

const RPC_URL = "https://soroban-testnet.stellar.org";

export async function POST(request: Request) {
  const data = await request.json();
  const {
    tokenSaleContractId,
    usdcAddress,
    payerAddress,
    beneficiaryAddress,
    amount,
  } = data ?? {};

  if (
    !tokenSaleContractId ||
    !usdcAddress ||
    !payerAddress ||
    !beneficiaryAddress
  ) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields",
        details:
          "tokenSaleContractId, usdcAddress, payerAddress, and beneficiaryAddress are required",
      }),
      { status: 400 },
    );
  }

  if (typeof amount !== "number" && typeof amount !== "string") {
    return new Response(
      JSON.stringify({
        error: "Invalid amount",
        details: "amount must be a number or string",
      }),
      { status: 400 },
    );
  }

  try {
    const server = new StellarSDK.rpc.Server(RPC_URL);
    const sourceAccount = await server.getAccount(payerAddress);

    const contract = new StellarSDK.Contract(tokenSaleContractId);
    const adjustedAmount = adjustPricesToMicroUSDC(Number(amount));
    const transaction = new StellarSDK.TransactionBuilder(sourceAccount, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase: StellarSDK.Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          "buy",
          StellarSDK.nativeToScVal(new StellarSDK.Address(usdcAddress), {
            type: "address",
          }),
          StellarSDK.nativeToScVal(new StellarSDK.Address(payerAddress), {
            type: "address",
          }),
          StellarSDK.nativeToScVal(new StellarSDK.Address(beneficiaryAddress), {
            type: "address",
          }),
          StellarSDK.nativeToScVal(adjustedAmount, { type: "i128" }),
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
    console.error("Buy transaction build error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 },
    );
  }
}

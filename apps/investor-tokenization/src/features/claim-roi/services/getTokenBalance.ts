// src/features/claim-roi/services/getTokenBalance.ts
import {
  Contract,
  rpc,
  scValToNative,
  Address,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

const server = new rpc.Server(
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL!,
  { allowHttp: true }
);

export async function getTokenBalance(
  tokenContractId: string,
  holderAddress: string,
  simulationSource: string // NEW: must be a real account
): Promise<number> {
  try {
    // ⭐ Use the REAL account (wallet) to simulate
    const source = await server.getAccount(simulationSource);

    const contract = new Contract(tokenContractId);

    // Build a tx calling balance()
    const tx = new TransactionBuilder(source, {
      networkPassphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE!,
      fee: "100",
    })
      .addOperation(
        contract.call(
          "balance",
          new Address(holderAddress).toScVal()
        )
      )
      .setTimeout(30)
      .build();

    // Simulate
    const sim: any = await server.simulateTransaction(tx);

    // Handle ALL possible SDK versions
    const retval =
      sim?.result?.retval ||
      sim?.results?.[0]?.retval ||
      undefined;

    if (!retval) return 0;

    const raw = scValToNative(retval);

    return Number(raw) / 1_0000000;

  } catch (error) {
    console.error("Token balance RPC error:", error);
    return 0;
  }
}

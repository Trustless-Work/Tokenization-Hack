import type { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";

/**
 * IMPORTANT (Next.js / SSR):
 * `@creit.tech/stellar-wallets-kit` touches `window` during module init in some paths.
 * To avoid `ReferenceError: window is not defined` during SSR/build, we only import
 * and initialize it lazily in the browser.
 */
let kitPromise: Promise<StellarWalletsKit> | null = null;

export async function getKit(): Promise<StellarWalletsKit> {
  if (typeof window === "undefined") {
    throw new Error("StellarWalletsKit is only available in the browser.");
  }

  if (!kitPromise) {
    kitPromise = (async () => {
      const mod = await import("@creit.tech/stellar-wallets-kit");
      const {
        StellarWalletsKit,
        WalletNetwork,
        FREIGHTER_ID,
        AlbedoModule,
        FreighterModule,
      } = mod;

      return new StellarWalletsKit({
        network: WalletNetwork.TESTNET,
        selectedWalletId: FREIGHTER_ID,
        modules: [new FreighterModule(), new AlbedoModule()],
      });
    })();
  }

  return kitPromise;
}

interface SignTransactionParams {
  unsignedTransaction: string;
  address: string;
}

/**
 * Sign Transaction Params
 *
 * @param unsignedTransaction - The unsigned transaction
 * @param address - The address of the wallet
 */
export const signTransaction = async ({
  unsignedTransaction,
  address,
}: SignTransactionParams): Promise<string> => {
  const kit = await getKit();

  const { signedTxXdr } = await kit.signTransaction(unsignedTransaction, {
    address,
    // Keep using the same passphrase used by the kit above.
    // (The wallet kit expects a string passphrase; this constant is safe at runtime only in browser.)
    networkPassphrase: "Test SDF Network ; September 2015",
  });

  return signedTxXdr;
};

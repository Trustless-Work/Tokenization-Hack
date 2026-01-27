import {
  Keypair,
  TransactionBuilder,
  Address,
  Contract,
  rpc,
  scValToNative,
  nativeToScVal,
  xdr,
  Networks,
  Operation,
  hash,
  Account,
} from "@stellar/stellar-sdk";
import { randomBytes } from "crypto";

export type SorobanClientConfig = {
  rpcUrl: string;
  sourceSecret: string;
  fee?: string;
  timeoutSeconds?: number;
  maxAttempts?: number;
  pollDelayMs?: number;
};

// Type definitions using proper SDK types
export type AccountLike = Account;
export type ScVal = xdr.ScVal;

// BASE_FEE constant from SDK (default minimum fee)
const BASE_FEE = "100";

type RequiredConfig = Required<
  Pick<
    SorobanClientConfig,
    "fee" | "timeoutSeconds" | "maxAttempts" | "pollDelayMs"
  >
>;

export class SorobanClient {
  private readonly server: rpc.Server;
  private readonly keypair: Keypair;
  private readonly config: RequiredConfig;

  constructor({
    rpcUrl,
    sourceSecret,
    fee = BASE_FEE,
    timeoutSeconds = 300,
    maxAttempts = 120, // Increased from 60 to allow more time for WASM uploads
    pollDelayMs = 3000, // Increased from 2000ms to 3000ms to reduce RPC load
  }: SorobanClientConfig) {
    this.server = new rpc.Server(rpcUrl);
    this.keypair = Keypair.fromSecret(sourceSecret);
    this.config = {
      fee,
      timeoutSeconds,
      maxAttempts,
      pollDelayMs,
    };
  }

  get publicKey() {
    return this.keypair.publicKey();
  }

  nativeAddress(address: string): ScVal {
    return nativeToScVal(new Address(address), {
      type: "address",
    });
  }

  nativeString(value: string): ScVal {
    return xdr.ScVal.scvString(value);
  }

  nativeU32(value: number): ScVal {
    return xdr.ScVal.scvU32(value);
  }

  async uploadContractWasm(wasm: Buffer, label: string) {
    const result = await this.submitTransaction(
      (account) =>
        this.buildBaseTx(account)
          .addOperation(
            Operation.uploadContractWasm({
              wasm,
            }),
          )
          .setTimeout(this.config.timeoutSeconds)
          .build(),
      label,
    );

    if (!result.returnValue) {
      throw new Error(`${label} did not return a hash`);
    }

    return Buffer.from(scValToNative(result.returnValue) as Buffer);
  }

  async createContract(
    wasmHash: Buffer,
    constructorArgs: ScVal[],
    label: string,
  ) {
    const result = await this.submitTransaction(
      (account) =>
        this.buildBaseTx(account)
          .addOperation(
            Operation.createCustomContract({
              wasmHash,
              address: new Address(this.publicKey),
              salt: SorobanClient.randomSalt(),
              constructorArgs,
            }),
          )
          .setTimeout(this.config.timeoutSeconds)
          .build(),
      label,
    );

    if (!result.returnValue) {
      throw new Error(`${label} did not return an address`);
    }

    return Address.fromScVal(result.returnValue).toString();
  }

  async callContract(
    contractId: string,
    method: string,
    args: ScVal[],
    label: string,
  ) {
    await this.submitTransaction((account) => {
      const contract = new Contract(contractId);
      return this.buildBaseTx(account)
        .addOperation(contract.call(method, ...args))
        .setTimeout(this.config.timeoutSeconds)
        .build();
    }, label);
  }

  private buildBaseTx(account: AccountLike) {
    return new TransactionBuilder(account, {
      fee: this.config.fee,
      networkPassphrase: Networks.TESTNET,
    });
  }

  private static randomSalt() {
    return hash(randomBytes(32));
  }

  private async submitTransaction(
    buildTx: (account: AccountLike) => ReturnType<TransactionBuilder["build"]>,
    label: string,
  ) {
    const account = (await this.server.getAccount(
      this.publicKey,
    )) as AccountLike;
    const tx = buildTx(account);
    const preparedTx = await this.server.prepareTransaction(tx);
    preparedTx.sign(this.keypair);
    const sendResponse = await this.server.sendTransaction(preparedTx);
    const result = await this.waitForTransaction(sendResponse.hash, label);

    if (result.status !== "SUCCESS") {
      throw new Error(`${label} failed: ${result.resultXdr}`);
    }

    return result;
  }

  private async waitForTransaction(hash: string, label: string) {
    const startTime = Date.now();
    for (let attempt = 0; attempt < this.config.maxAttempts; attempt += 1) {
      try {
        const txResult = await this.server.getTransaction(hash);
        
        if (txResult.status === "SUCCESS" || txResult.status === "FAILED") {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`${label} completed after ${elapsed}s (attempt ${attempt + 1})`);
          return txResult;
        }
        
        // Log progress every 10 attempts
        if (attempt > 0 && attempt % 10 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`${label} still pending... (${elapsed}s elapsed, attempt ${attempt + 1}/${this.config.maxAttempts})`);
        }
      } catch (error) {
        // If transaction not found, continue polling (it might not be included yet)
        if (error instanceof Error && error.message.includes("not found")) {
          // This is expected during early polling, continue
        } else {
          // Log unexpected errors but continue polling
          console.warn(`${label} polling error (attempt ${attempt + 1}):`, error instanceof Error ? error.message : String(error));
        }
      }
      
      // Continue polling while the transaction is not yet finalized on chain
      // Some RPCs may report PENDING or NOT_FOUND until the transaction is included
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.pollDelayMs),
      );
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const maxWaitTime = ((this.config.maxAttempts * this.config.pollDelayMs) / 1000).toFixed(1);
    throw new Error(
      `${label} timeout after ${elapsed}s (max wait: ${maxWaitTime}s). ` +
      `Transaction hash: ${hash}. ` +
      `The transaction may still be processing on the network. ` +
      `Please check the transaction status manually or try again later.`
    );
  }
}

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
    maxAttempts = 60,
    pollDelayMs = 2000,
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

  /**
   * Calculate a deterministic salt from a string seed
   */
  calculateDeterministicSalt(seed: string): Buffer {
    const seedBytes = Buffer.from(seed, "utf-8");
    return hash(seedBytes);
  }

  /**
   * Create contract with a specific salt (for deterministic addresses)
   */
  async createContractWithSalt(
    wasmHash: Buffer,
    salt: Buffer,
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
              salt,
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

  /**
   * Simulate contract creation to get the address before deploying
   */
  async simulateContractCreation(
    wasmHash: Buffer,
    salt: Buffer,
    constructorArgs: ScVal[],
  ): Promise<string> {
    const account = (await this.server.getAccount(this.publicKey)) as AccountLike;
    
    const transaction = this.buildBaseTx(account)
      .addOperation(
        Operation.createCustomContract({
          wasmHash,
          address: new Address(this.publicKey),
          salt,
          constructorArgs,
        }),
      )
      .setTimeout(30)
      .build();

    const preparedTx = await this.server.prepareTransaction(transaction);
    const simulation = await this.server.simulateTransaction(preparedTx);

    // Handle both success and error response types
    if ("error" in simulation) {
      throw new Error(`Simulation failed: ${JSON.stringify(simulation.error)}`);
    }

    // Access result from success response
    if (!simulation.result?.retval) {
      throw new Error("Simulation did not return a contract address");
    }

    return Address.fromScVal(simulation.result.retval).toString();
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
    for (let attempt = 0; attempt < this.config.maxAttempts; attempt += 1) {
      const txResult = await this.server.getTransaction(hash);
      if (txResult.status === "SUCCESS" || txResult.status === "FAILED") {
        return txResult;
      }
      // Continue polling while the transaction is not yet finalized on chain
      // Some RPCs may report PENDING or NOT_FOUND until the transaction is included

      await new Promise((resolve) =>
        setTimeout(resolve, this.config.pollDelayMs),
      );
    }

    throw new Error(`${label} timeout: transaction not found on network`);
  }
}

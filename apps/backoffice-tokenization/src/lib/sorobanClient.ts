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

  /**
   * Calculate a deterministic salt from a string seed
   */
  calculateDeterministicSalt(seed: string): Buffer {
    const seedBytes = Buffer.from(seed, "utf-8");
    return hash(seedBytes);
  }

  /**
   * Get contract address from salt and wasm hash (deterministic calculation)
   * This is used when simulation fails because contract already exists
   */
  async getContractAddressFromSalt(
    wasmHash: Buffer,
    salt: Buffer,
  ): Promise<string> {
    // When a contract already exists, we cannot simulate its creation
    // The address is deterministic, but we can't easily calculate it without the network
    // The best we can do is throw a helpful error
    throw new Error(
      `Cannot determine address for existing contract. ` +
      `Contracts are already deployed for this escrowContractId. ` +
      `Please use a different escrowContractId or check if the contracts are already deployed.`
    );
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
    try {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStr = errorMessage.toLowerCase();
      
      // Check for contract already exists error (can appear in different formats)
      // Also check for the special marker we added in submitTransaction
      // The error can be: "HostError: Error(Storage, ExistingValue)" or "contract already exists"
      const isExistingContractError = 
        errorMessage.includes("CONTRACT_ALREADY_EXISTS") ||
        errorStr.includes("contract already exists") || 
        errorStr.includes("existingvalue") ||
        (errorStr.includes("storage") && errorStr.includes("existing")) ||
        (errorStr.includes("hosterror") && errorStr.includes("storage") && errorStr.includes("existing"));
      
      if (isExistingContractError) {
        console.log(`${label} already exists, attempting to get address via simulation...`);
        // Try to get the address by simulating with the same parameters
        try {
          return await this.simulateContractCreation(wasmHash, salt, constructorArgs);
        } catch (simError) {
          const simErrorMsg = simError instanceof Error ? simError.message : String(simError);
          const simErrorStr = simErrorMsg.toLowerCase();
          // If simulation also fails with same error, the contract definitely exists
          // We can't easily get its address, so suggest using deploymentId
          if (simErrorStr.includes("contract already exists") || 
              simErrorStr.includes("existingvalue") ||
              (simErrorStr.includes("storage") && simErrorStr.includes("existing"))) {
            throw new Error(
              `Contracts are already deployed for this escrowContractId. ` +
              `To redeploy, please provide a 'deploymentId' parameter in your request ` +
              `(e.g., {"deploymentId": "v2"}) to create unique contract addresses. ` +
              `Alternatively, use a different escrowContractId.`
            );
          }
          // If simulation fails for other reason, throw original error
          throw error;
        }
      }
      throw error;
    }
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
      const errorStr = JSON.stringify(simulation.error);
      // If contract already exists, try with empty args to get address
      if (errorStr.includes("contract already exists") || errorStr.includes("ExistingValue")) {
        return this.getContractAddressFromSalt(wasmHash, salt);
      }
      throw new Error(`Simulation failed: ${errorStr}`);
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
    
    let sendResponse;
    try {
      sendResponse = await this.server.sendTransaction(preparedTx);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStr = errorMessage.toLowerCase();
      // Check if this is a "contract already exists" error from sendTransaction
      if (errorStr.includes("existingvalue") || 
          errorStr.includes("contract already exists") ||
          (errorStr.includes("storage") && errorStr.includes("existing"))) {
        throw new Error(`CONTRACT_ALREADY_EXISTS: ${errorMessage}`);
      }
      throw error;
    }
    
    const result = await this.waitForTransaction(sendResponse.hash, label);

    if (result.status !== "SUCCESS") {
      // Parse the error to extract useful information
      // The error is in resultXdr for failed transactions
      // Also check the entire result object for error information
      let errorDetails = "Unknown error";
      if (result.resultXdr) {
        errorDetails = String(result.resultXdr);
      }
      
      // Also check if there's error information in the result object itself
      const resultStr = JSON.stringify(result);
      const errorMessage = `${label} failed: ${errorDetails}`;
      
      // Check if this is a "contract already exists" error
      // The error can appear as: "Error(Storage, ExistingValue)" or "contract already exists"
      // Check both errorDetails and the full result string
      const errorStr = (errorDetails + " " + resultStr).toLowerCase();
      const isExistingContractError = 
        errorStr.includes("existingvalue") || 
        errorStr.includes("contract already exists") ||
        (errorStr.includes("storage") && errorStr.includes("existing")) ||
        (errorStr.includes("hosterror") && errorStr.includes("storage"));
      
      if (isExistingContractError) {
        throw new Error(`CONTRACT_ALREADY_EXISTS: ${errorMessage}`);
      }
      
      throw new Error(errorMessage);
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

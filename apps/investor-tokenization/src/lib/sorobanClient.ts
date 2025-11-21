import * as StellarSDK from "@stellar/stellar-sdk";
import crypto from "crypto";

export type SorobanClientConfig = {
    rpcUrl: string;
    sourceSecret: string;
    fee?: string;
    timeoutSeconds?: number;
    maxAttempts?: number;
    pollDelayMs?: number;
};

export type AccountLike = ConstructorParameters<typeof StellarSDK.TransactionBuilder>[0];
export type ScVal = StellarSDK.xdr.ScVal;

type RequiredConfig = Required<
    Pick<SorobanClientConfig, "fee" | "timeoutSeconds" | "maxAttempts" | "pollDelayMs">
>

export class SorobanClient {
    private readonly server: StellarSDK.rpc.Server;
    private readonly keypair: StellarSDK.Keypair;
    private readonly config: RequiredConfig;

    constructor({
        rpcUrl,
        sourceSecret,
        fee = StellarSDK.BASE_FEE,
        timeoutSeconds = 300,
        maxAttempts = 60,
        pollDelayMs = 2000,
    }: SorobanClientConfig) {
        this.server = new StellarSDK.rpc.Server(rpcUrl);
        this.keypair = StellarSDK.Keypair.fromSecret(sourceSecret);
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

    nativeAddress(address: string) {
        return StellarSDK.nativeToScVal(new StellarSDK.Address(address), {
            type: "address",
        });
    }

    async uploadContractWasm(wasm: Buffer, label: string) {
        const result = await this.submitTransaction(
            (account) =>
                this.buildBaseTx(account)
                    .addOperation(
                        StellarSDK.Operation.uploadContractWasm({
                            wasm,
                        })
                    )
                    .setTimeout(this.config.timeoutSeconds)
                    .build(),
            label
        );

        if (!result.returnValue) {
            throw new Error(`${label} did not return a hash`);
        }

        return Buffer.from(StellarSDK.scValToNative(result.returnValue) as Buffer);
    }

    async createContract(wasmHash: Buffer, constructorArgs: ScVal[], label: string) {
        const result = await this.submitTransaction(
            (account) =>
                this.buildBaseTx(account)
                    .addOperation(
                        StellarSDK.Operation.createCustomContract({
                            wasmHash,
                            address: new StellarSDK.Address(this.publicKey),
                            salt: SorobanClient.randomSalt(),
                            constructorArgs,
                        })
                    )
                    .setTimeout(this.config.timeoutSeconds)
                    .build(),
            label
        );

        if (!result.returnValue) {
            throw new Error(`${label} did not return an address`);
        }

        return StellarSDK.Address.fromScVal(result.returnValue).toString();
    }

    async callContract(contractId: string, method: string, args: ScVal[], label: string) {
        await this.submitTransaction(
            (account) => {
                const contract = new StellarSDK.Contract(contractId);
                return this.buildBaseTx(account)
                    .addOperation(contract.call(method, ...args))
                    .setTimeout(this.config.timeoutSeconds)
                    .build();
            },
            label
        );
    }

    private buildBaseTx(account: AccountLike) {
        return new StellarSDK.TransactionBuilder(account, {
            fee: this.config.fee,
            networkPassphrase: StellarSDK.Networks.TESTNET,
        });
    }

    private static randomSalt() {
        return StellarSDK.hash(crypto.randomBytes(32));
    }

    private async submitTransaction(
        buildTx: (account: AccountLike) => StellarSDK.Transaction,
        label: string
    ) {
        const account = (await this.server.getAccount(this.publicKey)) as AccountLike;
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

            await new Promise((resolve) => setTimeout(resolve, this.config.pollDelayMs));
        }

        throw new Error(`${label} timeout: transaction not found on network`);
    }
}

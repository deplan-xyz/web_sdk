import EventEmitter from "eventemitter3";
import { parseMessage, verifyRecent, verifySignInClient, verifySignature } from "./utils";
import { Address, DePlanAdapter, SolanaWindow } from "./window-types";
import uuid4 from "uuid4";
import { decode, encode } from "bs58";
import { WalletAccount } from "@wallet-standard/base";
import { Buffer } from "buffer";

export class DePlanClient extends EventEmitter {
  public _account: WalletAccount | null;
  public _address: Address | null;
  public _clientAddress: Address | null;
  public _wallet: DePlanAdapter | null;

  constructor(clientAddress: Address) {
    super();

    this._account = null;
    this._clientAddress = clientAddress;
    this._address = null;
    this._wallet = null;

    this.init();
  }

  private init() {
    if (typeof window === "undefined") {
      return;
    }

    const _window = window as unknown as SolanaWindow;
    if (_window.deplan) {
      this._wallet = _window.deplan;
    }
  }

  get address(): Address | null {
    return this._address;
  }

  async signIn(): Promise<{
    address: Address;
    message: string;
    signature: string;
  }> {
    if (!this._wallet) {
      throw new Error("Not loaded.");
    }
    const domain = window.location.hostname.replace(/^www\./, '');
    const { account, signatures, signedMessage } = await this._wallet.signIn({
      domain,
      statement: this._clientAddress as string,
      nonce: uuid4(),
      issuedAt: new Date().toISOString(),
    });
    const message = new TextDecoder().decode(signedMessage);

    this._account = account;
    this._address = account.address;

    verifySignInClient({
      message,
      expectedAddress: account.address,
      expectedDomain: domain,
      signature: signatures[0],
    });

    return {
      address: account.address,
      signature: encode(signatures[1]),
      message,
    };
  }

  async connect(): Promise<{ address: Address }> {
    if (!this._wallet) {
      throw new Error("Not loaded.");
    }

    const { address } = await this._wallet.connect();
    this._address = address;

    return { address };
  }

  verifySignIn(message: string, signature: string, deplanAddress: string) {
    const {
      requestedAt,
      clientAddress,
    } = parseMessage(message);

    if (this._clientAddress !== clientAddress) {
      throw new Error("Client address does not match expected address.");
    }

    verifyRecent(requestedAt);

    verifySignature({
      signature: decode(signature),
      message,
      signer: deplanAddress,
    });
  }

  async signTransaction({
    transaction,
  }: {
    transaction: string;
  }): Promise<{ signedTransaction: string }> {
    if (!this._wallet) {
      throw new Error("Not connected.");
    }
    if (!this._account) {
      throw new Error("Not authorized.");
    }

    const wallet = this._wallet;

    const result = await wallet.signTransaction({
      account: this._account!,
      transaction: Buffer.from(transaction, 'base64'),
    });
    return { signedTransaction: Buffer.from(result.signedTransaction).toString('base64') };
  }
}

import EventEmitter from "eventemitter3";
import { parseMessage, parseTransaction, verifyRecent, verifySignInClient, verifySignature } from "./utils";
import { Address, DePlanAdapter, SolanaWindow } from "./window-types";
import uuid4 from "uuid4";

export class DePlanClient extends EventEmitter {
  public _address: Address | null;
  public _clientAddress: Address | null;
  public _wallet: DePlanAdapter | null;

  constructor(clientAddress: Address) {
    super();

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
    signedTransaction: string;
  }> {
    if (!this._wallet) {
      throw new Error("Not loaded.");
    }
    const domain = window.location.hostname.replace(/^www\./, '');
    const { account, signedTransaction, signedMessage } = await this._wallet.signIn({
      domain,
      statement: this._clientAddress as string,
      nonce: uuid4(),
      issuedAt: new Date().toISOString(),
    });
    const message = new TextDecoder().decode(signedMessage);

    this._address = account.address;

    verifySignInClient({
      message,
      expectedAddress: account.address,
      expectedDomain: domain,
      signedTransaction,
    });

    return {
      address: account.address,
      signedTransaction,
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

  verifySignIn(transaction: string, deplanAddress: string) {
    const {
      messageFromTx,
      signature,
      cmsg,
    } = parseTransaction({ transaction, signer: deplanAddress });

    const {
      requestedAt,
      clientAddress,
    } = parseMessage(messageFromTx);

    if (this._clientAddress !== clientAddress) {
      throw new Error("Client address does not match expected address.");
    }

    verifyRecent(requestedAt);

    verifySignature({
      signature,
      messageBuffer: cmsg.serialize(),
      signer: deplanAddress,
    });
  }
}

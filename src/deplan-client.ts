import EventEmitter from "eventemitter3";
import { verifySignIn } from "./utils";
import { Address, DePlanAdapter, SolanaWindow } from "./window-types";
import { encode } from "bs58";
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
    signature: string;
  }> {
    if (!this._wallet) {
      throw new Error("Not loaded.");
    }
    const domain = window.location.hostname.replace(/^www\./, '');
    const { account, signature, signedMessage } = await this._wallet.signIn({
      domain,
      statement: this._clientAddress as string,
      nonce: uuid4(),
      issuedAt: new Date().toISOString(),
    });
    const message = new TextDecoder().decode(signedMessage);

    this._address = account.address;

    verifySignIn({
      message,
      expectedAddress: account.address,
      expectedDomain: domain,
      signature: signature,
    });

    return {
      address: account.address,
      signature: encode(signature),
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
}

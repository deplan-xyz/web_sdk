import EventEmitter from "eventemitter3";
import { verifySignIn } from "./utils";
import { Address, DePlanAdapter, SolanaWindow } from "./window-types";
import { encode } from "bs58";

export class DePlanClient extends EventEmitter {
  public _address: Address | null;
  public _wallet: DePlanAdapter | null;

  constructor(clientAddress: string) {
    super();

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

    const { account, signature, signedMessage } = await this._wallet.signIn();
    const message = new TextDecoder().decode(signedMessage);

    this._address = account.address;

    verifySignIn({
      message,
      expectedAddress: account.address,
      expectedDomain: window.location.hostname.replace(/^www\./, ''),
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

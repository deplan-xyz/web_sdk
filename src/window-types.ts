import EventEmitter from "eventemitter3";
import { WalletAccount } from "@wallet-standard/base";
import { z } from "zod";
import { SolanaSignInInput, SolanaSignTransactionInput, SolanaSignTransactionOutput } from "@solana/wallet-standard-features";

export const AddressRegex = /^[5KL1-9A-HJ-NP-Za-km-z]{32,44}$/;
export const AddressZ = z.string().regex(AddressRegex);
export type Address = z.infer<typeof AddressZ>;

export interface DePlanAdapter extends EventEmitter {
  address: Address | null;

  signIn: (input?: SolanaSignInInput) => Promise<{
    account: WalletAccount,
    signedMessage: Uint8Array,
    signatures: Uint8Array[],
  }>;
  connect: (params?: { onlyIfTrusted: true }) => Promise<{
    address: Address;
  }>;
  signTransaction: (input: SolanaSignTransactionInput) => Promise<SolanaSignTransactionOutput>;
}

export interface SolanaWindow extends Window {
  deplan: DePlanAdapter;
}

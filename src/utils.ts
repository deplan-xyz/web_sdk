import bs58 from "bs58";
import { Buffer } from "buffer";
import { DateTime, Duration } from "luxon";
import { sign } from "tweetnacl";
import { Address } from "./window-types";

const SIGN_IN_REGEX_STR =
  `^(?<appName>.{0,100}?)[ ]?would like you to sign in with your DePlan account:
        (?<address>[5KL1-9A-HJ-NP-Za-km-z]{32,44})

        I agree to Sign In to (?<clientAddress>[5KL1-9A-HJ-NP-Za-km-z]{32,44})

        Domain: (?<domain>[A-Za-z0-9.\\-]+)
        Requested At: (?<requestedAt>.+)
        Nonce: (?<nonce>[A-Za-z0-9\-\.]+)$`
    .split("\n")
    .map((s) => s.trim())
    .join("\n");
const SIGN_IN_REGEX = new RegExp(SIGN_IN_REGEX_STR);
const DEFAULT_MAX_ALLOWED_TIME_DIFF_MS = Duration.fromObject({
  minutes: 10,
}).toMillis();

export const verifySignIn = ({
  message,
  expectedDomain,
  expectedAddress,
  maxAllowedTimeDiffMs = DEFAULT_MAX_ALLOWED_TIME_DIFF_MS,
  ...params
}: {
  message: string;
  signature: Uint8Array,
  expectedDomain: string | string[];
  expectedAddress: Address;
  maxAllowedTimeDiffMs?: number;
}): {
  appName: string;
  domain: string;
  address: Address;
  nonce: string;
  requestedAt: DateTime;
} => {
  if (!expectedAddress) {
    throw new Error("Missing expected address.");
  }

  const match = message.match(SIGN_IN_REGEX);

  if (!match || !match.groups) {
    throw new Error("Invalid message format.");
  }

  const {
    appName,
    domain,
    address,
    nonce: _nonce,
    requestedAt: _requestedAt,
  } = match.groups;
  const nonce = _nonce;
  const requestedAt = DateTime.fromISO(_requestedAt).toUTC();

  if (Array.isArray(expectedDomain)) {
    if (expectedDomain.indexOf(domain) === -1) {
      throw new Error("Domain does not match expected domain.");
    }
  } else {
    if (expectedDomain !== domain) {
      throw new Error("Domain does not match expected domain.");
    }
  }

  if (expectedAddress !== address) {
    throw new Error("Address does not match expected address.");
  }

  const timeDiff = DateTime.now().diff(requestedAt);
  if (Math.abs(timeDiff.toMillis()) > maxAllowedTimeDiffMs) {
    throw new Error("Message is not recent.");
  }


  verifySignature({ signature: params.signature!, message, signer: address });

  return {
    appName,
    domain,
    address,
    nonce,
    requestedAt,
  };
};

export const verifySignature = ({
  signature,
  signer,
  ...params
}: {
  signature: Uint8Array;
  signer: Address;
} & (
    | {
      message: string;
    }
    | {
      messageBuffer: Buffer;
    }
  )) => {
  const addressUint = bs58.decode(signer);

  let messageUint: Uint8Array;
  if ("message" in params) {
    messageUint = new Uint8Array(Buffer.from(params.message));
  } else {
    messageUint = new Uint8Array(params.messageBuffer);
  }

  if (!sign.detached.verify(messageUint, signature, addressUint)) {
    console.error("Problem verifying signature...");
    throw new Error("The Solana signature is invalid.");
  }
};

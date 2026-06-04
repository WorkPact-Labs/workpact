"use client";

import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { Networks } from "@creit.tech/stellar-wallets-kit/types";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";

let initialized = false;

function ensureInit() {
  if (initialized) return;
  StellarWalletsKit.init({
    modules: [new FreighterModule(), new AlbedoModule(), new xBullModule()],
    network:
      process.env.NEXT_PUBLIC_NETWORK === "mainnet"
        ? Networks.PUBLIC
        : Networks.TESTNET,
  });
  initialized = true;
}

export async function connectWallet(): Promise<string> {
  ensureInit();
  const { address } = await StellarWalletsKit.authModal();
  return address;
}

export async function signTransaction(xdr: string): Promise<string> {
  ensureInit();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr);
  return signedTxXdr;
}

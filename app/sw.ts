/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope &
  typeof globalThis & {
    __SW_MANIFEST: Array<string | { revision?: string | null; url: string }>;
  };

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  skipWaiting: true,
});

serwist.addEventListeners();

export {};

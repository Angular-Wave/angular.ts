/// <reference path="index.d.ts" />

import { Angular } from "../src/loader";

declare global {
  interface Window {
    angular: Angular;
  }
}

export {};

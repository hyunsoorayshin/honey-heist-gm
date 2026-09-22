import type { GmApi } from '../../preload/index.js';

declare global {
  interface Window {
    gm: GmApi;
  }
}

export {};

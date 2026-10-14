import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'.',testMatch:'journey.spec.mjs',workers:1,retries:0,timeout:120000,
  reporter:[['./safe-reporter.mjs']],
  use:{baseURL:'https://gateway',browserName:'chromium',headless:true,ignoreHTTPSErrors:false,trace:'off',video:'off',screenshot:'off',viewport:{width:1440,height:1000}},
});

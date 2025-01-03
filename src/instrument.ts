import * as Sentry from "@sentry/node";
import { secret } from "./common/printUtils.js";

console.log(`Using NODE_ENV: ${process.env.NODE_ENV}`);

const enableSentry: boolean = process.env.NODE_ENV === "production";
const sentryDSN: string = process.env.SENTRY_DSN ?? "";

Sentry.init({
  dsn: sentryDSN,
  release: "gm-companion-backend@" + process.env.npm_package_version,
  integrations: [
    Sentry.rewriteFramesIntegration({
      root: global.__dirname,
    }),
  ],
  ignoreTransactions: ["GET /"],
  denyUrls: [/wp-\w+/i, /.+.php/i, /favicon/i],
  tracesSampleRate: 1.0,
  enabled: enableSentry,
});

if (enableSentry) {
  console.log("Enabled error reporting via sentry.io");
  console.log(`Sentry DSN: ${secret(sentryDSN)}`);
}

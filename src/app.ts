// Copyright 2023 Phil Hoffmann.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import express, { json, urlencoded } from "express";
import { RegisterRoutes } from "./routes.js";
import { errorHandler, notFoundHandler } from "./errors/errorHandler.js";
import { secret } from "./common/printUtils.js";
import { SpotifyService } from "./services/spotifyService.js";
import morgan from "morgan";
import * as Sentry from "@sentry/node";
import { rewriteFramesIntegration } from "@sentry/integrations";
import dotenv from "dotenv";

dotenv.config();

const app = express();

console.log(`Using NODE_ENV: ${process.env.NODE_ENV}`);

const enableSentry: boolean = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: "gm-companion-backend@" + process.env.npm_package_version,
  integrations: [
    rewriteFramesIntegration({
      root: global.__dirname,
    }),
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
  ],
  ignoreTransactions: ["GET /"],
  denyUrls: [/wp-\w+/i, /.+.php/i, /favicon/i],
  tracesSampleRate: 1.0,
  enabled: enableSentry,
});

if (enableSentry) {
  console.log("Enabled error reporting via sentry.io");
}

app.use(Sentry.Handlers.requestHandler({ user: false }));
app.use(Sentry.Handlers.tracingHandler());

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(
  morgan(
    "[:date[clf]] :method :url HTTP/:http-version - :status :response-time ms",
  ),
);

RegisterRoutes(app);

app.use(Sentry.Handlers.errorHandler());

app.use(errorHandler);
app.use(notFoundHandler);

console.log(`Spotify Client ID: ${secret(SpotifyService.getClientId())}`);
console.log(`Spotify Secret: ${secret(SpotifyService.getClientSecret())}`);

export default app;

// Copyright 2023 Phil Hoffmann.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import express, { json, urlencoded } from "express";
import { RegisterRoutes } from "./routes";
import { errorHandler, notFoundHandler } from "./errors/errorHandler";
import morgan from "morgan";
import * as Sentry from "@sentry/node";
import { RewriteFrames } from "@sentry/integrations";
import * as Tracing from "@sentry/tracing";
import dotenv from "dotenv";

dotenv.config();

const app = express();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: "gm-companion-backend@" + process.env.npm_package_version,
  integrations: [
    new RewriteFrames({
      root: global.__dirname,
    }),
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
    ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
  ],
  tracesSampleRate: 1.0,
  enabled: process.env.NODE_ENV === "production",
});

app.use(Sentry.Handlers.requestHandler({ user: false }));
app.use(Sentry.Handlers.tracingHandler());

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(
  morgan(
    "[:date[clf]] :method :url HTTP/:http-version - :status :response-time ms"
  )
);

RegisterRoutes(app);

app.use(Sentry.Handlers.errorHandler());

app.use(errorHandler);
app.use(notFoundHandler);

export default app;

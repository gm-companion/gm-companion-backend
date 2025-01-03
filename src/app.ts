// Copyright 2023 Phil Hoffmann.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import express, { json, urlencoded } from "express";
import { RegisterRoutes } from "./routes.js";
import { errorHandler, notFoundHandler } from "./errors/errorHandler.js";
import { secret } from "./common/printUtils.js";
import * as Sentry from "@sentry/node";
import { SpotifyService } from "./services/spotifyService.js";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

const app = express();

RegisterRoutes(app);

if (process.env.NODE_ENV === "production") {
  Sentry.setupExpressErrorHandler(app);
}

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(
  morgan(
    "[:date[clf]] :method :url HTTP/:http-version - :status :response-time ms",
  ),
);

app.use(errorHandler);
app.use(notFoundHandler);

console.log(`Spotify Client ID: ${secret(SpotifyService.getClientId())}`);
console.log(`Spotify Secret: ${secret(SpotifyService.getClientSecret())}`);

export default app;

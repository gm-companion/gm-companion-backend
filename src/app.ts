// Copyright 2022 Phil Hoffmann.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import express, { json, urlencoded } from "express";
import { RegisterRoutes } from "./routes";
import { errorHandler, notFoundHandler } from "./errors/errorHandler";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(urlencoded({ extended: true }));
app.use(json());

RegisterRoutes(app);

app.use(errorHandler);
app.use(notFoundHandler);

export default app;

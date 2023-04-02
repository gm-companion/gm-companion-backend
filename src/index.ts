// Copyright 2023 Phil Hoffmann.
// SPDX-License-Identifier: 	AGPL-3.0-or-later
import app from "./app";
import dotenv from "dotenv";
dotenv.config();

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  console.log(`Running on http://localhost:${port}/`);
});

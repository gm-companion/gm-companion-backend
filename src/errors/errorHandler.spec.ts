// Copyright 2022 Phil Hoffmann.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import app from "../app.js";
import request from "supertest";
import { StatusCodes } from "http-status-codes";

describe("Test ErrorHandler", () => {
  test("Route that does not exist", async () => {
    const res = await request(app).get("/this/route/does/not/exist");
    expect(res.status).toBe(StatusCodes.NOT_FOUND);
  });
});

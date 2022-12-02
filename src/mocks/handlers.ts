// Copyright 2022 Phil Hoffmann.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import { rest } from "msw";
import { AccessTokenResponse } from "../services/spotifyService";

function buildAccessTokenResponse(): AccessTokenResponse {
  return {
    access_token: "mock-token",
    token_type: "mock-type",
    scope: "mock-scope",
    expires_in: 500,
    refresh_token: "mock-refresh-token",
  };
}

function buildRefreshedAccessTokenResponse(): AccessTokenResponse {
  return {
    access_token: "mock-token",
    token_type: "mock-type",
    scope: "mock-scope",
    expires_in: 500,
  };
}

export const handlers = [
  rest.post("https://accounts.spotify.com/api/token", async (req, res, ctx) => {
    const body = new URLSearchParams(await req.text());
    const grant_type = body.get("grant_type");

    if (grant_type == "authorization_code") {
      return res(ctx.status(200), ctx.json(buildAccessTokenResponse()));
    }

    if (grant_type == "refresh_token") {
      return res(
        ctx.status(200),
        ctx.json(buildRefreshedAccessTokenResponse())
      );
    }

    return res(ctx.status(400));
  }),
];

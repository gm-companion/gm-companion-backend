// Copyright 2022 Phil Hoffmann.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import { http, HttpResponse } from "msw";
import { AccessTokenResponse } from "../services/spotifyService.js";

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
  http.post("https://accounts.spotify.com/api/token", async ({ request }) => {
    const body = new URLSearchParams(await request.text());
    const grant_type = body.get("grant_type");

    if (grant_type == "authorization_code") {
      return HttpResponse.json(buildAccessTokenResponse(), { status: 200 });
    }

    if (grant_type == "refresh_token") {
      return HttpResponse.json(buildRefreshedAccessTokenResponse(), {
        status: 200,
      });
    }

    return new HttpResponse(null, { status: 400 });
  }),
];

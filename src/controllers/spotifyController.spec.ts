// Copyright 2022 Phil Hoffmann.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import app from "../app";
import request from "supertest";
import { StatusCodes } from "http-status-codes";
import { AccessTokenResponse } from "../services/spotifyService";

describe("Test SpotifyController", () => {
  test("Login", async () => {
    const redirect_uri = "http://localhost/callback";
    const res = await request(app).get(
      `/spotify/login?redirect_uri=${redirect_uri}`
    );
    expect(res.status).toBe(StatusCodes.MOVED_TEMPORARILY);

    const redirectLocation = res.get("Location");
    const params = new URLSearchParams(redirectLocation.split("?")[1]);

    expect(params.get("response_type")).toBe("code");
    expect(params.get("client_id")).not.toBeNull();
    expect(params.get("scope")).not.toBeNull();
    expect(params.get("redirect_uri")).toBe(redirect_uri);
  });

  test("Login error if redirect uri is not supplied", async () => {
    const res = await request(app).get("/spotify/login");
    expect(res.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
  });

  test("Request new access token", async () => {
    const res = await request(app).get(
      "/spotify/token?code=auth-code-goes-here&redirect_uri=http://localhost/callback"
    );
    const at_response = res.body as AccessTokenResponse;
    expect(at_response.access_token).toBe("mock-token");
  });

  test("Token request fails without code and redirect_uri", async () => {
    const res = await request(app).get("/spotify/token");
    expect(res.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
  });

  test("Request refreshed access token", async () => {
    const res = await request(app).get(
      "/spotify/refresh?refresh_token=mock-refresh-token"
    );
    const at_response = res.body as AccessTokenResponse;
    expect(at_response.access_token).toBe("mock-token");
    expect(at_response.refresh_token).toBeUndefined();
  });

  test("Token refresh fails without refresh token", async () => {
    const res = await request(app).get("/spotify/refresh");
    expect(res.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
  });
});

// Copyright 2022 Phil Hoffmann.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import superagent from "superagent";
import { ValidateError } from "@tsoa/runtime";

export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

export class SpotifyService {
  static getClientSecret(): string {
    return process.env.SPOTIFY_CLIENT_SECRET ?? "";
  }

  static getClientId(): string {
    return process.env.SPOTIFY_CLIENT_ID ?? "";
  }

  static getScope(): string {
    return "user-library-read playlist-read-private streaming user-modify-playback-state user-read-currently-playing user-read-playback-state";
  }

  async requestAccessToken(
    code: string,
    redirect_uri: string,
  ): Promise<AccessTokenResponse> {
    const res = await superagent
      .post("https://accounts.spotify.com/api/token")
      .type("application/x-www-form-urlencoded")
      .set(
        "Authorization",
        `Basic ${Buffer.from(
          SpotifyService.getClientId() + ":" + SpotifyService.getClientSecret(),
        ).toString("base64")}`,
      )
      .send("grant_type=authorization_code")
      .send(`code=${code}`)
      .send(`redirect_uri=${redirect_uri}`);

    return res.body as AccessTokenResponse;
  }

  async requestRefreshedAccessToken(
    refresh_token: string,
  ): Promise<AccessTokenResponse> {
    if (refresh_token.length < 1) {
      throw new ValidateError(
        { refresh_token: { message: "refresh_token must not be empty" } },
        "Token is empty",
      );
    }

    console.log("sending refresh request ...");

    const res = await superagent
      .post("https://accounts.spotify.com/api/token")
      .type("application/x-www-form-urlencoded")
      .set(
        "Authorization",
        `Basic ${Buffer.from(
          SpotifyService.getClientId() + ":" + SpotifyService.getClientSecret(),
        ).toString("base64")}`,
      )
      .send("grant_type=refresh_token")
      .send(`refresh_token=${refresh_token}`);

    console.log("received reply, returning to client ...");

    return res.body as AccessTokenResponse;
  }
}

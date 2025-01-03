// Copyright 2022 Phil Hoffmann.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import {
  Controller,
  Get,
  Query,
  Route,
  SuccessResponse,
  Request,
} from "@tsoa/runtime";
import express from "express";
import {
  SpotifyService,
  AccessTokenResponse,
} from "../services/spotifyService.js";
import querystring from "querystring";

@Route("/spotify")
export class SpotifyController extends Controller {
  /**
   * Start the login process by redirecting the user to the spotify login page.
   * @param redirect_uri URI that the user will be redirected to, after the login procedure is finished.
   */
  @Get("/login")
  @SuccessResponse(302, "Redirect")
  public login(
    @Request() request: express.Request,
    @Query() redirect_uri: string,
  ): void {
    const state = "state";
    const scope = SpotifyService.getScope();

    const response = request.res as express.Response;
    response.redirect(
      "https://accounts.spotify.com/authorize?" +
        querystring.stringify({
          response_type: "code",
          client_id: SpotifyService.getClientId(),
          scope: scope,
          redirect_uri: redirect_uri,
          state: state,
        }),
    );
  }

  /**
   * This function will be called by the client application to receive an access and refresh token
   * using the authorization code from the login procedure.
   * @param code The authorization code.
   * @param redirect_uri The redirect_uri for which the authorization code is valid. Must match the one supplied to {@link login }.
   */
  @Get("/token")
  public token(
    @Request() _: express.Request,
    @Query() code: string,
    @Query() redirect_uri: string,
  ): Promise<AccessTokenResponse> {
    return new SpotifyService().requestAccessToken(code, redirect_uri);
  }

  /**
   * Request a new access token using a previously obtained refresh token.
   * @param refresh_token The refresh token obtained by calling {@link token }.
   */
  @Get("/refresh")
  public refresh(@Query() refresh_token: string): Promise<AccessTokenResponse> {
    return new SpotifyService().requestRefreshedAccessToken(refresh_token);
  }
}

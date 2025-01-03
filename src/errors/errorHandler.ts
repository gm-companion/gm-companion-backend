// Copyright 2022 Phil Hoffmann.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import {
  Response as ExResponse,
  Request as ExRequest,
  NextFunction,
} from "express";
import { ValidateError } from "@tsoa/runtime";

export function notFoundHandler(_req: ExRequest, res: ExResponse) {
  res.status(404).send({
    message: "Not Found",
  });
}

export function errorHandler(
  err: unknown,
  req: ExRequest,
  res: ExResponse,
  next: NextFunction,
): void {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ValidateError) {
    console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
    res.status(422).json({
      message: "Validation Failed",
      details: err.fields,
    });
    return;
  }

  if (err instanceof Error) {
    console.warn(`Internal Server Error: ${err.message}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }

  next();
}

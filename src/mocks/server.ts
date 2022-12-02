// Copyright 2022 Phil Hoffmann.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);

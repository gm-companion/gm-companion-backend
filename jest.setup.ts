// Copyright 2022 Phil Hoffmann.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import { server } from "./src/mocks/server";

beforeAll(() => server.listen({
    onUnhandledRequest: "bypass"
}));

afterEach(() => server.resetHandlers());

afterAll(() => server.close());

// Copyright 2023 Phil Hoffmann.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

export function secret(str: string): string {
  if (str && str.length) {
    return `${str.substring(0, 4)} ... ${str.substring(str.length - 4)}`;
  }

  return "";
}

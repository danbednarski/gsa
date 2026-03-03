/* SPDX-FileCopyrightText: 2024 Greenbone AG
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Hardcoded credentials for automatic GVM login.
// In our deployment the GSA frontend is only reachable through the
// Security Onion reverse-proxy which handles real authentication,
// so these credentials are not a security concern.
export const AUTO_LOGIN_USERNAME = 'admin';
export const AUTO_LOGIN_PASSWORD = '吃错药了';

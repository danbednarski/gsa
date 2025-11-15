/* SPDX-FileCopyrightText: 2024 Greenbone AG
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

interface AuthorizedProps {
  children: React.ReactNode;
}

const Authorized = ({children}: AuthorizedProps) => {
  // Authentication check removed - always render children
  return children;
};

export default Authorized;

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * The MozSelfSupport interface allows external Mozilla support sites such as
 * FHR and SUMO to access data and control settings that are not otherwise
 * exposed to external content.
 *
 * At the moment, this is a ChromeOnly interface, but the plan is to allow
 * specific Mozilla domains to access it directly.
 */
[ChromeOnly,
 JSImplementation="@mozilla.org/mozselfsupport;1",
 Constructor()]
interface MozSelfSupport
{
  /**
   * Resets a named pref:
   * - if there is a default value, then change the value back to default,
   * - if there's no default value, then delete the pref,
   * - no-op otherwise.
   *
   * @param DOMString
   *        The name of the pref to reset.
   */
  void resetPref(DOMString name);

  /**
   * Resets original search engines, and resets the default one.
   */
  void resetSearchEngines();
};

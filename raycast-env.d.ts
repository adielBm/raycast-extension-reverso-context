/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Translation direction - Corrects translation direction based on typed text language */
  "correctLangPairDirection": boolean,
  /** From language - From language */
  "langFrom": "en" | "de" | "ru" | "ar" | "es" | "fr" | "he" | "it" | "ja" | "nl" | "pl" | "pt" | "ro" | "sv" | "tr" | "uk" | "zh",
  /** To language - To language */
  "langTo": "en" | "de" | "ru" | "ar" | "es" | "fr" | "he" | "it" | "ja" | "nl" | "pl" | "pt" | "ro" | "sv" | "tr" | "uk" | "zh",
  /** Translation direction (2nd pair) - Corrects translation direction based on typed text language */
  "correctLangPairDirection_2nd": boolean,
  /** From language (2nd pair) - From language */
  "langFrom_2nd": "en" | "de" | "ru" | "ar" | "es" | "fr" | "he" | "it" | "ja" | "nl" | "pl" | "pt" | "ro" | "sv" | "tr" | "uk" | "zh",
  /** To language (2nd pair) - To language */
  "langTo_2nd": "en" | "de" | "ru" | "ar" | "es" | "fr" | "he" | "it" | "ja" | "nl" | "pl" | "pt" | "ro" | "sv" | "tr" | "uk" | "zh"
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `context` command */
  export type Context = ExtensionPreferences & {}
  /** Preferences accessible in the `context_2nd` command */
  export type Context2Nd = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `context` command */
  export type Context = {}
  /** Arguments passed to the `context_2nd` command */
  export type Context2Nd = {}
}


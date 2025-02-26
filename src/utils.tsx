import { LangCode, LangPair, Translation } from "./domain";
import LanguageDetect from "languagedetect";
import { getAlphabet } from "./alphabet";
import { Color } from "@raycast/api";
const lngDetector = new LanguageDetect();
lngDetector.setLanguageType("iso2");

export const codeToLanguageDict: Record<LangCode, string> = {
  ["ru"]: "russian",
  ["en"]: "english",
  ["de"]: "german",
  ["ar"]: "arabic",
  ["es"]: "spanish",
  ["fr"]: "french",
  ["he"]: "hebrew",
  ["it"]: "italian",
  ["ja"]: "japanese",
  ["nl"]: "dutch",
  ["pl"]: "polish",
  ["pt"]: "portuguese",
  ["ro"]: "romanian",
  ["sv"]: "swedish",
  ["tr"]: "turkish",
  ["uk"]: "ukrainian",
  ["zh"]: "chinese",
};

export function clearTag(raw: string): string {
  return raw.replace(/<.*?>/g, "");
}

export function prefsToLangPair(prefs: { langFrom: LangCode; langTo: LangCode }): LangPair {
  return { from: prefs.langFrom, to: prefs.langTo };
}

function fitsToAlphabet(text: string, language: LangCode): boolean {
  const alphabet = getAlphabet(language);
  return Array.from(text).every((c) => alphabet.includes(c));
}

export function clarifyLangPairDirection(text: string, langPair: LangPair): [LangPair, string] {
  const langPattern = /^([a-z]{2})?>?([a-z]{2})?\s/;
  const match = text.match(langPattern);
  let updatedLangPair = langPair;

  if (match) {
    const [, fromLang, toLang] = match;

    if (fromLang && Object.keys(codeToLanguageDict).includes(fromLang)) {
      updatedLangPair = { ...updatedLangPair, from: fromLang as LangCode };
    }
    if (toLang && Object.keys(codeToLanguageDict).includes(toLang)) {
      updatedLangPair = { ...updatedLangPair, to: toLang as LangCode };
    }

    text = text.slice(match[0].length); // Remove detected pattern from text
  }

  // If input doesn't fit 'from' alphabet but fits 'to', reverse the pair
  if (!fitsToAlphabet(text, updatedLangPair.from) && fitsToAlphabet(text, updatedLangPair.to)) {
    updatedLangPair = { from: updatedLangPair.to, to: updatedLangPair.from };
  }

  for (const [detectedLang] of lngDetector.detect(text)) {
    if (detectedLang === updatedLangPair.from.toString()) {
      return [updatedLangPair, text];
    }
    if (detectedLang === updatedLangPair.to.toString()) {
      return [{ from: updatedLangPair.to, to: updatedLangPair.from }, text];
    }
  }

  return [updatedLangPair, text];
}


// color of tags based on their pos. return array of tags with their color
export const translationsToAccsesotyTags = (translations: Translation[]) => {
  let accessories = [];
  for (let i = 0; i < translations.length; i++) {
    let color;
    switch (translations[i].pos) {
      case "n":
        color = Color.Blue;
        break;
      case "v":
        color = Color.Green
        break;
      case "adj":
        color = Color.Yellow;
        break;
      case "adv":
        color = Color.Orange;
        break;
      default:
        color = Color.SecondaryText;
        break;
    }
    accessories.push({
      tag: {
        value: translations[i].translation,
        color: color,
      }
    });
  }
  return accessories;
}
import { ActionPanel, List, Action, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { Preferences, UsageExample, Translation, SynonymAntonymCard, Contexts } from "./domain";
import { getContexts, getResults, getSynonyms } from "./reversoApi";
import { clarifyLangPairDirection, clearTag, prefsToLangPair, translationsToAccsesotyTags } from "./utils";

export default function CommandBase(getPreferencesFunc: () => Preferences) {
  // Examples (Contexts)
  const [examples, setExamples] = useState<UsageExample[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [ipa, setIpa] = useState("");
  const [searchText, setSearchText] = useState("");
  // Synonyms
  const [synonyms, setSynonyms] = useState<SynonymAntonymCard[]>([]);

  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (text === "") {
      return;
    }
    if (!text.endsWith(".")) {
      showToast(Toast.Style.Failure, "Error", "Please enter a sentence ending with a period (.)");
      return;
    }

    const preferences = getPreferencesFunc();

    const [langPair, cleanedText] = preferences.correctLangPairDirection
      ? clarifyLangPairDirection(text, prefsToLangPair(preferences))
      : [prefsToLangPair(preferences), text];

    showToast(Toast.Style.Animated, `[${langPair.from} -> ${langPair.to}]`, "Loading...");

    setIsLoading(true);
    setExamples([]);
    setTranslations([]);
    setIpa("");
    setSearchText("");
    setSynonyms([]);


    const cleanedInput = cleanedText.replace(/\.$/, "");

    // NEW
    getResults(cleanedInput, langPair.from, langPair.to)
      .then(([contexts, synonyms]) => {
        setExamples(contexts.examples);
        setIpa(contexts.ipa);
        setSynonyms(synonyms);
        setTranslations(contexts.translations);
        setSearchText(contexts.searchText);
        setIsLoading(false);
        showToast(Toast.Style.Success, `[${langPair.from} -> ${langPair.to}]`, "Done");
      })
      .catch((error) => {
        showToast(Toast.Style.Failure, "Error: " + error, error);
      })
  }, [text]);

  return (
    <List
      searchBarPlaceholder="Enter text to see usage examples"
      onSearchTextChange={setText}
      isLoading={isLoading}
      throttle
    >
      {translations.length > 0 && (
        <List.Item title={searchText} subtitle={ipa} accessories={translationsToAccsesotyTags(translations)} />
      )}
      {synonyms.length > 0 && (
        <List.Section title="Synonyms">
          {synonyms.map((card, index) => (
            <List.Item
              key={index}
              title={card.pos.join(", ")}
              accessories={[{ text: card.matches.slice(0, 7).join(", ") }]}
              subtitle={card.likableWords.join(", ")}
            />
          ))}
        </List.Section>
      )}
      {examples.length > 0 && (
        <List.Section title="Examples">
          {examples.map((e, index) => (
            <List.Item
              key={index}
              accessories={[{ text: e.sExample }]}
              title={`${e.tText}`}
              actions={
                <ActionPanel>
                  <ActionPanel.Section>
                    <Action.CopyToClipboard title="Copy" content={clearTag(e.tText)} />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}

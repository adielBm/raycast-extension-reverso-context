import { ActionPanel, List, Action, showToast, Toast, getPreferenceValues, Icon } from "@raycast/api";
import { useEffect, useState } from "react";
import { Preferences, UsageExample, Translation, SynonymAntonymCard, Contexts, AllPreferences } from "./domain";
import getResults from "./results";
import { clarifyLangPairDirection, clearTag, prefsToLangPair, translationsToAccsesotyTags, translationsToMetadataTagList } from "./utils";

export default function Command(props: { arguments: { text: string } }) {
  const [examples, setExamples] = useState<UsageExample[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [ipa, setIpa] = useState("");
  const [searchText, setSearchText] = useState("");
  const [synonyms, setSynonyms] = useState<SynonymAntonymCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState(props.arguments.text + ".");
  const preferences: Preferences = getPreferenceValues<AllPreferences>();
  const [isShowingDetail, setIsShowingDetail] = useState(false);


  useEffect(() => {
    let [langPair, cleanedText] = preferences.correctLangPairDirection
      ? clarifyLangPairDirection(text, prefsToLangPair(preferences))
      : [prefsToLangPair(preferences), text];

    cleanedText = cleanedText.trim();
    if (cleanedText.length === 0 || !cleanedText.endsWith(".")) {
      return;
    }

    cleanedText = cleanedText.slice(0, -1).trim();


    const fetchData = async () => {
      showToast(Toast.Style.Animated, `[${langPair.from} -> ${langPair.to}]`, "Loading...");
      setIsLoading(true);
      setExamples([]);
      setTranslations([]);
      setIpa("");
      setSearchText("");
      setSynonyms([]);

      try {
        const [contexts/* , synonyms */] = await getResults(cleanedText, langPair.from, langPair.to);
        setExamples(contexts.examples);
        setIpa(contexts.ipa);
        // setSynonyms(synonyms);
        setTranslations(contexts.translations);
        setSearchText(contexts.searchText);
        showToast(Toast.Style.Success, `[${langPair.from} -> ${langPair.to}]`, "Done");
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        showToast(Toast.Style.Failure, "Error: " + error, String(error));
      }
    };

    fetchData();
  }, [text]); // Add dependencies

  return (
    <List
      searchBarPlaceholder="Enter text to see usage examples"
      onSearchTextChange={setText}
      isLoading={isLoading}
      isShowingDetail={isShowingDetail}
      throttle
    >
      {translations.length > 0 && (
        <List.Item title={searchText} subtitle={ipa} accessories={!isShowingDetail ? translationsToAccsesotyTags(translations, 65 - (searchText.length + ipa.length)) : undefined}
          actions={
            <ActionPanel>
              <ActionPanel.Section>
                <Action
                  title="Show Details"
                  onAction={() => setIsShowingDetail(!isShowingDetail)}
                  icon={Icon.Info}
                />
              </ActionPanel.Section>
            </ActionPanel>
          }
          detail={
            <List.Item.Detail
              // markdown={translations.map((t) => `**${t.pos}**: ${t.translation}`).join("\n")}
              metadata={
                <List.Item.Detail.Metadata>
                  {translationsToMetadataTagList(translations).map((tagList, index) => (
                    <List.Item.Detail.Metadata.TagList
                      key={index}
                      title={tagList.pos}
                    >
                      {tagList.translations.map((t, index) => (
                        <List.Item.Detail.Metadata.TagList.Item
                          key={index}
                          text={t.translation}
                          color={tagList.color}
                        />
                      ))}

                    </List.Item.Detail.Metadata.TagList>

                  ))}
                </List.Item.Detail.Metadata>
              }
            />
          }
        />
      )}
      {/* {synonyms.length > 0 && (
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
      )} */}
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
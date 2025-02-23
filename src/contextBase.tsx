import { ActionPanel, List, Action, showToast, Toast, Icon, showHUD, Color } from "@raycast/api";
import { useEffect, useState } from "react";
import { Preferences, UsageExample, Translation } from "./domain";
import { getContexts } from "./reversoApi";
import {
  buildDetails,
  clarifyLangPairDirection,
  clearTag,
  codeToLanguageDict,
  prefsToLangPair,
  reversoBrowserQuery,
} from "./utils";

let count = 0;


// color of tags based on their pos. return array of tags with their color
const translationsToAccsesotyTags = (translations: Translation[]) => {
  let accessories = [];
  for (let i = 0; i < translations.length; i++) {
    let color;
    switch (translations[i].pos) {
      case "n":
      color = {
        light: "#055C9D",
        dark: "#68BBE3",
      };
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


export default function CommandBase(getPreferencesFunc: () => Preferences) {

  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState("");
  const [examples, setExamples] = useState<UsageExample[]>([]);
  const [isShowingDetail, setIsShowingDetail] = useState(false);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [ipa, setIpa] = useState("");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (text === "") {
      return;
    }

    count++;
    const localCount = count;  

    setIsLoading(true);
    setExamples([]);

    const preferences = getPreferencesFunc();

    const langPair = preferences.correctLangPairDirection
      ? clarifyLangPairDirection(text, prefsToLangPair(preferences))
      : prefsToLangPair(preferences);

    showToast(Toast.Style.Animated, `[${langPair.from} -> ${langPair.to}]`, "Loading...");

    getContexts(text, langPair.from, langPair.to)
      .then((contexts) => {
        if (localCount !== count) {
          // If current request is not actual, ignore it.
          return;
        }
        setExamples(contexts.examples);
        setTranslations(contexts.translations);
        setIpa(contexts.ipa);
        setSearchText(contexts.searchText);
      })
      .catch((error) => {
        showToast(Toast.Style.Failure, "Could not translate", error);
      })
      .then(() => {
        setIsLoading(false);
        showToast(Toast.Style.Success, `[${langPair.from} -> ${langPair.to}]`, "Finished");
      });
  }, [text]);

  return (
    <List
      searchBarPlaceholder="Enter text to see usage examples"
      onSearchTextChange={setText}
      isLoading={isLoading}
      isShowingDetail={isShowingDetail}
      throttle
    >
      {translations.length > 0 && <List.Item
        title={searchText}
        subtitle={ipa}
        accessories={translationsToAccsesotyTags(translations)}
      />}
      {examples.map((e, index) => (
        <List.Item
          key={index}
          accessories={[
            { text: e.sExample },
          ]}
          title={`${e.tText}`}
          detail={<List.Item.Detail markdown={buildDetails(e)} />}
          actions={
            <ActionPanel>
              <ActionPanel.Section>
                <Action
                  title="Show Full Example and Translation"
                  icon={Icon.Text}
                  onAction={() => setIsShowingDetail(!isShowingDetail)}
                />
                <Action.CopyToClipboard title="Copy" content={clearTag(e.tExample)} />
                <Action.OpenInBrowser
                  title="Open in Reverso Context"
                  shortcut={{ modifiers: ["opt"], key: "enter" }}
                  url={`${reversoBrowserQuery}/${codeToLanguageDict[e.sLang]}-${codeToLanguageDict[e.tLang]}/${e.sText
                    }`}
                />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

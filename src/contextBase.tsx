import { ActionPanel, List, Action, showToast, Toast, Icon, showHUD } from "@raycast/api";
import { useEffect, useState } from "react";
import { Preferences, UsageExample } from "./domain";
import { getUsageExamples } from "./reversoApi";
import {
  buildDetails,
  clarifyLangPairDirection,
  clearTag,
  codeToLanguageDict,
  prefsToLangPair,
  reversoBrowserQuery,
} from "./utils";

let count = 0;

export default function CommandBase(getPreferencesFunc: () => Preferences) {

  showHUD("Hey there 👋");

  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState("");
  const [examples, setExamples] = useState<UsageExample[]>([]);
  const [isShowingDetail, setIsShowingDetail] = useState(false);

  
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

    showHUD("Hey there 👋");
    
    getUsageExamples(text, langPair.from, langPair.to)
      .then((examples) => {
        if (localCount !== count) {
          // If current request is not actual, ignore it.
          return;
        }

        setExamples(examples);
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
      {examples.map((e, index) => (
        <List.Item
          key={index}
          title={e.tText}
          icon={Icon.Tree}
      /*     accessories={[
            {
              tag: {
                value: "An Accessory Tag",
                color: Color.Green,
              },
              text: "A Colored Accessory Text",
              icon: { source: Icon.Hammer, tintColor: Color.Orange },
            },
          ]} */
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
                  url={`${reversoBrowserQuery}/${codeToLanguageDict[e.sLang]}-${codeToLanguageDict[e.tLang]}/${
                    e.sText
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

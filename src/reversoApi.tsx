import { showHUD, showToast, Toast } from "@raycast/api";
import puppeteer from "puppeteer-core";
import { LangCode, Translation, UsageExample } from "./domain";
import { codeToLanguageDict } from "./utils";

interface Contexts {
  examples: UsageExample[];
  translations: Translation[];
}

export async function getContexts(text: string, sLang: LangCode, tLang: LangCode): Promise<Contexts> {
  let browser, page;

  const contexts: Contexts = {
    examples: [],
    translations: [],
  };

  if (!text || !text.endsWith(".")) {
    return contexts;
  }
  // remove the period from the text
  text = text.slice(0, -1);

  try {
    browser = await puppeteer.launch({
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();

    showToast(Toast.Style.Animated, "Reverso Context", "Loading...");

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    );
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      request.continue({
        headers: {
          ...request.headers(),
          "Accept-Language": "en-US,en;q=0.9,he;q=0.8",
        },
      });
    });

    const url = `https://context.reverso.net/translation/${codeToLanguageDict[sLang]}-${codeToLanguageDict[tLang]
      }/${encodeURIComponent(text)}`;

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".example", { timeout: 60000 });

    const contexts: [UsageExample[], Translation[]] = await page.evaluate(
      (sLang, tLang, text) => {
        let translations: Translation[] = [];
        const translationElements = document.querySelectorAll(".translation");
        translationElements.forEach((element) => {
          const translation = element.getAttribute("data-term") || "";
          ["n", "adv", "adj", "v"].forEach((pos) => {
            if (element.classList.contains(pos) && translation.trim() !== "") {
              translations.push({ translation, pos });
            }
          });
        });

        const examplesArray: UsageExample[] = [];
        const exampleElements = document.querySelectorAll(".example");

        exampleElements.forEach((element) => {
          const sourceTextElement = element.querySelector(".src .text");
          // const sourceEmphasizedElement = sourceTextElement?.querySelector("em");
          const targetTextElement = element.querySelector(".trg .text");
          const targetEmphasizedElement = targetTextElement?.querySelector("em, .link_highlighted");
          if (!sourceTextElement || !targetTextElement) {
            return;
          }
          const sourceText = sourceTextElement.textContent?.trim() || "";
          // const sourceEmphasized = sourceEmphasizedElement?.textContent?.trim() || "";
          const targetText = targetTextElement.textContent?.trim() || "";
          const targetEmphasized = targetEmphasizedElement?.textContent?.trim() || "";
          const refElement = element.querySelector(".ref-class"); // Adjust selector based on actual structure
          const urlElement = element.querySelector(".url-class"); // Adjust selector based on actual structure

          examplesArray.push({
            sExample: sourceText,
            tExample: targetText,
            sLang: sLang,
            tLang: tLang,
            sText: text,
            tText: targetEmphasized,
            source: refElement && refElement.textContent ? refElement.textContent.trim() : "",
            sourceUrl: urlElement && urlElement.textContent ? urlElement.textContent.trim() : "",
          });
        });

        // remove from translations the translations that are not in the examples
        // const translationsFiltered = translations.filter((translation) => {
        //   return examplesArray.some((example) => example.tText === translation.translation);
        // });

        // reverse the translations array
        // translations = translations.reverse();
        translations = translations.slice(0, 7);
        return [examplesArray, translations] as [UsageExample[], Translation[]];
      },
      sLang,
      tLang,
      text,
    );

    if (browser) {
      await browser.close();
    }
    return { examples: contexts[0], translations: contexts[1] };

  } catch (err: unknown) {
    if (err instanceof Error) {
      showToast(Toast.Style.Failure, "Can't find examples", err.message);
    } else {
      showToast(Toast.Style.Failure, "Can't find examples", "An unknown error occurred.");
    }
    if (browser) {
      await browser.close();
    }
    return contexts;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

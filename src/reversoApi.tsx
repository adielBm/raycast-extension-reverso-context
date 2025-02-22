import { showToast, Toast } from "@raycast/api";
import puppeteer from "puppeteer";
import { LangCode, UsageExample } from "./domain";
import { codeToLanguageDict } from "./utils";
import { showHUD } from "@raycast/api";


export async function getUsageExamples(text: string, sLang: LangCode, tLang: LangCode): Promise<UsageExample[]> {
  let browser, page;
  
  await showHUD("Hey there 👋");

  console.error("getUsageExamples", text, sLang, tLang);
  if (!text) {
    showToast
    return [];
  }

  // if `text` is not ennded with a period, do not search for examples
  if (!text.endsWith(".")) {
    return [
      {
        sExample: "",
        tExample: "",
        sLang: sLang,
        tLang: tLang,
        sText: "Please end the sentence with a period.",
        tText: "Please end the sentence with a period.",
        source: "",
        sourceUrl: "",
      },
    ];
  }
  // remove the period from the text
  text = text.slice(0, -1);

  try {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
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

    const url = `https://context.reverso.net/translation/${codeToLanguageDict[sLang]}-${
      codeToLanguageDict[tLang]
    }/${encodeURIComponent(text)}`;

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".example", { timeout: 60000 });

    const examples = await page.evaluate(
      (sLang, tLang, text) => {
        const examplesArray: UsageExample[] = [];
        const exampleElements = document.querySelectorAll(".example");
        exampleElements.forEach((element) => {
          const sourceTextElement = element.querySelector(".src .text");
          // const sourceEmphasizedElement = sourceTextElement?.querySelector("em");
          const targetTextElement = element.querySelector(".trg .text");
          const targetEmphasizedElement = targetTextElement?.querySelector("em, .link_highlighted");
          if (!sourceTextElement || !targetTextElement) {
            return null;
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

        return examplesArray;
      },
      sLang,
      tLang,
      text,
    );
    return examples;
  } catch (err: unknown) {
    if (err instanceof Error) {
      showToast(Toast.Style.Failure, "Can't find examples", err.message);
    } else {
      showToast(Toast.Style.Failure, "Can't find examples", "An unknown error occurred.");
    }
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

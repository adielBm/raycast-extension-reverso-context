import { showHUD, showToast, Toast } from "@raycast/api";
import puppeteer from "puppeteer-core";
import { Contexts, LangCode, SynonymAntonymCard, Translation, UsageExample } from "./domain";
import { codeToLanguageDict } from "./utils";

export async function getContexts(sText: string, sLang: LangCode, tLang: LangCode): Promise<Contexts> {
  let browser, page;

  const contexts: Contexts = {
    examples: [],
    translations: [],
    ipa: "",
    searchText: "",
  };

  try {
    browser = await puppeteer.launch({
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
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

    const url = `https://context.reverso.net/translation/${codeToLanguageDict[sLang]}-${codeToLanguageDict[tLang]}/${encodeURIComponent(sText)}`;

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".example", { timeout: 8000 });

    const contexts: [UsageExample[], Translation[], string, string] = await page.evaluate(
      (sLang, tLang, sText) => {
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
          const sExampleElement = element.querySelector(".src .text");
          // const sourceEmphasizedElement = sExampleElement?.querySelector("em");
          const tExampleElement = element.querySelector(".trg .text");
          const tTextElement = tExampleElement?.querySelector("em, .link_highlighted");
          if (!sExampleElement || !tExampleElement) {
            return;
          }
          const sExample = sExampleElement.textContent?.trim() || "";
          const tExample = tExampleElement.textContent?.trim() || "";
          const tText = tTextElement?.textContent?.trim() || "";

          examplesArray.push({
            sExample: sExample,
            tExample: tExample,
            sLang: sLang,
            tLang: tLang,
            sText: sText,
            tText: tText
          });
        });

        // get the ipa
        const ipaElement = document.querySelector(".ipa");
        const ipa = ipaElement?.textContent?.trim() || "";

        // get the search text
        const searchTextElement = document.querySelector(".search-text");
        const searchText = searchTextElement?.textContent?.trim() || "";
   
        translations = translations.slice(0, 7);
        return [examplesArray, translations, ipa, searchText] as [UsageExample[], Translation[], string, string];
      },
      sLang,
      tLang,
      sText,
    );
   
    return { examples: contexts[0], translations: contexts[1], ipa: contexts[2], searchText: contexts[3] };

  } catch (err: unknown) {
    if (err instanceof Error) {
      showToast(Toast.Style.Failure, "Can't find examples", err.message);
    } else {
      showToast(Toast.Style.Failure, "Can't find examples", "An unknown error occurred.");
    }
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
    return contexts;
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}


export async function getSynonyms(word: string): Promise<SynonymAntonymCard[]> {
  let browser, page;
  const synonymsList: SynonymAntonymCard[] = [];

  try {
    browser = await puppeteer.launch({
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    );

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      request.continue({
        headers: {
          ...request.headers(),
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
    });

    const url = `https://www.thesaurus.com/browse/${encodeURIComponent(word)}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    // Wait for the synonyms to load
    await page.waitForSelector('section[data-type="synonym-antonym-module"]', { timeout: 8000 });
    const results = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-type="synonym-and-antonym-card"]');
      const cards: SynonymAntonymCard[] = [];

      elements.forEach((element) => {
        const text = (element as HTMLElement).innerText;
        // Helper function to extract words (for things like "positive, outstanding")
        const extractWords = (line: string): string[] => line.split(',').map(word => word.trim());

        // Extracting POS (Part of Speech) e.g. "adjective"
        const posMatch = text.match(/(adjective|verb|noun|pronoun|adverb|conjunction|interjection) as in (.+)/);
        const pos = posMatch ? [posMatch[1]] : ["unknown"];

        // Extracting "likable words" (like "positive, outstanding")
        const likableWordsMatch = text.match(/as in (.+)/);
        const likableWords = likableWordsMatch ? extractWords(likableWordsMatch[1]) : ["unknown"];


        // Extracting Strong Matches (from the "Strong matches" section)
        const strongesMatchesIndex = text.indexOf('Strongest matches');
        const strongMatchesIndex = text.indexOf('Strong matches');
        const weakMatchesIndex = text.indexOf('Weak matches');

        let matches: string[] = [];

        // Get the substring containing the strong matches
        if (strongesMatchesIndex !== -1 && strongMatchesIndex !== -1) {
          const strongesMatchesText = text.substring(strongesMatchesIndex, strongMatchesIndex).trim();
          const strongesMatches = strongesMatchesText.replace('Strongest matches', '').trim().split('\n').map(word => word.trim()) || ["unknown"];
          matches = [...matches, ...strongesMatches];
        }

        if (strongMatchesIndex !== -1 && weakMatchesIndex !== -1) {
          const strongMatchesText = text.substring(strongMatchesIndex, weakMatchesIndex).trim();
          const strongMatches = strongMatchesText.replace('Strong matches', '').trim().split('\n').map(word => word.trim()) || ["unknown"];
          matches = [...matches, ...strongMatches];
        }

        if (strongesMatchesIndex !== -1 && weakMatchesIndex !== -1) {
          const weakMatchesText = text.substring(weakMatchesIndex).trim();
          const weakMatches = weakMatchesText.replace('Weak matches', '').trim().split('\n').map(word => word.trim()) || ["unknown"];
          matches = [...matches, ...weakMatches];
        }

        // Remove empty strings
        matches = matches.filter(match => match !== '');
        // Remove `,` from the strings
        matches = matches.map(match => match.replace(',', ''));
        // Remove duplicates
        matches = Array.from(new Set(matches));

        cards.push({
          pos, // Part of Speech (e.g. ['adjective', 'verb'])
          matches, // Array of strong matches
          likableWords, // Array of words like 'positive', 'outstanding'
        });
      });

      return cards;
    });
    
    return results;

  } catch (err: unknown) {
    if (err instanceof Error) {
      synonymsList.push();
    } else {
      showToast(Toast.Style.Failure, "Can't find synonyms", "An unknown error occurred.");
    }
    
    return synonymsList;
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}
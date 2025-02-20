import { showToast, Toast } from "@raycast/api";
import puppeteer from "puppeteer";
import { LangCode, UsageExample } from "./domain";
import { codeToLanguageDict } from "./utils";

export const codeToLang = (langcode: LangCode): string => {
  return codeToLanguageDict[langcode];
}

export async function getUsageExamples(text: string, sLang: LangCode, tLang: LangCode): Promise<UsageExample[]> {
  let browser;
  let page;

  try {
    // Launch Puppeteer browser and navigate to the translation page
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();

    // Set user-agent and other headers to mimic a real browser
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36');
    await page.setRequestInterception(true);

    page.on('request', (request) => {
      request.continue({
        headers: {
          ...request.headers(),
          'Accept-Language': 'en-US,en;q=0.9,he;q=0.8',
        },
      });
    });

    // Construct the URL with query params
    const url = `https://context.reverso.net/translation/${codeToLang(sLang)}-${codeToLang(tLang)}/${encodeURIComponent(text)}`;

    console.log('Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Wait for the examples to be rendered on the page
    await page.waitForSelector('.example', { timeout: 60000 }); // Wait for examples to load

    console.log('Page loaded successfully');

    // Extract usage examples from the page
    const examples = await page.evaluate((sLang, tLang, text) => {
      const examplesArray: UsageExample[] = [];
      const exampleElements = document.querySelectorAll(".example");

      exampleElements.forEach((element) => {


        const sourceTextElement = element.querySelector(".src .text");
        const sourceEmphasizedElement = sourceTextElement?.querySelector("em");
        const targetTextElement = element.querySelector(".trg .text");
        const targetEmphasizedElement = targetTextElement?.querySelector("em, .link_highlighted");
      
        if (!sourceTextElement || !targetTextElement) {
          return null;
        }
      
        let sourceText = sourceTextElement.textContent?.trim() || ""
        let sourceEmphasized = sourceEmphasizedElement?.textContent?.trim() || ""
        let targetText =  targetTextElement.textContent?.trim() || ""
        let targetEmphasized = targetEmphasizedElement?.textContent?.trim() || ""

        console.log('sourceText:', sourceText);
        console.log('sourceEmphasized:', sourceEmphasized);
        console.log('targetText:', targetText);
        console.log('targetEmphasized:', targetEmphasized);

        // Extract ref and URL if available
        const refElement = element.querySelector(".ref-class"); // Adjust selector based on actual structure
        const urlElement = element.querySelector(".url-class"); // Adjust selector based on actual structure

        examplesArray.push({
          sExample: sourceText,
          tExample: targetText, 
          sLang: sLang, 
          tLang: tLang, 
          sText: "text", 
          tText: targetEmphasized,
          source: refElement && refElement.textContent ? refElement.textContent.trim() : "",
          sourceUrl: urlElement && urlElement.textContent ? urlElement.textContent.trim() : "",
        });
      });

      return examplesArray;
    }, sLang, tLang, text);

    return examples;

  } catch (err: any) {
    console.error('Error scraping examples:', err);
    showToast(Toast.Style.Failure, "Can't find examples", err.message);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

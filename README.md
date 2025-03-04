This Raycast extension is based on https://www.raycast.com/MrModest/reverso-context by [MrModest](https://www.raycast.com/MrModest).
I forked the original due to https://github.com/raycast/extensions/issues/17164. And made some changes.

> [!WARNING] This is an **early version** and is not yet available in the Raycast Store.

- The extension uses [Puppeteer](https://pptr.dev/) for web scraping.  
- You may have to change the [executablePath](https://github.com/adielBm/raycast-extension-reverso-context/blob/59e7920817dc98f5d6b4db73f3c6a61072761007/src/reversoApi.tsx#L27).
- Translations, IPA pronunciation and Examples (from context.reverso.net)

### Features

- Translations
- IPA pronunciation
- Examples
- Synonyms (from thesaurus.com, english only)

### Usage

- `home` will translate "home" from default source language to default target language. (Auto reverse direction if enabled)
- `>es home` will translate "home" from default language to Spanish.
- `fr> maison` will translate "maison" from French to default language.
- `en>it home` will translate "house" from English to Italian.
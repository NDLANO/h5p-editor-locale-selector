# H5PEditor Locale Selector
A widget that makes it possible to turn a text field into a locale selector for languages and countries and to then receive related values as text parameter.

<img width="293" height="269" alt="image" src="https://github.com/user-attachments/assets/9cc3fb91-dfb4-4cf4-b8f6-c1dbbd02d4e7" />

## Basic Usage
In order to use the language selector, just apply `"widget": "localeSelector"` to a [semantics field of type text](https://h5p.org/semantics#type-text).

```
{
  "name": "locale",
  "type": "text",
  "label": "Locale",
  "description": "Select the language for this content.",
  "widget": "localeSelector"
}
```

By default, this will add a locale selector for languages. When the author saves the content, the text field value will contain an IETF BCP 47 tag that represents the language that was chosen. 

For instance, if the author chose "English", then in your content type you'd find this in your field parameter value:
```
en
```

## Options
You can add an object type `localeSelector` property to your semantic text field to customize the selector appearance and behavior. That property can hold a combination of key/value pairs for customization.

| Key                   | Value                                                                                                                                                                                                                                                                                         |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `type`                | `"language"` or `"country"` (default: `"language"`)                                                                                                                                                                                                                                           |
| `requestedBCP47s`     | `"primary"` or `"secondary"` or array of [IETF BCP47 tags](https://en.wikipedia.org/wiki/IETF_language_tag) (default: `primary`)                                                                                                                                                              |
| `requestedISO3166s`   | Array of [ISO-3116 country codes](https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes)                                                                                                                                                                                               |
| `requestedProperties` | Array of `"bcp47"`, `"countryNameEnglish"`, `"languageNameEnglish"`, `"countryNameLocal"`, `"languageNameLocal"`, `"iso3166"`, `"iso639-1"`: `"flag"`, `"countryNameTranslatedContent"`, `"languageNameTranslatedContent"`, `"countryNameTranslatedEditor"`, `"languageNameTranslatedEditor"` |
| `noFlag`              | `true` or `false` (default: `"false"`)                                                                                                                                                                                                                                                        |
| `default`             | [IETF BCP47 tag](https://en.wikipedia.org/wiki/IETF_language_tag) or [ISO-3116 country code](https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes) (default: `en`/`GB`)                                                                                                               |
| `targetFieldMap`      | object with key/value pairs of a relative semantics path to another text field (key) and a requested property to fill the field with (value)                                                                                                                                                  |

### Select countries
In order to let the author choose a country instead, add `"localeSelector": { "type": "country" }`. The value that is stored will be the ISO 6133 country code for the chosen language, e.g. `NO` for Norway.

#### Example: Country selector
```
{
  "name": "locale",
  "type": "text",
  "label": "Locale",
  "description": "Select the country for this content.",
  "widget": "localeSelector",
  "localeSelector": {
    "type": "country"
  }
}
```

### Set the default value to be selected when the author creates the content
By setting the `default` property value, you can control what default language or country will be preselected when the author sees the selector for the first time. The value needs to be the respective IETF BCP 47 tag for languages or ISO 3166 country code, e.g. `"UY"` for Uruguay.

If no default value is set, then no language or country will be selected by default.

Tags/codes that are invalid or that not information is available for will be ignored.

#### Example: Country selector with Uruguay as default country
```
{
  "name": "locale",
  "type": "text",
  "label": "Locale",
  "description": "Select the locale for this content.",
  "widget": "localeSelector",
  "optional": true,
  "localeSelector": {
    "type": "country",
    "default": "UY"
  }
}
```

### Choose the languages that the author can select from
By setting the `requestedBCP47s` property inside the `localeSelector` object, you can choose what languages the author can choose from.

By default (or if you set the value to `primary`), all primary languages will be displayed. If you choose `secondary`, then secondary languages (such as `"es-MX"` for Mexican Spanish) will be shown as well. Alternatively, you can define a list of IETF BCP 47 tags to exactly specify what languages the author will be able to choose from, e.g. `["ko", "ja"]` for Korean and Japanese only.

Tags that are invalid ot that no language information is defined for in the widget assets will be ignored. If you set the `type` to `country`, then the `requestedBCP47s` property will be ignored.

#### Example: Language selector with Korea and Japan as options
```
{
  "name": "locale",
  "type": "text",
  "label": "Locale",
  "description": "Select the language for this content.",
  "widget": "localeSelector",
  "localeSelector": {
    "requestedBCP47s": ["ko", "ja"]
  }
}
```

### Choose the countries that the author can select from
By setting the `requestedISO3166s` property inside the `localeSelector` object, you can choose what countries the author can choose from. Notet that the `type` property must be set to `country`, too.

You can define a list of ISO 3166 codes to exactly specify what countries the author will be able to choose from, e.g. `["KI", "ZA", "TZ"]` for Kiribati, South Africa and Tanzania.

Codes that are invalid ot that no country information is defined for in the widget assets will be ignored. If you set the `type` to `language` or not at all, then the `requestedISO3166s` property will be ignored.

#### Example: Country selector with Kiribati, South Africa and Tanzania as options
```
{
  "name": "locale",
  "type": "text",
  "label": "Locale",
  "description": "Select the country for this content.",
  "widget": "localeSelector",
  "localeSelector": {
    "type": "country",
    "requestedISO3166s": ["KI", "ZA", "TZ"]
  }
}
```

### requestedProperties
By setting the `requestedProperties` you can request more language or country related data than just a language tag or country code. Before explaining what this means on a technical level, let's first have a look at the properties that you can request:

If you set the widget to be a language selector, then these properties will be available:

| Property                 | Explanation                                                                           |
---------------------------|---------------------------------------------------------------------------------------|
| `bcp47`                  | IETF BCP 47 language tag, e.g. `es` or `es-MX` (set by default                        |
| `flag`                   | Unicode representation of the country closely linked with that language               |
| `iso639-1`               | ISO 639-1 language tag, e.g. `es`                                                     |
| `languageNameEnglish`    | Name of the language in English, e.g. `Spanish`                                       |
| `languageNameLocal`      | Name of the language in that very language, e.g. `Español`                            |
| `languageNameTranslatedContent` | Name of the language in the language that the content is set to, e.g. `Spansk` |
| `languageNameTranslatedEditor`  | Name of the language in the language that the editor is using, e.g. `Spanisch` |

Note that `bcp47` will be set by default, because it is used to store what language was selected. If you request invalid tags, these will be ignored.

If you set the widget to be a country selector, then these properties will be available:

| Property                 | Explanation                                                                         |
---------------------------|-------------------------------------------------------------------------------------|
| `bcp47`                  | IETF BCP 47 language tag of the country's dominant official language, e.g. `es`     |
| `countryNameEnglish`     | Name of the country in English, e.g. `Spain`                                        |
| `countryNameLocal`       | Name of the country in its dominant language, e.g. `España`                         |
| `countryNameTranslatedContent` | Name of the country in the language that the content is set to, e.g. `Spania` |
| `countryNameTranslatedEditor`  | Name of the country in the language that the editor is using, e.g. `Spanien`  |
| `flag`                   | Unicode representation of the country flag                                          |
| `iso3166`                | ISO 3166 country code, e.g. `ES` (set by default)                                   |

Note that `iso3155` will be set by default, because it is used to store what country was selected. If you request invalid tags, these will be ignored.

Instead of just storing a plain string that either represents an IETF BCP 47 language tag for languages or an ISO 3166 country code for countries, multiple key/value pairs will be stored as a stringified JSON object. Note that this string will also be HTML encoded by H5P core.

That means that you cannot just work with the parameter value in your content type, but you'll need to process it to get the information that you need. For instance, your value could look like:
```
"{&quot;bcp47&quot;:&quot;en&quot;,&quot;languageNameEnglish&quot;:&quot;English&quot;,&quot;languageNameLocal&quot;:&quot;English&quot;,&quot;iso639-1&quot;:&quot;en&quot;,&quot;flag&quot;:&quot;🇬🇧&quot;,&quot;languageNameTranslatedContent&quot;:&quot;English&quot,&quot;languageNameTranslatedEditor&quot;:&quot;English&quot;}"
```

That means, that in your content type you will have to make sense of this string. You would typically HTML-decode it first and receive:
```
{"bcp47":"en","languageNameEnglish":"English","languageNameLocal":"English","iso639-1":"en","flag":"🇬🇧","languageNameTranslatedContent":"English","languageNameTranslatedEditor":"English"}
```

You would then JSON-encode it to get the respective object back:
```
{
  "bcp47": "en",
  "languageNameEnglish":"English",
  "languageNameLocal":"English",
  "iso639-1": "en",
  "flag":"🇬🇧",
  "languageNameTranslatedContent":"English"
  "languageNameTranslatedEditor":"English"
}
```

#### Example: Language selector requesting all available properties that are related to the selected language
```
{
  "name": "locale",
  "type": "text",
  "label": "Locale",
  "description": "Select the language for this content.",
  "widget": "localeSelector",
  "localeSelector": {
    "requestedBCP47s": ["bcp47", "flag", "iso639-1", "languageNameEnglish", "languageNameLocal", "languageNameTranslatedContent", "languageNameTranslatedEditor"]
  }
}
```

### noFlag
By setting the `noFlag` property to the boolean `true`, you can get a selector that does not show a flag in front of the option labels.

#### Example: Language selector without a flag in front of the option labels
```
{
  "name": "locale",
  "type": "text",
  "label": "Locale",
  "description": "Select the language for this content.",
  "widget": "localeSelector",
  "localeSelector": {
    "noFlag": true
  }
}
```

### targetFieldMap
You may not be comfortable with handling multiple requested properties in a string, or you may want the author to be able to modify the value after picking a language or country. In that case, you can set up additional text fields as target fields in your `semantics.json` file and instruct the widget to put a value into that text field. The value will then not be put into the field that you set the widget on, but only into the target field.

In order to achieve that, you would add key/value pairs to a `targetFieldMap` object inside the `localeSelector` property. As key you would set one of the properties that you can use as `requestedProperties`. The value needs to be a relative path to the target semantics field - starting from the field that the widget is attached to.

Invalid property tags will be ignored. If the target field cannot be found, nothing bad will happen :-)

#### Example: Put the languageNameLocal value into an extra text field.
```
{
  "name": "locale",
  "type": "text",
  "label": "Locale",
  "description": "Select the language for this content.",
  "widget": "localeSelector",
  "localeSelector": {
    "targetFieldMap": {
      "languageNameLocal": "myExtraTextField"
    }
  }
},
{
  "name": "myExtraTextField",
  "type": "text",
  "label": "Local language name",
  "optional": true
}
```

## Building the distribution files
Clone this repository with git and check out the branch that you are interested
in (or choose the branch first and then download the archive, but learning
how to use git really makes sense).

Change to the repository directory and run
```bash
npm install
```

to install required modules. Afterwards, you can build the project using
```bash
npm run build
```

or, if you want to let everything be built continuously while you are making
changes to the code, run
```bash
npm run watch
```
Before putting the code in production, you should always run `npm run build`.

Also, you should run
```bash
npm run lint
```
in order to check for coding style guide violations.

In order to pack an H5P library, please install the
[H5P CLI tool](https://h5p.org/h5p-cli-guide) instead of zipping everything
manually. That tool will take care of a couple of things automatically that you
will need to know otherwise.

In simple cases, something such as
```bash
h5p pack <your-repository-directory> my-awesome-library.h5p
```
will suffice.

For more information on how to use H5P, please have a look at
https://youtu.be/xEgBJaRUBGg and the H5P developer guide at
https://h5p.org/library-development.

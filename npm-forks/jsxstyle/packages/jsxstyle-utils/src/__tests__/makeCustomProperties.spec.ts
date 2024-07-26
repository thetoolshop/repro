/** @jest-environment jsdom */

import { getCustomPropertiesFunction } from '../makeCustomProperties';
import { getStyleCache } from '../getStyleCache';

const cache = getStyleCache();
const makeCustomProperties = getCustomPropertiesFunction(cache);

const getStyleSheetContents = () => {
  return Array.from(document.querySelectorAll('style')).map((node) => {
    return {
      text: node.innerHTML,
      styles: Array.from(node.sheet!.cssRules).map((rule) => rule.cssText),
    };
  });
};

describe('makeCustomProperties', () => {
  it('works', () => {
    const example = makeCustomProperties({
      exampleNumber: 123,
      exampleString: 'wow',
    })
      .addVariant('exampleVariant', {
        exampleString: 'variantWow',
      })
      .addVariant('variantWithMQ', {
        mediaQuery: 'screen and example',
        exampleNumber: 456,
      })
      .build({
        mangle: true,
        namespace: 'exampleNamespace',
        selector: '#banana',
      });

    expect(getStyleSheetContents()).toMatchInlineSnapshot(`
      [
        {
          "styles": [
            "#banana {--exampleNamespace0: 123px; --exampleNamespace1: wow;}",
            "#banana:not(.\\9).exampleNamespace_default {--exampleNamespace0: 123px; --exampleNamespace1: wow;}",
            "#banana:not(.\\9).exampleNamespace_exampleVariant {--exampleNamespace1: variantWow;}",
            "#banana:not(.\\9).exampleNamespace_variantWithMQ {--exampleNamespace0: 456px;}",
            "@media screen and example {#banana:not(.\\9) {--exampleNamespace0: 456px;}}",
          ],
          "text": "/* jsxstyle */",
        },
      ]
    `);

    expect(example).toMatchInlineSnapshot(`
      {
        "exampleNumber": "var(--exampleNamespace0)",
        "exampleString": "var(--exampleNamespace1)",
        "setVariant": [Function],
        "variantNames": [
          "default",
          "exampleVariant",
          "variantWithMQ",
        ],
        "variants": {
          "default": {
            "activate": [Function],
            "className": "exampleNamespace_default",
          },
          "exampleVariant": {
            "activate": [Function],
            "className": "exampleNamespace_exampleVariant",
          },
          "variantWithMQ": {
            "activate": [Function],
            "className": "exampleNamespace_variantWithMQ",
            "mediaQuery": "@media screen and example",
          },
        },
      }
    `);
  });
});

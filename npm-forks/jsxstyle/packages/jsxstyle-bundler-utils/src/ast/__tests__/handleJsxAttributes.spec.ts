import { parse, generate, traverse } from '../babelUtils';
import { format } from 'prettier';
import * as t from '@babel/types';

import { getEvaluateAstNodeWithScopeFunction } from '../getEvaluateAstNodeWithScopeFunction';
import { createClassNameGetter } from '../../../../jsxstyle-utils/src';
import type { InsertRuleCallback } from '../../../../jsxstyle-utils/src/processProps';
import { handleJsxElement } from '../handleJsxAttributes';

const generateAndFormat = (node: t.Node) => {
  return format(generate(node).code, {
    parser: 'babel',
    printWidth: 80,
  });
};

describe('handleJsxAttributes', () => {
  it('works', () => {
    const ast = parse(`
const wow = { prop6: 'hello' };
<Block prop1="value1">content</Block>;
`);

    let styles = '';
    const insertRuleCallback: InsertRuleCallback = (rule) => {
      styles += rule;
    };
    const getClassNameForKey = createClassNameGetter({});

    traverse(ast, {
      JSXElement(nodePath) {
        const output = handleJsxElement(
          nodePath.node,
          [],
          'ExampleBoxComponent',
          {
            attemptEval: getEvaluateAstNodeWithScopeFunction(
              nodePath,
              undefined,
              'test.js',
              {}
            ),
            classPropName: 'className',
            mediaQueriesByKey: {
              isSmallScreen: 'screen and (example-media-query)',
            },
            getClassNameForKey,
            onInsertRule: insertRuleCallback,
            logError: console.error,
            logWarning: console.warn,
            noRuntime: false,
          }
        );

        nodePath.replaceWith(output);
        nodePath.skip();
      },
    });

    expect(generateAndFormat(ast)).toMatchInlineSnapshot(`
      "const wow = {
        prop6: "hello",
      };
      <div className="_x0">content</div>;
      "
    `);

    expect(styles).toMatchInlineSnapshot(`"._x0 { prop1:value1 }"`);
  });
});

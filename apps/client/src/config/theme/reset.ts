import { colors } from './colors'

function createResetRules(rootSelector: string) {
  return [
    '* { box-sizing: border-box; }',
    `html, body, ${rootSelector} {
      margin: 0;
      font-family: sans-serif;
      font-size: 10px;
      font-weight: normal;
      line-height: 1em;
      color: ${colors.slate['900']};
      text-align: initial;
    }`,
  ]
}

export function applyResetStyles(
  rootSelector: string,
  styleTarget: HTMLStyleElement
) {
  const sheet = styleTarget.sheet

  if (sheet) {
    for (const rule of createResetRules(rootSelector)) {
      sheet.insertRule(rule, sheet.cssRules.length)
    }
  }
}

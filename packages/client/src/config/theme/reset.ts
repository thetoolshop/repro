import colors from 'tailwindcss/colors'

function createResetRules(rootSelector: string) {
  return [
    '* { box-sizing: border-box; }',
    `html, body, ${rootSelector} {
      margin: 0;
      font: normal 10px/1em sans-serif; 
      color: ${colors.blueGray['900']};
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
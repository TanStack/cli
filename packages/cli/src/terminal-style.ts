import { styleText as formatText } from 'node:util'

import supportsColor from 'supports-color'

export function styleText(
  format: Parameters<typeof formatText>[0],
  text: string,
): string {
  return supportsColor.stdout
    ? formatText(format, text, { validateStream: false })
    : text
}

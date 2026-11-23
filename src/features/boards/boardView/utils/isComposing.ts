import type { KeyboardEvent } from 'react'

/** True while an IME composition runs. Safari reports it only through keyCode 229. */
export const isComposing = (event: KeyboardEvent) =>
  event.nativeEvent.isComposing || event.keyCode === 229

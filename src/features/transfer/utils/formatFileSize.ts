import { MAX_IMPORT_BYTES } from './limits'

const KB = 1024
const MB = 1_048_576

const wholeNumber = new Intl.NumberFormat('en', { useGrouping: false })
const oneDecimal = new Intl.NumberFormat('en', {
  useGrouping: false,
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function divideRounded(dividend: number, divisor: number, roundUp: boolean) {
  const quotient = Math.floor(dividend / divisor)
  const remainder = dividend % divisor
  if (remainder === 0) return quotient
  return roundUp || remainder * 2 >= divisor ? quotient + 1 : quotient
}

/**
 * Base 1024: whole KB below 1 MB, otherwise MB with one decimal, rounded half up.
 * Sizes over the import limit round up, so a file just over 5 MB never reads "5.0 MB".
 */
export function formatFileSize(
  bytes: number,
  { roundUp = bytes > MAX_IMPORT_BYTES }: { roundUp?: boolean } = {},
) {
  if (bytes < MB) {
    return `${wholeNumber.format(divideRounded(bytes, KB, roundUp))} KB`
  }
  const tenths = divideRounded(bytes * 10, MB, roundUp)
  return `${oneDecimal.format(tenths / 10)} MB`
}

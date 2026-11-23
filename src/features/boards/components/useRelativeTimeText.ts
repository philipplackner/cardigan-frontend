import { useTranslation } from 'react-i18next'
import { formatRelativeTime } from '../utils/formatRelativeTime'

const monthDay = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})
const monthDayYear = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

/** Turns an update time into "2 hours ago", "Yesterday", "Oct 9" or "Oct 9, 2025". */
export function useRelativeTimeText() {
  const { t } = useTranslation('boards')
  return (time: Date, now: Date) => {
    const relative = formatRelativeTime(time, now)
    switch (relative.kind) {
      case 'justNow':
        return t('relativeTime.justNow')
      case 'minutes':
        return t('relativeTime.minutes', { count: relative.count })
      case 'hours':
        return t('relativeTime.hours', { count: relative.count })
      case 'yesterday':
        return t('relativeTime.yesterday')
      case 'date':
        return monthDay.format(relative.date)
      case 'dateWithYear':
        return monthDayYear.format(relative.date)
    }
  }
}

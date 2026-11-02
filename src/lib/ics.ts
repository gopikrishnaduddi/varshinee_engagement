import { eventDetails, localStamp } from '../data/eventDetails.ts'

/** Escape text values per RFC 5545 §3.3.11 */
function esc(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Fold lines longer than 75 octets (RFC 5545 §3.1), never splitting a UTF-8 character */
function fold(line: string) {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line
  const parts: string[] = []
  let current = ''
  let bytes = 0
  for (const ch of line) {
    const size = encoder.encode(ch).length
    const limit = parts.length === 0 ? 75 : 74 // continuation lines begin with a space
    if (bytes + size > limit) {
      parts.push(current)
      current = ''
      bytes = 0
    }
    current += ch
    bytes += size
  }
  parts.push(current)
  return parts.join('\r\n ')
}

/** Build the engagement event as an iCalendar file, anchored to Asia/Kolkata */
export function buildIcs() {
  const e = eventDetails
  const description = [
    `${e.wording.families}, we joyfully invite you to celebrate the engagement of ${e.couple.partnerOne.full} & ${e.couple.partnerTwo.full}.`,
    `${e.eventName}: ${e.time.display}. ${e.food}.`,
    `Directions: ${e.venue.mapsUrl}`,
  ].join('\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Varshinee and Dheeraj//Engagement Invitation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Kolkata',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0530',
    'TZOFFSETTO:+0530',
    'TZNAME:IST',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:engagement-varshinee-dheeraj-${e.date.iso.replaceAll('-', '')}@invitation`,
    'DTSTAMP:20261101T000000Z',
    `DTSTART;TZID=${e.time.timezone}:${localStamp(e.time.start)}`,
    `DTEND;TZID=${e.time.timezone}:${localStamp(e.time.end)}`,
    `SUMMARY:${esc(`${e.eventName} · ${e.couple.short}`)}`,
    `LOCATION:${esc(e.venue.name)}`,
    `DESCRIPTION:${esc(description)}`,
    `URL:${e.venue.mapsUrl}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

export const ICS_FILENAME = 'varshinee-dheeraj-engagement.ics'

/** Google Calendar template link — handy for Android guests */
export function googleCalendarUrl() {
  const e = eventDetails
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${e.eventName} · ${e.couple.short}`,
    dates: `${localStamp(e.time.start)}/${localStamp(e.time.end)}`,
    ctz: e.time.timezone,
    location: e.venue.name,
    details: `${e.food}.\nDirections: ${e.venue.mapsUrl}`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

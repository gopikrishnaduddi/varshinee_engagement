/**
 * Single source of truth for every name, date, time and place on the site.
 * The calendar file, page metadata, share text and all scenes read from here.
 */
export const eventDetails = {
  couple: {
    partnerOne: { first: 'Varshinee', last: '', full: 'Varshinee' },
    partnerTwo: { first: 'Dheeraj', last: '', full: 'Dheeraj' },
    short: 'Varshinee & Dheeraj',
    monogram: { left: 'V', right: 'D' },
  },

  
  /** The couple's portraits, shown just after the invitation card. Save the pictures at these paths in public/ */
  couplePhotos: {
    bride: { src: '/couple/bride.jpeg', label: 'The Bride' },
    groom: { src: '/couple/groom.jpeg', label: 'The Groom' },
  },

  /** The bride's parents — shown at the top of the invitation card, above the couple's names */
  hosts: {
    names: ['Smt. Duddi KAVITHA', 'Duddi MAHENDRA PRASAD'],
    line: 'Invites on Occasion of Engagement of their Daughter',
  },

  eventName: 'Engagement Ceremony',

  date: {
    iso: '2026-11-26',
    weekday: 'Thursday',
    day: '26',
    month: 'November',
    year: '2026',
    /** For the seal ring and compact displays */
    dotted: '26 · 11 · 2026',
  },

  time: {
    start: { hour: 10, minute: 0 },
    end: { hour: 12, minute: 0 },
    display: '10:00 AM – 12:00 PM',
    timezone: 'Asia/Kolkata',
    utcOffset: '+05:30',
  },

  venue: {
    name: 'RR Mini Convention Centre',
    mapsUrl: 'https://maps.app.goo.gl/ea5c6M7z8bV3u6Dm7',
    /** Save the ORIGINAL QR image supplied by the family at public/venue-qr.png */
    qrImage: '/venue-qr.png',
  },

  food: 'Lunch to follow',

  wording: {
    families: 'Together with their families',
    inviteLead: 'We joyfully invite you',
    inviteRest: 'to celebrate the engagement of',
    opening: 'Two hearts, one beautiful beginning...',
    concept: 'Two Souls. One Sacred Beginning.',
    journey: 'As they begin their beautiful journey of love, togetherness, and forever.',
    blessing: 'Your presence and blessings will make our celebration even more special.',
    closing: 'With Love, Together With Our Families',
    rings: ['Two Hearts.', 'One Beautiful Beginning.', 'Forever Starts Here.'],
    venueHeading: 'The Celebration Awaits',
  },

  meta: {
    title: 'Varshinee & Dheeraj | Engagement Invitation',
    description:
      'Together with their families, Varshinee Duddi and Dheeraj Naidu Amudala joyfully invite you to their engagement celebration on 26 November 2026.',
    themeColor: '#241A18',
  },
} as const

export type EventDetails = typeof eventDetails

const pad = (n: number) => String(n).padStart(2, '0')

/** "20261126T100000" style local stamps used by calendar links */
export function localStamp(t: { hour: number; minute: number }) {
  return `${eventDetails.date.iso.replaceAll('-', '')}T${pad(t.hour)}${pad(t.minute)}00`
}

/** The ceremony start as a real Date (timezone-correct) */
export function ceremonyStart() {
  const { hour, minute } = eventDetails.time.start
  return new Date(`${eventDetails.date.iso}T${pad(hour)}:${pad(minute)}:00${eventDetails.time.utcOffset}`)
}

export function shareText() {
  const e = eventDetails
  return `${e.wording.families}, ${e.couple.partnerOne.full} & ${e.couple.partnerTwo.full} joyfully invite you to their engagement — ${e.date.weekday}, ${e.date.day} ${e.date.month} ${e.date.year}, ${e.time.display}, ${e.venue.name}.`
}
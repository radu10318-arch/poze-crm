import { google } from 'googleapis'

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  )
}

export function getAuthUrl() {
  const oauth2Client = getOAuthClient()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent',
  })
}

export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string,
  event: {
    title: string
    date: string
    startTime: string
    endTime?: string
    location?: string
    description?: string
  }
) {
  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const startDateTime = `${event.date}T${event.startTime}:00`
  const endDateTime = event.endTime
    ? `${event.date}T${event.endTime}:00`
    : `${event.date}T${event.startTime}:00`

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: event.title,
      location: event.location,
      description: event.description,
      start: { dateTime: startDateTime, timeZone: 'Europe/Bucharest' },
      end: { dateTime: endDateTime, timeZone: 'Europe/Bucharest' },
    },
  })

  return response.data.id
}

export async function updateCalendarEvent(
  accessToken: string,
  refreshToken: string,
  googleEventId: string,
  event: {
    title: string
    date: string
    startTime: string
    endTime?: string
    location?: string
  }
) {
  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  await calendar.events.update({
    calendarId: 'primary',
    eventId: googleEventId,
    requestBody: {
      summary: event.title,
      location: event.location,
      start: { dateTime: `${event.date}T${event.startTime}:00`, timeZone: 'Europe/Bucharest' },
      end: { dateTime: `${event.date}T${event.endTime || event.startTime}:00`, timeZone: 'Europe/Bucharest' },
    },
  })
}

export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string,
  googleEventId: string
) {
  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId })
}

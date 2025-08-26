import { google } from "googleapis";
import * as dotenv from "dotenv";

dotenv.config();

export const getCalendarClient = async () => {
  // Load credentials from env
  const credentials = JSON.parse(process.env.GOOGLE_TOKEN_CALENDER_KEYS);
  const token = JSON.parse(process.env.GOOGLE_TOKEN_CALENDER_LOCAL);

  const { client_id, client_secret } = credentials.installed;

  // OAuth2 client
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    "urn:ietf:wg:oauth:2.0:oob"
  );

  // Set token from env
  oAuth2Client.setCredentials(token);

  // Return Google Calendar client
  return google.calendar({ version: "v3", auth: oAuth2Client });
};

import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

// ES module replacements for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const CREDENTIALS_PATH = path.join(__dirname, "credentials-calender.json");
const TOKEN_PATH = path.join(__dirname, "token.json");

// Calendar scope
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

const run = async () => {
  // Load credentials
  const content = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
  const credentials = JSON.parse(content);
  const { client_secret, client_id } = credentials.installed; // Desktop app

  // Create OAuth2 client
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, "urn:ietf:wg:oauth:2.0:oob");

  // Generate auth URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("Authorize this app by visiting this url:\n", authUrl);

  // Read code from terminal
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("\nEnter the code from that page here: ", async (code) => {
    try {
      const { tokens } = await oAuth2Client.getToken(code.trim());
      oAuth2Client.setCredentials(tokens);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
      console.log("\n✅ Token stored to", TOKEN_PATH);
    } catch (err) {
      console.error("Error retrieving access token:", err);
    } finally {
      rl.close();
    }
  });
};

run();

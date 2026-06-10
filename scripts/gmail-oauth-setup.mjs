#!/usr/bin/env node
/**
 * One-time helper to obtain a Gmail API refresh token for DigiCard.
 *
 * Prerequisites:
 * - Gmail API enabled in Google Cloud
 * - OAuth client (Web application) with redirect URI:
 *   http://localhost:3333/oauth2callback
 *
 * Usage:
 *   GMAIL_CLIENT_ID=... GMAIL_CLIENT_SECRET=... npm run gmail:setup
 */

import http from 'node:http';
import { URL } from 'node:url';

const PORT = 3333;
const REDIRECT_PATH = '/oauth2callback';
const REDIRECT_URI = `http://localhost:${PORT}${REDIRECT_PATH}`;
const SCOPE = 'https://www.googleapis.com/auth/gmail.send';

const clientId = process.env.GMAIL_CLIENT_ID?.trim();
const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();

if (!clientId || !clientSecret) {
    console.error('\nMissing GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET.');
    console.error('Create a Web application OAuth client in Google Cloud, then run:\n');
    console.error('  GMAIL_CLIENT_ID="your-client-id" GMAIL_CLIENT_SECRET="your-client-secret" npm run gmail:setup\n');
    process.exit(1);
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', clientId);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPE);
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');
authUrl.searchParams.set('include_granted_scopes', 'true');

function page(title, body) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:Inter,Arial,sans-serif;padding:24px;line-height:1.5;">${body}</body></html>`;
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);

    if (url.pathname !== REDIRECT_PATH) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
    }

    const error = url.searchParams.get('error');
    if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(page('Authorization failed', `<h1>Authorization failed</h1><p>${error}</p>`));
        server.close();
        return;
    }

    const code = url.searchParams.get('code');
    if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(page('Missing code', '<h1>Missing authorization code</h1>'));
        server.close();
        return;
    }

    try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            })
        });

        const tokens = await tokenResponse.json();
        if (!tokenResponse.ok || !tokens.refresh_token) {
            console.error('Token exchange failed:', tokens);
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(page(
                'Token exchange failed',
                '<h1>Could not get refresh token</h1><p>Try again with <code>prompt=consent</code> (this script already does). If you previously authorized this app, revoke access in your Google Account security settings and rerun.</p>'
            ));
            server.close();
            return;
        }

        console.log('\nSuccess! Add these to Webflow Cloud environment variables:\n');
        console.log(`GMAIL_CLIENT_ID=${clientId}`);
        console.log(`GMAIL_CLIENT_SECRET=${clientSecret}`);
        console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log('GMAIL_FROM_EMAIL=you@sojern.com');
        console.log('GMAIL_FROM_NAME=Sojern DigiCard\n');

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(page(
            'Gmail connected',
            '<h1>Gmail connected</h1><p>Check your terminal for the <strong>GMAIL_REFRESH_TOKEN</strong> and other env vars to copy into Webflow Cloud.</p><p>You can close this tab.</p>'
        ));
    } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error');
    } finally {
        server.close();
    }
});

server.listen(PORT, () => {
    console.log('\nSojern DigiCard — Gmail OAuth setup\n');
    console.log('1. Sign in with your @sojern.com Google Workspace account');
    console.log('2. Approve send-only Gmail access');
    console.log('3. Copy the refresh token printed in this terminal\n');
    console.log(`Open this URL in your browser:\n\n${authUrl.toString()}\n`);
});

import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "@shared/schema";
import { storage } from "./storage";
import type { AuthenticatedUser } from "./simple-auth";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback';

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code: string): Promise<string> {
  const tokenResponse = await fetch('https://github.com/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_CALLBACK_URL,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    throw new Error(`GitHub token error: ${tokenData.error_description || tokenData.error}`);
  }

  return tokenData.access_token;
}

/**
 * Get GitHub user data from access token
 */
async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!userResponse.ok) {
    throw new Error(`GitHub API error: ${userResponse.statusText}`);
  }

  const userData = await userResponse.json();

  // If email is not public, fetch from emails endpoint
  if (!userData.email) {
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (emailsResponse.ok) {
      const emails = await emailsResponse.json();
      const primaryEmail = emails.find((e: any) => e.primary && e.verified);
      if (primaryEmail) {
        userData.email = primaryEmail.email;
      }
    }
  }

  return userData;
}

/**
 * Find or create user from GitHub data
 */
async function findOrCreateGitHubUser(githubUser: GitHubUser): Promise<AuthenticatedUser> {
  const db = getDb();

  // Try to find existing user by GitHub ID or email
  const email = githubUser.email || `${githubUser.login}@github.placeholder`;

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));

  if (existingUser) {
    console.log('[github-auth] ✅ Existing user found:', email);
    return {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
    };
  }

  // Create new user
  const name = githubUser.name || githubUser.login;
  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email: email.toLowerCase(),
      password: '', // No password for OAuth users
    })
    .returning();

  console.log('[github-auth] ✅ New GitHub user created:', email);

  // Initialize RPG data for new user
  try {
    await storage.createPlayerStats(newUser.id);
    console.log('[github-auth] ✅ Player stats initialized');

    const allSpecies = await storage.getCreatureSpecies();
    if (allSpecies.length > 0) {
      const starterSpecies = allSpecies[0];
      const wisMod = Math.floor((starterSpecies.baseWis - 10) / 2);
      const maxHp = (1 * 5) + (1 * Math.max(0, wisMod));

      await storage.createUserCreature({
        userId: newUser.id,
        speciesId: starterSpecies.id,
        level: 1,
        experience: 0,
        hp: maxHp,
        currentHp: maxHp,
        str: starterSpecies.baseStr,
        dex: starterSpecies.baseDex,
        wis: starterSpecies.baseWis,
        isInParty: true,
        partyPosition: 1,
      });
      console.log('[github-auth] ✅ Starter creature given:', starterSpecies.name);
    }
  } catch (error) {
    console.error('[github-auth] ⚠️  Failed to initialize RPG data:', error);
  }

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
  };
}

/**
 * Handle GitHub OAuth initiation
 */
function handleGitHubLogin(req: Request, res: Response) {
  if (!GITHUB_CLIENT_ID) {
    return res.status(500).json({
      error: 'GitHub OAuth not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in environment.'
    });
  }

  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', GITHUB_CALLBACK_URL);
  authUrl.searchParams.set('scope', 'read:user user:email');
  authUrl.searchParams.set('state', Math.random().toString(36).substring(7));

  res.redirect(authUrl.toString());
}

/**
 * Handle GitHub OAuth callback
 */
async function handleGitHubCallback(req: Request, res: Response) {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error('[github-auth] OAuth error:', error);
      return res.redirect('/?error=github_auth_denied');
    }

    if (!code || typeof code !== 'string') {
      return res.redirect('/?error=github_auth_no_code');
    }

    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(code);

    // Get GitHub user data
    const githubUser = await getGitHubUser(accessToken);

    // Find or create user in database
    const user = await findOrCreateGitHubUser(githubUser);

    // Create session
    req.session.user = user;
    req.user = user;

    console.log('[github-auth] ✅ User authenticated via GitHub:', user.email);
    console.log('[github-auth] Session ID:', req.sessionID);

    // Redirect to app
    res.redirect('/');
  } catch (error) {
    console.error('[github-auth] Callback error:', error);
    res.redirect('/?error=github_auth_failed');
  }
}

/**
 * Configure GitHub OAuth authentication
 */
export function configureGitHubAuth(app: Express) {
  console.log("[github-auth] Configuring GitHub OAuth");

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    console.warn("[github-auth] ⚠️  GitHub OAuth not fully configured. Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET");
    console.warn("[github-auth] GitHub login will not be available");
    return;
  }

  // GitHub OAuth routes
  app.get("/api/auth/github", handleGitHubLogin);
  app.get("/api/auth/github/callback", handleGitHubCallback);

  console.log("[github-auth] ✅ GitHub OAuth configured");
  console.log("[github-auth] Callback URL:", GITHUB_CALLBACK_URL);
}

import { Request, Response } from 'express';
import { verifyMagicLinkToken, hashTokenId, parseToken } from '../../utils/hmac_token.js';
import { consumeToken } from '../../models/onboarding_tokens.js';
import { getPracticeById } from '../../models/practices.js';
import { getSettingsByPracticeId } from '../../models/settings.js';
import { insertEvent } from '../../models/events.js';
import { HttpError } from '../../utils/errors.js';

export async function GET(req: Request, res: Response) {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ error: 'Token is required', success: false });
  }

  // Parse the token to get practice ID first
  const parsed = parseToken(token);
  if (!parsed) {
    await insertEvent({
      type: 'onboarding_token_invalid',
      actor: 'system',
      payload_json: { token: token.substring(0, 10) + '...' }
    });
    return res.status(401).json({ error: 'Invalid token', success: false });
  }

  // Verify the token with the correct practice ID
  const verification = verifyMagicLinkToken(token, parsed.practiceId);
  if (!verification.valid) {
    const errorCode = verification.error === 'expired' ? 410 : 401;
    const errorMessage = verification.error === 'expired' ? 'Token expired' : 'Invalid token';

    // Log the event
    await insertEvent({
      type: verification.error === 'expired' ? 'onboarding_token_expired' : 'onboarding_token_invalid',
      actor: 'system',
      payload_json: { token: token.substring(0, 10) + '...' }
    });

    return res.status(errorCode).json({ error: errorMessage, success: false });
  }

  const practiceId = verification.practiceId!;
  const tokenId = verification.tokenId!;

  // Consume the token atomically
  const consumeResult = await consumeToken(hashTokenId(tokenId));
  if (!consumeResult.success) {
    await insertEvent({
      practice_id: practiceId,
      type: 'onboarding_token_reused',
      actor: 'system',
      payload_json: { tokenId: tokenId }
    });
    return res.status(401).json({ error: 'Token already used', success: false });
  }

  // Fetch practice and settings data
  const practice = await getPracticeById(practiceId);
  if (!practice) {
    await insertEvent({
      practice_id: practiceId,
      type: 'onboarding_error',
      actor: 'system',
      payload_json: { error: 'Practice not found', tokenId: tokenId }
    });
    return res.status(404).json({ error: 'Practice not found', success: false });
  }

  const settings = await getSettingsByPracticeId(practiceId);
  if (!settings) {
    await insertEvent({
      practice_id: practiceId,
      type: 'onboarding_error',
      actor: 'system',
      payload_json: { error: 'Settings not found', tokenId: tokenId }
    });
    return res.status(404).json({ error: 'Settings not found', success: false });
  }

  // Log onboarding started event
  await insertEvent({
    practice_id: practiceId,
    type: 'onboarding_started',
    actor: 'system',
    payload_json: { tokenId: tokenId }
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const redirectUrl = `${frontendUrl}/onboard/${token}`;

  // Respond based on Accept header
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(200).json({
      success: true,
      practice,
      settings,
      redirect_url: redirectUrl
    });
  } else {
    return res.redirect(302, redirectUrl);
  }
}

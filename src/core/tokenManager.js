import jwt from 'jsonwebtoken';
import logger from '../core/logger.js';
import { getJwtConfig } from '../clients/index.js';

// Get cached JWT config (now synchronous)
function getCachedJwtConfig() {
  return getJwtConfig();
}

// --- Stateless JWT helpers ---
export function signToken(payload, expiresIn) {
  const jwtConfig = getCachedJwtConfig();
  // Use configured expiration if not explicitly provided
  const tokenExpiration = expiresIn || `${jwtConfig.expiration}s`;
  
  // Build options - only add issuer/audience if not already in payload
  const options = { expiresIn: tokenExpiration };
  if (!payload.iss) {
    options.issuer = jwtConfig.issuer;
  }
  if (!payload.aud) {
    options.audience = jwtConfig.audience;
  }
  
  return jwt.sign(payload, jwtConfig.secret, options);
}

export function verifyToken(token) {
  try {
    const jwtConfig = getCachedJwtConfig();
    return jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
  } catch {
    return null;
  }
}

// --- Token issuing helpers ---
/**
 * Issues a JWT access token following industry standards (RFC 7519)
 * Returns the token string.
 */
export function issueJwtToken(req, res, user) {
  logger.debug('Issuing JWT for user', {
    operation: 'issue_jwt',
    userId: user._id,
    traceId: req.traceId,
    spanId: req.spanId,
  });

  const jwtConfig = getCachedJwtConfig();

  // Standard JWT claims (RFC 7519)
  const payload = {
    // Standard claims
    sub: user._id.toString(), // Subject (user ID)
    iss: jwtConfig.issuer, // Issuer
    aud: jwtConfig.audience, // Audience
    iat: Math.floor(Date.now() / 1000), // Issued at
    // exp will be set by signToken via expiresIn option

    // Custom claims
    email: user.email,
    name: user.name || `${user.firstName} ${user.lastName}`.trim(),
    roles: user.roles || ['customer'],
    emailVerified: user.isEmailVerified || false,
  };

  const token = signToken(payload); // Use configured expiration

  // Set as HTTP-only cookie for web clients
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: jwtConfig.expiration * 1000, // Convert seconds to milliseconds
  });

  return token;
}

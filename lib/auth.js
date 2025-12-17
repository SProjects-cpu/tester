import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function getAuthUser(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

export function requireAuth(handler) {
  return async (request, context) => {
    const user = getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Add user to request context
    request.user = user;
    return handler(request, context);
  };
}

export function requireRole(roles) {
  return (handler) => {
    return async (request, context) => {
      const user = getAuthUser(request);
      
      if (!user) {
        return NextResponse.json(
          { message: 'Unauthorized' },
          { status: 401 }
        );
      }

      if (!roles.includes(user.role)) {
        return NextResponse.json(
          { message: 'Forbidden' },
          { status: 403 }
        );
      }

      request.user = user;
      return handler(request, context);
    };
  };
}

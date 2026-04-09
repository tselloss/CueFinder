import { authService } from '@cuefinder/api/auth';

export const getToken = authService.getToken;
export const clearAuth = authService.clearAuth;
export const verifyToken = authService.verifyToken;
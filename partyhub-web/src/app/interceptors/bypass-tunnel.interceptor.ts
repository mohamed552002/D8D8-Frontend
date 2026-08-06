import { HttpInterceptorFn } from '@angular/common/http';

export const bypassTunnelInterceptor: HttpInterceptorFn = (req, next) => {
  const cloned = req.clone({
    setHeaders: {
      'Bypass-Tunnel-Reminder': 'true'
    }
  });
  return next(cloned);
};

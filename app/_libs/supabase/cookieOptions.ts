export const COOKIE_OPTIONS = {
   //JSで読めなくなる
    httpOnly: true,
   // 本番環境ではHTTPS通信のみCookie送信
    secure: process.env.NODE_ENV === "production",
   // CSRF緩和
    sameSite: "lax" as const,
  };
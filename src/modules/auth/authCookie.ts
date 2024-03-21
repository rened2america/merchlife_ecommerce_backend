import jwt from "jsonwebtoken";

class AuthCookie {
  getAccessCode = (accessToken: string) => {
    const accessCode = jwt.decode(accessToken);
    return accessCode;
  };
  getRefreshCode = () => {};

  getAccessCodeOptions = () => {};
  getRefreshTokenOptions = () => {};

  getAccessToken = (accessCode: string) => {
    const encryptedAccessCode = accessCode;
    const jwtEncryptedAccessCode = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 100000,
        code: encryptedAccessCode,
      },
      process.env.JWT_SECRET_KEY!
    );
    return jwtEncryptedAccessCode;
  };
  getRefreshToken = (refreshCode: string) => {
    const encryptedRefreshCode = refreshCode;
    const jwtEncryptedRefreshCode = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 100000,
        code: encryptedRefreshCode,
      },
      process.env.JWT_SECRET_KEY!
    );
    return jwtEncryptedRefreshCode;
  };
}

export default new AuthCookie();

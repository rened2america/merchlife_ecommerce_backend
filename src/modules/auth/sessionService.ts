import jwt, { JwtPayload } from "jsonwebtoken";
// import { Session } from "@prisma/client";
import SessionDAO from "./SessionDAO";
import { generateCode } from "../../utils/generateCode";

const SECONDS_TO_MINUTE = 60;
const MINUTE_TO_HOUR = SECONDS_TO_MINUTE * 60;
const HOUR_TO_DAY = MINUTE_TO_HOUR * 24;
const DAY_TO_MONTH = HOUR_TO_DAY * 30;
const DAY_TO_YEAR = DAY_TO_MONTH * 12;
console.log(DAY_TO_YEAR);
class SessionService {
  getByArtistId = async (artistId: number): Promise<any | null> => {
    const session = await SessionDAO.getByArtistId(artistId);
    return session;
  };
  isValid = async (
    accessToken: JwtPayload,
    refreshToken: JwtPayload,
    accessTokenNoDecode: string,
    refreshTokenNoDecode: string
  ) => {
    if (!accessToken.exp || !refreshToken.exp) return false;
    if (!accessToken.code || !refreshToken.code) return false;

    const currentTime = new Date().getTime() / 1000;
    console.log(refreshToken.exp);
    const isValidRefreshToken = refreshToken.exp > currentTime;
    console.log("isValidRefreshToken", isValidRefreshToken);
    if (!isValidRefreshToken) {
      return false;
    }
    const accessCode = accessToken.code;
    const refreshCode = refreshToken.code;

    const session = await SessionDAO.getByAccessTokenAndRefreshToken(
      accessCode,
      refreshCode
    );

    if (!session) {
      return false;
    }
    const isValidAccessToken = accessToken.exp > currentTime;

    if (!isValidAccessToken) {
      const newAccessCode = generateCode();
      const newAccessToken = this.getAccessToken(newAccessCode);
      return {
        accessToken: newAccessToken,
        refreshToken: refreshTokenNoDecode,
      };
    }
    return {
      accessToken: accessTokenNoDecode,
      refreshToken: refreshTokenNoDecode,
      artistId: session.artistId,
    };
  };
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

  deleteByAccessToken = async (accessToken: string) => {
    const accessTokenDecode = await this.verifyToken(accessToken);
    await SessionDAO.deleteByAccessCode(accessTokenDecode.code);
  };

  verifyToken = async (accessToken: string) => {
    if (accessToken) {
      try {
        return jwt.verify(
          accessToken,
          process.env.JWT_SECRET_KEY!
        ) as JwtPayload;
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  deleteById = async (id: number) => {
    await SessionDAO.deleteById(id);
  };
}

export default new SessionService();

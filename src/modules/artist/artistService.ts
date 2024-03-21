import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
// import { Artist } from "@prisma/client";
import artistDAO from "./artistDAO";

class ArtistService {
  getArtistByEmail = async (email: string): Promise<any | null> => {
    const artistExist: any | null = await artistDAO.getArtistByEmail(email);
    return artistExist;
  };

  artistPasswordIsValid = async (
    password: string,
    passwordFromDb: string
  ): Promise<boolean> => {
    const isValidPassword = await bcrypt.compare(password, passwordFromDb);
    return isValidPassword;
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
}

export default new ArtistService();

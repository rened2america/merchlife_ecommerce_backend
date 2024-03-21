import jwt from "jsonwebtoken";
import { Response, Request, NextFunction } from "express";
import sessionService from "../modules/auth/sessionService";
import { prisma } from "../database/initialConfig";

export const authValidate: any = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // // Validar si el token ya expiro
    // // validad si el accesCode es valido
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken || !refreshToken) {
      res.status(401).json({ message: "User not logged in" });
      return;
    }
    // //"emDgcBoq4Vv_w2ecS-Egz"
    // jwt.verify(refreshToken, "emDgcBoq4Vv_w2ecS-Egz");
    // jwt.verify(accessToken, "emDgcBoq4Vv_w2ecS-Egz");
    const accessTokenDecode = jwt.decode(accessToken);
    const refreshTokenDecode = jwt.decode(refreshToken);
    console.log(accessTokenDecode, refreshTokenDecode);

    console.log("String");
    console.log();
    if (
      !accessTokenDecode ||
      typeof accessTokenDecode === "string" ||
      !refreshTokenDecode ||
      typeof refreshTokenDecode === "string"
    ) {
      res.status(401).json({ message: "User not logged in" });
      return;
    }
    console.log("after String");

    const sessionIsValid = await sessionService.isValid(
      accessTokenDecode,
      refreshTokenDecode,
      accessToken,
      refreshToken
    );
    if (sessionIsValid) {
      console.log("sessionIsValid", sessionIsValid);
      const artist = await prisma.artist.findUnique({
        where: {
          id: sessionIsValid.artistId,
        },
      });
      if (!artist?.emailConfirmation) {
        res.status(403).json({ message: "confirm email" });
      }

      if (!artist?.verifyArtist) {
        res.status(403).json({ message: "verify artist" });
      }
      if (sessionIsValid.artistId) {
        req.user = {
          artistId: sessionIsValid.artistId,
        };
      }
      res
        .cookie("accessToken", sessionIsValid.accessToken, {
          httpOnly: true,
          sameSite: "none" as const,
          secure: true,
        })
        .cookie("refreshToken", sessionIsValid.refreshToken, {
          httpOnly: true,
          sameSite: "none" as const,
          secure: true,
        });

      return next();
    }
    res.status(401).send("Hubo un problema");
  } catch (error) {
    console.log(error);
  }
};

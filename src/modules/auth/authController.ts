import { Request, Response } from "express";
import { withErrorHandlingDecorator } from "../../decorators/withErrorHandlingDecorator";
import jwt from "jsonwebtoken";

import { ARTISTI_LOGIN } from "./authResponse";
import authCookie from "./authCookie";
import SessionDAO from "./SessionDAO";
import { CreateSession, SessionCreated } from "./authDTO";
import artistService from "../artist/artistService";
import sessionService from "./sessionService";
import { generateCode } from "../../utils/generateCode";
import authService from "./authService";
const login = async (req: Request, res: Response) => {
  console.log(req.body.email, req.body.password);

  const payload = {
    email: req.body.email,
    password: req.body.password,
  };

  const artistExist = await artistService.getArtistByEmail(payload.email);
  if (!artistExist) {
    res.status(404).json({ meesage: "usuario no encontrado" });
    return;
  }

  const passwordIsValid = await artistService.artistPasswordIsValid(
    payload.password,
    artistExist.password
  );
  if (!passwordIsValid) {
    res.status(404).json({ meesage: "password incorrecta" });
    return;
  }

  const sessionExist = await sessionService.getByArtistId(artistExist.id);
  if (sessionExist) {
    const refreshTokenJwt = jwt.decode(sessionExist.refreshToken);
    const accessTokenJwt = jwt.decode(sessionExist.accessToken);

    if (!refreshTokenJwt || !accessTokenJwt) {
      return;
    }

    if (
      typeof refreshTokenJwt === "string" ||
      typeof accessTokenJwt === "string"
    ) {
      return;
    }
    const sessionIsValid = await sessionService.isValid(
      accessTokenJwt,
      refreshTokenJwt,
      sessionExist.accessToken,
      sessionExist.refreshToken
    );

    console.log("2sessionIsValid", sessionIsValid);
    if (sessionIsValid) {
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
        })
        .status(ARTISTI_LOGIN.status)
        .json({
          meesage: ARTISTI_LOGIN.message,
          extraDatos: "Se retornaron las cookies",
          sessionIsValid,
        });
      return;
    } else {
      await sessionService.deleteById(sessionExist.id);
    }
  }

  const accessCode = generateCode();
  const refreshCode = generateCode();
  const accessToken = authCookie.getAccessToken(accessCode);
  const refreshToken = authCookie.getRefreshToken(refreshCode);

  const session: CreateSession = {
    artistId: artistExist.id,
    accessCode,
    refreshCode,
    accessToken,
    refreshToken,
  };

  const sessionCreated: SessionCreated = await SessionDAO.create(session);
  console.log(sessionCreated);

  const accessCodeR = authCookie.getAccessCode(accessToken);

  const responseData = {
    accessCodeR,
    accessCode,
    refreshCode,
    refreshToken,
    accessToken,
  };
  res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "none" as const,
      secure: true,
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none" as const,
      secure: true,
    })
    .status(ARTISTI_LOGIN.status)
    .json({ meesage: ARTISTI_LOGIN.message, ...responseData });
};

const signout = async (req: Request, res: Response) => {
  const accessToken = req.cookies.accessToken;
  await sessionService.deleteByAccessToken(accessToken);

  res.clearCookie("accessToken").clearCookie("refreshToken").status(200).json({
    message: "Session Eliminada",
  });
};

const createAccount = async (req: Request, res: Response) => {
  const user = req.body;
  // const user = {
  //   name: "Rene Alberto Meza Escamilla",
  //   email: "rame.rmeza@gmail.com",
  //   password: "emar16198",
  // };

  const password = user.password;
  const passwordToSave = await authService.encryptPassword(password);
  const newUser = await authService.createUser({
    ...user,
    password: passwordToSave,
  });

  // const sendEmail = await authService.sendEmailConfirmation(newUser.email);
  // const sendEmailVerifyArtist = await authService.sendEmailVerifyArtist(
  //   newUser.email,
  //   newUser.name
  // );
  res.status(201).json({
    message: "user created",
    newUser,
    // sendEmail,
    // sendEmailVerifyArtist,
  });
};

const userIsLogin = async (req: Request, res: Response) => {
  res.status(200).json({
    message: "user is login",
  });
};

const sendEmailTest = async (req: Request, res: Response) => {
  await authService.sendEmailTest();

  res.status(200).json({
    message: "Mail Send",
  });
};

const loginWithDecorators = withErrorHandlingDecorator(login);
const signoutWithDecorators = withErrorHandlingDecorator(signout);
const createAccountWithDecorators = withErrorHandlingDecorator(createAccount);
const userIsLoginWithDecorators = withErrorHandlingDecorator(userIsLogin);
const sendEmailTestWithDecorators = withErrorHandlingDecorator(sendEmailTest);

export const authController = {
  login: loginWithDecorators,
  signout: signoutWithDecorators,
  createAccount: createAccountWithDecorators,
  userIsLogin: userIsLoginWithDecorators,
  sendEmailTest: sendEmailTestWithDecorators,
};

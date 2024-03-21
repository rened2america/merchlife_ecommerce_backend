import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { withErrorHandlingDecorator } from "../../decorators/withErrorHandlingDecorator";
import { connectionAws } from "../../utils/configAws";
import artistDAO from "./artistDAO";
import { prisma } from "../../database/initialConfig";
import artistService from "./artistService";
const uploadAvatar = async (req: Request, res: Response) => {
  const artistId = req.user.artistId;
  //@ts-ignore
  const bufferAvatar = req.file.buffer;
  const getArtist = await artistDAO.getArtistById(artistId);
  const s3 = connectionAws();
  const paramsImgLogo = {
    Bucket: process.env.BUCKET_IMG,
    //@ts-ignore
    Key: `${Date.now().toString()}-${getArtist.name}-avatar`,
    Body: bufferAvatar,
    ContentType: "image/png",
  };
  //@ts-ignore
  const imgAvatarURL = await s3.upload(paramsImgLogo).promise();
  await artistDAO.updateArtist(artistId, { avatar: imgAvatarURL.Location });
  res.status(200).json({
    message: "Updated image",
  });
};
const uploadBanner = async (req: Request, res: Response) => {
  const artistId = req.user.artistId;
  //@ts-ignore
  const bufferBanner = req.file.buffer;
  const getArtist = await artistDAO.getArtistById(artistId);
  const s3 = connectionAws();
  const paramsImgLogo = {
    Bucket: process.env.BUCKET_IMG,
    //@ts-ignore
    Key: `${Date.now().toString()}-${getArtist.name}-banner`,
    Body: bufferBanner,
    ContentType: "image/png",
  };
  //@ts-ignore
  const imgBannerURL = await s3.upload(paramsImgLogo).promise();
  await artistDAO.updateArtist(artistId, { banner: imgBannerURL.Location });
  res.status(200).json({
    message: "Updated Cover",
  });
};

const getProfile = async (req: Request, res: Response) => {
  const artistId = req.user.artistId;
  const getArtist = await artistDAO.getArtistById(artistId);

  res.status(200).json({
    message: "get profile",
    getArtist,
  });
};

const updateProfile = async (req: Request, res: Response) => {
  const artistId = req.user.artistId;
  const profileToUpdate = req.body;

  const updatedArtist = await artistDAO.updateArtist(artistId, {
    ...profileToUpdate,
  });

  res.status(200).json({
    message: "updateProfile profile",
    updatedArtist,
  });
};

const getAll = async (req: Request, res: Response) => {
  //@ts-ignore
  const page = parseInt(req.query.page || "1");
  const limit = 24;

  const artist = await artistDAO.getAll(page, limit);

  res.status(200).json({
    message: "updateProfile profile",
    artist: artist?.artists ? artist.artists : [],
    count: artist?.count ? artist.count : 1,
  });
};

const getProfileAndProducts = async (req: Request, res: Response) => {
  //@ts-ignore
  const page = parseInt(req.query.page || "1");
  //@ts-ignore
  console.log(req.params);
  // const artistId = parseInt(req.params.id || "1");
  const artistName = req.params.id.replace(/-/g, " ");

  const limit = 12;

  const artist = await artistDAO.getProfileAndProducts(artistName, page, limit);

  res.status(200).json({
    message: "get artist store",
    artist: artist?.profile ? artist.profile : {},
    count: artist?.count ? artist.count : 1,
    products: artist.products ? artist.products : [],
  });
};

const tokenConfirm = async (req: Request, res: Response) => {
  const token = req.params.token;
  const userData = await artistService.verifyToken(token);
  if (!userData) {
    res.status(404).json({
      message: "token not exist",
    });
    return;
  }
  await prisma.artist.update({
    where: {
      //@ts-ignore
      email: userData.email,
    },
    data: {
      emailConfirmation: true,
    },
  });
  res.status(200).json({
    message: "artist confirm mail",
  });
};

const artistConfirm = async (req: Request, res: Response) => {
  const token = req.params.token;
  const userData = await artistService.verifyToken(token);
  if (!userData) {
    res.status(404).json({
      message: "token not exist",
    });
    return;
  }
  await prisma.artist.update({
    where: {
      //@ts-ignore
      email: userData.email,
    },
    data: {
      verifyArtist: true,
    },
  });
  res.status(200).json({
    message: "verify artist",
  });
};

const uploadAvatarWithDecorators = withErrorHandlingDecorator(uploadAvatar);
const uploadBannerWithDecorators = withErrorHandlingDecorator(uploadBanner);
const getProfileWithDecorators = withErrorHandlingDecorator(getProfile);
const updateProfileWithDecorators = withErrorHandlingDecorator(updateProfile);
const getAllWithDecorators = withErrorHandlingDecorator(getAll);
const getProfileAndProductsWithDecorators = withErrorHandlingDecorator(
  getProfileAndProducts
);
const tokenConfirmWithDecorators = withErrorHandlingDecorator(tokenConfirm);
const artistConfirmWithDecorators = withErrorHandlingDecorator(artistConfirm);

export const artistController = {
  uploadAvatar: uploadAvatarWithDecorators,
  uploadBanner: uploadBannerWithDecorators,
  getProfile: getProfileWithDecorators,
  updateProfile: updateProfileWithDecorators,
  getAll: getAllWithDecorators,
  getProfileAndProducts: getProfileAndProductsWithDecorators,
  tokenConfirm: tokenConfirmWithDecorators,
  artistConfirm: artistConfirmWithDecorators,
};

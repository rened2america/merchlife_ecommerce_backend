// import { Session } from "@prisma/client";
import { prisma } from "../../database/initialConfig";
import { CreateSession, SessionCreated } from "./authDTO";

class SessionDAO {
  create = async (session: CreateSession): Promise<SessionCreated> => {
    console.log("session", session);
    const sessionCreated = await prisma.session.create({
      data: {
        ...session,
      },
    });

    return sessionCreated;
  };

  getByArtistId = async (artistId: number): Promise<any | null> => {
    const session = await prisma.session.findUnique({
      where: {
        artistId,
      },
    });
    return session;
  };

  getByAccessTokenAndRefreshToken = async (
    accessCode: string,
    refreshCode: string
  ): Promise<any | null> => {
    const session = await prisma.session.findUnique({
      where: {
        accessCode,
        refreshCode,
      },
    });
    console.log(session);
    return session;
  };

  deleteByAccessCode = async (accessCode: string) => {
    const isSessionDelete = await prisma.session.delete({
      where: {
        accessCode,
      },
    });

    return isSessionDelete;
  };

  deleteById = async (id: number) => {
    await prisma.session.delete({
      where: {
        id,
      },
    });
  };
}

export default new SessionDAO();

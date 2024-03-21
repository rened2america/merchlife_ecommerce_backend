// import { Artist } from "@prisma/client";
import { prisma } from "../../database/initialConfig";

class ArtistDAO {
  getArtistByEmail = async (email: string): Promise<any | null> => {
    const artist: any | null = await prisma.artist.findUnique({
      where: {
        email,
      },
    });

    return artist;
  };

  getArtistById = async (id: number): Promise<any | null> => {
    const artist: any | null = await prisma.artist.findUnique({
      where: {
        id,
      },
    });

    return artist;
  };
  updateArtist = async (id: number, data: any): Promise<any | null> => {
    const artist: any | null = await prisma.artist.update({
      where: {
        id,
      },
      data,
    });
    return artist;
  };
  getAll = async (
    page: number,
    limit: number
  ): Promise<{ artists: any[]; count: number } | null> => {
    console.log(page);
    const [artists, count] = await prisma.$transaction([
      prisma.artist.findMany(),
      prisma.artist.count(),
    ]);

    return {
      artists: artists,
      count: count,
    };
  };

  getProfileAndProducts = async (id: string, page: number, limit: number) => {
    console.log(id);
    const [products, count, profile] = await prisma.$transaction([
      prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          artist: {
            name: id,
          },
        },
        include: {
          types: true,
        },
      }),
      prisma.product.count(),
      prisma.artist.findFirst({
        where: {
          name: id,
        },
      }),
    ]);

    return {
      products,
      count,
      profile,
    };
  };
}

export default new ArtistDAO();

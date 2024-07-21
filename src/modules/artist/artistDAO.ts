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
  getRandomArtists = async (
    page: number,
    limit: number
  ): Promise<{ artists: any[]; count: number } | null> => {
    console.log(page);
    const ids:Array<{id:number}> = await prisma.$queryRaw`
    SELECT "Artist"."id"
    FROM "Artist" JOIN "Product" ON "Product"."artistId" = "Artist"."id"
    JOIN "_ProductToType" ON "_ProductToType"."A" ="Product"."id"
    JOIN "Type" ON "Type"."id" = "_ProductToType"."B"
    WHERE "Type"."value" NOT IN ('Poster', 'Canvas')
    GROUP BY "Artist"."id"
    HAVING COUNT("Artist"."id") >= 3
    ORDER BY RANDOM()
    LIMIT 5;
  `;
    const artistIdArray = ids.map(artist => artist.id);
    const [artists, count] = await prisma.$transaction([
      prisma.artist.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where:{id:{in:artistIdArray}},
        select: {
          id: true,
          email: true,
          name: true,
          banner:true,
          product: {
            take:3,
            where: {
              types: { some: { value: { notIn: ["Poster", "Canvas"] } } },
            },
            select: {
              id: true,
              title: true,
              types: true,
              description: true,
              design:{take:1},
            },
          },
        },
      }),
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
          types:{some:{value:{notIn:['Poster','Canvas']}}},
          artist: {
            name: id,
          },
        },
        include:{design:{take:1},types:true}
        
      }),
      prisma.product.count({where:{types:{some:{value:{notIn:['Poster','Canvas']}}}}}),
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

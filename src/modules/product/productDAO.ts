import { prisma } from "../../database/initialConfig";

class ProductDAO {
  create = async (data: any) => {
    try {
      const newProduct = await prisma.product.create({
        data,
      });
      return newProduct;
    } catch (error) {
      console.log("localError", error);
      return error;
    }
  };

  getByUser = async (artistId: number) => {
    console.log(artistId);
    const allProducts = await prisma.product.findMany({
      where: {
        artistId,
      },
    });
    return allProducts;
  };

  getAll = async (filters: any, page: any) => {
    const [allProducts, count] = await prisma.$transaction([
      prisma.product.findMany({
        skip: (page.page - 1) * page.limit,
        take: page.limit,
        where: {
          AND: filters,
          // AND: {
          //   artist: {
          //     OR: [
          //       {
          //         name: "Rene Alberto Meza Escamilla",
          //       },
          //       {
          //         name: "Rene Meza",
          //       },
          //     ],
          //   },
          // },
        },
        include: {
          design: true,
          tag: true,
          types: true,
          artist: true,
          group: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.product.count({
        where: {
          AND: filters,
        },
      }),
    ]);
    console.log(count);
    return { products: allProducts, count: count };
  };

  getById = async (
    id: number,
    variant: string,
    size: string,
    product: string
  ) => {
    console.log("getById", id);
    const groupProduct = await prisma.group.findUnique({
      where: {
        id,
      },
      include: {
        artist: {
          select: {
            name: true,
          },
        },
        product: {
          select: {
            types: true,
          },
        },
      },
    });

    const filterProductByGroup = await prisma.product.findFirst({
      where: {
        groupId: groupProduct.id,
        types: {
          some: {
            value: product,
          },
        },
      },
      include: {
        sizes: true,
        colors: true,
        tag: true,
      },
    });

    if (product === "Poster" || product === "Canvas") {
      const filterDesignByProduct = await prisma.design.findFirst({
        where: {
          productId: filterProductByGroup.id,
          size,
        },
      });

      return {
        groupProduct,
        filterProductByGroup,
        filterDesignByProduct,
      };
    }
    const filterDesignByProduct = await prisma.design.findFirst({
      where: {
        productId: filterProductByGroup.id,
        variant,
        size,
      },
    });
    console.log("groupProduct", groupProduct);

    console.log("filterProductByGroup", filterProductByGroup);

    console.log("filterDesignByProduct", filterDesignByProduct);
    // const allProducts = await prisma.product.findUnique({
    //   where: {
    //     id,

    //   },
    //   include: {
    //     group: {
    //       include: {
    //         product: {
    //           select: {
    //             types: true,
    //           },
    //         },
    //       },
    //     },
    //     design: true,
    //     sizes: true,
    //     colors: true,
    //     tag: true,
    //     artist: {
    //       select: {
    //         name: true,
    //       },
    //     },
    //   },
    // });
    console.log("allProducts", groupProduct);
    return {
      groupProduct,
      filterProductByGroup,
      filterDesignByProduct,
    };
  };
}

export default new ProductDAO();

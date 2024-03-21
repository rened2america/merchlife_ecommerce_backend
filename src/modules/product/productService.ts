import productDAO from "./productDAO";

class ProductService {
  create = async (product: any) => {
    const newProduct = await productDAO.create(product);
    return newProduct;
  };
  getByUser = async (artistId: number) => {
    const getProducts = await productDAO.getByUser(artistId);
    return getProducts;
  };
  getAll = async (filters: any, page: any) => {
    const getProducts = await productDAO.getAll(filters, page);
    return getProducts;
  };
  getById = async (id: number, variant: string, size: string, product) => {
    const getProducts = await productDAO.getById(id, variant, size, product);
    return getProducts;
  };
  uploadLogo = async (logo: string, s3: any, productName: string) => {
    const paramsImgLogo = {
      Bucket: process.env.BUCKET_IMG,
      Key: `${Date.now().toString()}-${productName}-logo`,
      Body: Buffer.from(logo, "base64"),
      ContentType: "image/png", // Cambia esto según el tipo de imagen
    };
    const imgLogoURL = await s3.upload(paramsImgLogo).promise();
    return imgLogoURL.Location;
  };

  uploadImages = async (
    images: { imgBuffer: Buffer; color: string }[],
    productName: string,
    s3: any
  ) => {
    const uploadedImages = images.map(async (image) => {
      const paramsImg = {
        Bucket: process.env.BUCKET_IMG,
        Key: `${Date.now().toString()}-${productName}-product-${image.color}`,
        Body: image.imgBuffer,
        ContentType: "image/png", // Cambia esto según el tipo de imagen
      };
      const imgProductURL = await s3.upload(paramsImg).promise();
      return {
        ...image,
        imgProductURL: imgProductURL.Location,
      };
    });

    return Promise.all(uploadedImages);
  };
  transformImagesFromBase64ToBuffer = async (images: any) => {
    return Object.keys(images).map((keyValue: string) => {
      const imgBuffer = Buffer.from(images[keyValue].split(",")[1], "base64");

      return {
        imgBuffer,
        color: keyValue,
      };
    });
  };

  // createProductInStripe = async (
  //   products: any,
  //   stripe: any,
  //   productName: string,
  //   price: number,
  //   sizeOptions: string[]
  // ) => {
  //   const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  //   const productsCreated = products.map(async (product: any) => {
  //     const productsWithSize = sizeOptions.map(async (size) => {
  //       await delay(500);
  //       const newProduct = await stripe.products.create({
  //         name: `${productName}-${product.color}-${size}-product`,
  //         images: [product.imgProductURL],
  //       });

  //       const priceProduct = await stripe.prices.create({
  //         product: newProduct.id,
  //         currency: "usd",
  //         unit_amount: price * 100,
  //       });
  //       return {
  //         size,
  //         ...product,
  //         ...priceProduct,
  //       };
  //     });
  //     return Promise.all(productsWithSize);
  //   });

  //   return Promise.all(productsCreated);
  // };

  createProductInStripe = async (
    products: any,
    stripe: any,
    productName: string,
    price: number,
    sizeOptions: string[]
  ) => {
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));

    const productsCreated = [];
    for (const product of products) {
      const productsWithSize = [];
      await delay(500); // Espera 500 ms antes de cada llamada a la API
      for (const size of sizeOptions) {
        const newProduct = await stripe.products.create({
          name: `${productName}-${product.color}-${size}-product`,
          images: [product.imgProductURL],
        });

        const priceProduct = await stripe.prices.create({
          product: newProduct.id,
          currency: "usd",
          unit_amount: price * 100,
        });

        productsWithSize.push({
          size,
          ...product,
          ...priceProduct,
        });
      }
      productsCreated.push(Promise.all(productsWithSize));
    }

    return Promise.all(productsCreated);
  };
}

export default new ProductService();

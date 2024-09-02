import { Request, Response } from "express";
import { withErrorHandlingDecorator } from "../../decorators/withErrorHandlingDecorator";
import productService from "./productService";
//import { decode } from "base64-arraybuffer"; borrar
// import { Upload } from "@aws-sdk/lib-storage"; borrar
// import { S3Client } from "@aws-sdk/client-s3"; borrar
import { prisma } from "../../database/initialConfig";
import { isJson } from "../../utils/isJson";
import { connectionStripe } from "../../utils/configStripe";
import { connectionAws } from "../../utils/configAws";
import { round } from "mathjs";
import { generateCode } from "../../utils/generateCode";
import artistDAO from "../artist/artistDAO";

import sgMail from "@sendgrid/mail";

const create = async (req: Request, res: Response) => {
  console.log("req body: ",req.body)
  const { x, y, angle, scale, tags, type, groupId } = req.body;
  console.log("Distance x", x);
  console.log("Distance y", y);
  const xDecimal = round(x, 6);
  const yDecimal = round(y, 6);
  const angleDecimal = round(angle, 6);
  const scaleDecimal = round(scale, 6);

  console.log("Distance rounded x", xDecimal);
  console.log("Distance rounded y", yDecimal);
  const productName = req.body.name;
  const productPrice = req.body.price;
  const productSubtitle = req.body.subtitle;
  const productDescription = req.body.description;

  const s3 = connectionAws();
  const stripe = connectionStripe();

  const priceOfProduct = (typeValue: string) => {
    if (typeValue === "Sweatshirt") {
      return 25.99;
    }
    if (typeValue === "Shirt") {
      return 15.99;
    }
    if (typeValue === "Hoodie") {
      return 36.99;
    }
    if (typeValue === "Mug") {
      return 24.99;
    }
  };

  const sizeofProdut = (typeValue: string) => {
    if (typeValue === "Mug") {
      return [
        {
          where: { value: "11 oz" },
          create: { value: "11 oz" },
        },
        {
          where: { value: "15 oz" },
          create: { value: "15 oz" },
        },
      ];
    }

    return [
      {
        where: { value: "S" },
        create: { value: "S" },
      },
      {
        where: { value: "M" },
        create: { value: "M" },
      },
      {
        where: { value: "L" },
        create: { value: "L" },
      },
      {
        where: { value: "XL" },
        create: { value: "XL" },
      },
      {
        where: { value: "2XL" },
        create: { value: "2XL" },
      },
      {
        where: { value: "3XL" },
        create: { value: "3XL" },
      },
      {
        where: { value: "4XL" },
        create: { value: "4XL" },
      },
      {
        where: { value: "5XL" },
        create: { value: "5XL" },
      },
    ];
  };

  // const colorsofProdut = (typeValue: string, selected:any) => {
  //   if (typeValue === "Mug") {
  //     return [
  //       {
  //         where: { value: "White" },
  //         create: { value: "White" },
  //       },
  //     ];
  //   }
  //   // const valueToReturn = selected.filter(()=> {
  //   //   return
  //   // })
  //   return [
  //     {
  //       where: { value: "White" },
  //       create: { value: "White" },
  //     },
  //     {
  //       where: { value: "Beige" },
  //       create: { value: "Beige" },
  //     },
  //     {
  //       where: { value: "Red" },
  //       create: { value: "Red" },
  //     },
  //     {
  //       where: { value: "Blue" },
  //       create: { value: "Blue" },
  //     },
  //     {
  //       where: { value: "Black" },
  //       create: { value: "Black" },
  //     },
  //   ];
  // };
  const colorsofProdut = (typeValue: string, selected: any) => {
    // Si el tipo es "Mug", retorna un array con solo el color "White"
    if (typeValue === "Mug") {
      return [
        {
          where: { value: "White" },
          create: { value: "White" },
        },
      ];
    }

    // Array para almacenar los colores seleccionados
    const colorsToReturn = [];

    // Iterar sobre los colores en 'selected'
    for (const color in selected) {
      // Verificar si el color está seleccionado
      if (selected[color]) {
        // Convertir la clave de 'selected' a formato de texto capitalizado
        const colorCapitalized = color.charAt(0).toUpperCase() + color.slice(1);

        // Agregar el color al array
        colorsToReturn.push({
          where: { value: colorCapitalized },
          create: { value: colorCapitalized },
        });
      }
    }

    return colorsToReturn;
  };

  const imageListFromProduct = (
    typeValue: string,
    images: any,
    selected: any
  ) => {
    if (typeValue === "Mug") {
      return { white: images.white };
    }
    if (!selected.beige) {
      delete images.beige;
    }
    if (!selected.red) {
      delete images.red;
    }
    if (!selected.blue) {
      delete images.blue;
    }
    if (!selected.black) {
      delete images.black;
    }
    return images;
  };

  const sizeOptionsOfProduct = (typeValue: string) => {
    if (typeValue === "Mug") {
      return ["11 oz", "15 oz"];
    }

    return ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
  };

  const logoURL = await productService.uploadLogo(
    req.body.imgLogo,
    s3,
    productName
  );
  const imagesBuffer = await productService.transformImagesFromBase64ToBuffer(
    imageListFromProduct(type, req.body.imgListProduct, req.body.colorsSelected)
  );
  const ImagesUrl = await productService.uploadImages(
    imagesBuffer,
    productName,
    s3
  );
  const productStripe = await productService.createProductInStripe(
    ImagesUrl,
    stripe,
    productName,
    productPrice,
    sizeOptionsOfProduct(type)
  );

  const tagOperations = tags.map((tagValue) => ({
    where: { value: tagValue },
    create: { value: tagValue },
  }));

  const artistId = req.user.artistId;
  console.log("priceOfProduct(type)", priceOfProduct(type));
  console.log("productName", productName);
  console.log("productSubtitle", productSubtitle);
  console.log("productPrice", productPrice);
  console.log("productDescription", productDescription);
  console.log("artistId", artistId);
  console.log("generateCode()", generateCode());
  console.log("tagOperations", tagOperations);
  console.log("types", type);
  console.log("sizeofProdut", sizeofProdut(type));
  console.log("colorsofProdut", colorsofProdut(type, req.body.colorsSelected));

  const newProduct = await productService.create({
    price: productPrice,
    title: productName,
    subtitle: productSubtitle,
    description: productDescription,
    artistId: artistId,
    idGeneral: generateCode(),
    groupId,
    tag: {
      connectOrCreate: tagOperations,
    },
    types: {
      connectOrCreate: {
        where: { value: type },
        create: { value: type },
      },
    },
    sizes: {
      connectOrCreate: sizeofProdut(type),
    },
    colors: {
      connectOrCreate: colorsofProdut(type, req.body.colorsSelected),
    },
  });

  console.log("productStripe", productStripe);

  const productsToDb = productStripe.flat().map((product) => {
    console.log("product", product);

    return {
      //@ts-ignore
      productId: newProduct.id,
      positionX: xDecimal,
      positionY: yDecimal,
      angle: angleDecimal,
      scale: scaleDecimal,
      variant: product.color,
      price: productPrice,
      priceId: product.id,
      url: product.imgProductURL,
      urlLogo: logoURL,
      artistId: artistId,
      size: product.size,
    };
  });
  const createManyDesign = await prisma.design.createMany({
    //@ts-ignore
    data: productsToDb,
    skipDuplicates: true,
  });
  res.status(201).json({
    message: "Producto Creado",
    products: createManyDesign ? createManyDesign : [],
  });
};

const getByUser = async (req: Request, res: Response) => {
  const artistId = req.user.artistId;
  const products = await productService.getByUser(artistId);
  res.status(201).json({ message: "Producto Creado", products: products });
};

const getAll = async (req: Request, res: Response) => {
  // const sortBy = req.query.sortBy || "desc";
  const search = req.query.search || "";
  const filter = req.query.filters || "";
  //@ts-ignore
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const limit = 12;
  //@ts-ignore
  if (isJson(filter)) {
    //@ts-ignore

    const filterParse = JSON.parse(filter);
    const filterEntries: any = Object.entries(filterParse);

    const arrayFilter = filterEntries.map((entry: any) => {
      const newFilter = {};

      if (entry[0] === "artist") {
        //@ts-ignore
        newFilter[entry[0]] = {
          OR: entry[1],
        };
        return newFilter;
      } else {
        newFilter[entry[0]] = {
          some: {
            value: {
              in: entry[1],
            },
          },
        };
      }
      //@ts-ignore

      return newFilter;
    });
    arrayFilter.push({
      title: {
        contains: search,
      },
    });
    console.log(arrayFilter);
    const products = await productService.getAll(arrayFilter, { page, limit });
    res.status(201).json({
      message: "Productos Obtenidos",
      products: products.products,
      count: products.count,
    });
    return;
  } else {
    const arrayFilter = [
      {
        title: {
          contains: search,
        },
      },
    ];
    const products = await productService.getAll(arrayFilter, {
      page,
      limit,
    });
    res.status(201).json({
      message: "Productos Obtenidos",
      products: products.products,
      count: products.count,
    });
  }
};

const getById = async (req: Request, res: Response) => {
  const productId: number = parseInt(req.params.id);
  //@ts-ignore
  const variant: string = req.query.variant ? req.query.variant : "white";
  //@ts-ignore
  const size = req.query.size ? req.query.size : "S";
  //@ts-ignore
  const product = req.query.product;

  //@ts-ignore
  const products = await productService.getById(
    productId,
    variant,
    //@ts-ignore
    size,
    product
  );
  res.status(201).json({ message: "Productos Obtenidos", ...products });
};

const getByIdUnique = async (req: Request, res: Response) => {
  const productId: number = parseInt(req.params.id);

  //@ts-ignore
  const productFromDb = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    include: {
      tag: true,
      design: true,
      sizes: true,
      colors: true,
      types: true,
    },
  });
  res.status(201).json({ message: "Productos Obtenidos", productFromDb });
};

const session = async (req: Request, res: Response) => {
  const NormalizeProducts = req.body.products.map((product: any) => {
    return {
      price: product.priceId,
      quantity: product.quantity,
    };
  });
  const stripe = connectionStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: NormalizeProducts,
    success_url: process.env.URL_ECOMMERCE! + "/success/",
    cancel_url: process.env.URL_ECOMMERCE! + "/cancel/",
    phone_number_collection: {
      enabled: true,
    },
    shipping_address_collection: {
      allowed_countries: ["US"],
    },
  });

  res
    .status(201)
    .json({ message: "Session obtenida", session: session ? session : {} });
};

const webhook = async (req: Request, res: Response) => {
  const stripe = connectionStripe();
  const type = {
    Poster: "SPP",
    Canvas: "WCS",
    Sweatshirt: "SWA",
    Hoodie: "HOA",
    Mug: "MUG",
    Shirt: "TSA",
  };

  const color = {
    white: "1W",
    black: "1B",
    red: "1R",
    blue: "1C",
    beige: "4Y",
  };

  const size = {
    SS: "00S",
    SM: "00M",
    SL: "00L",
    SXL: "0XL",
    S2XL: "2XL",
    S3XL: "3XL",
    S4XL: "4XL",
    S5XL: "5XL",
  };

  if (req.body.type === "checkout.session.completed") {
    const user = req.body.data.object.customer_details;

    const listData = await stripe.checkout.sessions.listLineItems(
      req.body.data.object.id
    );

    let listOfItems = [];

    const listPromise = listData.data.map(async (product) => {
      const design = await prisma.design.findFirst({
        where: {
          //@ts-ignore
          priceId: product.price.id,
        },
        include: {
          product: {
            include: {
              types: true,
              colors: true,
            },
          },
        },
      });

      const sku = `PZ${design.id.toString().padStart(8, "0")}UN${
        type[design.product.types[0].value]
      }${color[design.variant]}${size[`S${design.size}`]}`;

      const item = {
        sku,
        name: design.product.title,
        quantity: product.quantity,
        unitPrice: product.price.unit_amount / 100,
        imageUrl: design.url,
        weight: {
          value: 0,
          units: "ounces",
        },
      };

      listOfItems.push(item);

      //@ts-ignore
      await prisma.order.create({
        data: {
          city: user.address.city ? user.address.city : "",
          country: user.address.country ? user.address.country : "",
          line1: user.address.line1 ? user.address.line1 : "",
          line2: user.address.line2 ? user.address.line2 : "",
          postalCode: user.address.postal_code ? user.address.postal_code : "",
          state: user.address.state ? user.address.state : "",
          email: user.email ? user.email : "",
          name: user.name ? user.name : "",
          phone: user.phone ? user.phone : "",
          amount: product.amount_total.toString(),
          //@ts-ignore
          quantity: product.quantity,
          //@ts-ignore
          priceId: product.price.id,
          productName: product.description,
          //@ts-ignore
          artistId: design?.artistId,
        },
      });
    });
    await Promise.all(listPromise);

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Basic ${process.env.AUTH_SHIPSTATION!}`);
    function getCurrentDateTime(isOrderNumber: boolean) {
      let now = new Date();

      let year = now.getFullYear();
      let month = (now.getMonth() + 1).toString().padStart(2, "0");
      let day = now.getDate().toString().padStart(2, "0");
      let hours = now.getHours().toString().padStart(2, "0");
      let minutes = now.getMinutes().toString().padStart(2, "0");
      let seconds = now.getSeconds().toString().padStart(2, "0");
      let milliseconds = now.getMilliseconds().toString().padEnd(3, "0");

      return isOrderNumber ? `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}` : `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}000`;
    }

    const raw = JSON.stringify({
      orderNumber: getCurrentDateTime(true),
      orderDate: getCurrentDateTime(false),
      orderStatus: "awaiting_shipment",
      customerUsername: user.name ? user.name : "",
      customerEmail: user.email ? user.email : "",
      billTo: {
        name: user.name ? user.name : "",
        company: null,
        street1: user.address.line1 ? user.address.line1 : "",
        street2: user.address.line2 ? user.address.line2 : "",
        street3: null,
        city: user.address.city ? user.address.city : "",
        state: user.address.state ? user.address.state : "",
        postalCode: user.address.postal_code ? user.address.postal_code : "",
        country: user.address.country ? user.address.country : "",
        phone: user.phone ? user.phone : "",
        residential: true,
      },
      shipTo: {
        name: user.name ? user.name : "",
        company: null,
        street1: user.address.line1 ? user.address.line1 : "",
        street2: user.address.line2 ? user.address.line2 : "",
        street3: null,
        city: user.address.city ? user.address.city : "",
        state: user.address.state ? user.address.state : "",
        postalCode: user.address.postal_code ? user.address.postal_code : "",
        country: user.address.country ? user.address.country : "",
        phone: user.phone ? user.phone : "",
        residential: true,
      },
      items: listOfItems,
      advancedOptions: { source: 'merchlife' }
    });
    const orderDetails = {
      orderNumber: getCurrentDateTime(true),
      orderDate: getCurrentDateTime(false)
    }
    const requestOptions = {
      method: "POST",
      headers: headers,
      body: raw,
    };

    fetch("https://ssapi.shipstation.com/orders/createorder", requestOptions)
      .then((response) => response.json())
      .then((result) => console.log(result))
      .catch((error) => console.log("error", error));

    sendOrderSuccessfulEmail(orderDetails, user.email, listOfItems)
  }
  res.sendStatus(200);
};

const sendOrderSuccessfulEmail = async (orderDetails, user, listOfItems) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  // Calculate total amount
  const totalAmount = listOfItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  // Build the order details for all items
  let orderDetailsHtml = `
    <!doctype html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f8f8; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .header img { width: 40px; height: 40px; }
        .header h1 { font-size: 24px; margin: 0; color: #333333; }
        .header h2 { font-size: 20px; margin: 0; color: #555555; }
        .address { margin: 20px 0; color: #555555; }
        .order-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .order-table th, .order-table td { border: 1px solid #dddddd; padding: 8px; text-align: left; }
        .order-table th { background-color: #f4f4f4; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
        .footer { margin-top: 20px; color: #555555; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <img src="https://cdn.pixabay.com/photo/2016/06/13/17/30/mail-1454731_640.png" alt="logo" />
            <h1>MERCHLIFE</h1>
          </div>
          <div>
            <h2>Order #${orderDetails.orderNumber}</h2>
            <p>Order date: ${orderDetails.orderDate}</p>
          </div>
        </div>

        <div class="address">
          <h3>Bill to:</h3>
          <p>${user.name}</p>
          <p>${user.address.line1},<br />${user.address.line2},<br />${user.address.city}, ${user.address.state} ${user.address.postal_code},<br />${user.address.country}</p>
        </div>

        <table class="order-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>`;

  // Append each item from listOfItems
  listOfItems.forEach(item => {
    orderDetails += `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>$${item.unitPrice.toFixed(2)}</td>
              <td>$${(item.quantity * item.unitPrice).toFixed(2)}</td>
            </tr>`;
  });

  orderDetails += `
          </tbody>
        </table>

        <div class="total">
          Total Amount: $${totalAmount.toFixed(2)}
        </div>

        <div class="footer">
          <h4>Thank you!</h4>
          <p>If you have any questions concerning this order, use the following contact information:</p>
          <p>Email: support@merchlife.com</p>
          <p>Phone: +1 253 376 0307</p>
          <p>© 2024 MERCHLIFE.</p>
        </div>
      </div>
    </body>
    </html>`;

  const msg = {
    to: user.email,
    from: "raj@d2america.com",
    subject: "Thank you for the order. Here are your order details",
    text: "MERCHLIFE",
    html: orderDetailsHtml
  };

  const emailSent = await sgMail.send(msg);
  return emailSent;
};

// const fulfillmentWebhook = async (req: Request, res: Response) => {
  
//   const resourcetype = req.body.resource_type;
//   const resourceUrl = req.body.resource_url
  
//   const headers = new Headers();
//   headers.append("Content-Type", "application/json");
//   headers.append("Authorization", `Basic ${process.env.AUTH_SHIPSTATION!}`);

//   const requestOptions = {
//     method: "GET",
//     headers: headers,      
//   };

//   if ( resourcetype === "FULFILLMENT_SHIPPED" ) {    
//     fetch(resourceUrl, requestOptions)
//       .then((response) => response.json())
//       .then((result) => console.log(result))
//       .catch((error) => console.log("error", error));
//   }

//   else if ( resourcetype === "FULFILLMENT_REJECTED" ){
//     fetch(resourceUrl, requestOptions)
//     .then((response) => response.json())
//     .then((result) => console.log(result))
//     .catch((error) => console.log("error", error));
//   }
//   res.sendStatus(200);
// };

const getOrders = async (req: Request, res: Response) => {
  const artistId = req.user.artistId;
  const today = new Date();
  const firstDayOfCurrentMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );
  const firstDayOfLastMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );
  const lastDayOfLastMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  );
  // const ordersCount = await prisma.order.count({
  //   where: {
  //     artistId,
  //   },
  // });
  // const orders = await prisma.order.findMany({
  //   where: {
  //     artistId,
  //   },
  // });

  const ordersCount = await prisma.order.count({
    where: {
      artistId,
      createdAt: {
        gte: firstDayOfLastMonth,
        lte: lastDayOfLastMonth,
      },
    },
  });

  const orders = await prisma.order.findMany({
    where: {
      artistId,
      createdAt: {
        gte: firstDayOfLastMonth,
        lte: lastDayOfLastMonth,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const totalAmount = orders.reduce(
    (sum, order) => sum + parseInt(order.amount),
    0
  );
  let normalizeOrders = [];
  const daysOfMonth = lastDayOfLastMonth.getDate();
  console.log(daysOfMonth);

  for (let i = 1; i <= daysOfMonth; i++) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const findDate = orders.filter((order) => {
      return new Date(order.createdAt).getDate() === i;
    });
    if (findDate.length > 0) {
      normalizeOrders.push({
        time: `${year}-${month}-${String(i).padStart(2, "0")}`,
        value: findDate.length,
      });
    } else {
      normalizeOrders.push({
        time: `${year}-${month}-${String(i).padStart(2, "0")}`,
        value: 0,
      });
    }
  }

  res.status(201).json({
    amount: totalAmount,
    countSales: ordersCount,
    orders,
    normalizeOrders,
  });
};

const update = async (req: Request, res: Response) => {
  const productFromUser = req.body;
  const artistId = req.user.artistId;

  console.log("productFromUser:", productFromUser);
  const product = await prisma.product.findUnique({
    where: {
      id: productFromUser.id,
      artistId,
    },
    include: {
      tag: true, // Esto incluye las etiquetas actuales del producto en la respuesta.
    },
  });
  const tagOperations = productFromUser.tags.map((tagValue) => ({
    where: { value: tagValue },
    create: { value: tagValue },
  }));
  const updatedProduct = await prisma.product.update({
    where: {
      id: productFromUser.id,
    },
    data: {
      title: productFromUser.name,
      description: productFromUser.description,
      tag: {
        disconnect: product.tag.map((tag) => ({ id: tag.id })),
        connectOrCreate: tagOperations,
      },
    },
    include: {
      tag: true,
    },
  });

  console.log("product update", updatedProduct);
  res.status(201).json({
    message: "Product Updated",
  });
};

const deleteProduct = async (req: Request, res: Response) => {
  console.log("aqui estoy");
  const productId = req.params.productId
    ? parseInt(req.params.productId)
    : null;
  console.log("hola", req.user);
  const artistId = req.user.artistId;

  console.log("artist", artistId);
  console.log("productId", productId);

  if (productId) {
    await prisma.product.delete({
      where: {
        id: productId,
        artistId,
      },
    });
  }
  res.status(201).json({
    message: "Product delete",
  });
};

const createGroup = async (req: Request, res: Response) => {
  const artistId = req.user.artistId;
  //@ts-ignore
  const imageArt = req.body.art;
  console.log("imageArt: ", imageArt)
  const name = req.body.name;
  const posterName = `${name} Poster`
  const canvasName = `${name} Canvas`
  // const imageCrop = req.body.imageCrop;
  // console.log("oki2", req.body.imageCrop);
  const shouldCreateCanvas = req.body.shouldCreateCanvas;
  const shouldCreatePoster = req.body.shouldCreatePoster;
  const base64Image = imageArt.split(";base64,").pop();
  const artBuffer = Buffer.from(base64Image, "base64");
  const getArtist = await artistDAO.getArtistById(artistId);
  const s3 = connectionAws();
  const stripe = connectionStripe();

  // const paramsImgCrop = {
  //   Bucket: process.env.BUCKET_IMG,
  //   //@ts-ignore
  //   Key: `${Date.now().toString()}-${getArtist.name}-Poster`,
  //   Body: imgCropBuffer,
  //   ContentType: "image/png",
  // };
    //@ts-ignore
  // const imgCropURL = await s3.upload(paramsImgCrop).promise();
  const paramsImgArt = {
    Bucket: process.env.BUCKET_IMG,
    //@ts-ignore
    Key: `${Date.now().toString()}-${getArtist.name}-Art`,
    Body: artBuffer,
    ContentType: "image/png",
  };
  //@ts-ignore
  const imgArtURL = await s3.upload(paramsImgArt).promise();
  // await artistDAO.updateArtist(artistId, { avatar: imgArtURL.Location });
  const newGroup = await prisma.group.create({
    data: {
      artistId,
      urlImage: imgArtURL.Location,
      //@ts-ignore
      name,
    },
  });
  if (shouldCreateCanvas === "true") {
    // Create Price of stripe

    const newOfProductCanvas = await stripe.products.create({
      name: `${name}-Canvas-11x14-product`,
      images: [imgArtURL.Location],
    });
    const newOfProductCanvas2 = await stripe.products.create({
      name: `${name}-Canvas-20x30-product`,
      images: [imgArtURL.Location],
    });

    const priceProductCanvas = await stripe.prices.create({
      product: newOfProductCanvas.id,
      currency: "usd",
      unit_amount: 49.95 * 100,
    });
    const priceProduct = await stripe.prices.create({
      product: newOfProductCanvas2.id,
      currency: "usd",
      unit_amount: 99.99 * 100,
    });

    const newProductCanvas = await productService.create({
      price: 49.95,
      title: canvasName,
      subtitle: "",
      description: "",
      artistId: artistId,
      idGeneral: generateCode(),
      groupId: newGroup.id,
      // tag: {
      //   connectOrCreate: tagOperations,
      // },
      types: {
        connectOrCreate: {
          where: { value: "Canvas" },
          create: { value: "Canvas" },
        },
      },
      sizes: {
        connectOrCreate: [
          {
            where: { value: `11"x14"` },
            create: { value: `11"x14"` },
          },
          {
            where: { value: `20"x30"` },
            create: { value: `20"x30"` },
          },
        ],
      },
    });

    const createDesignCanvas1 = await prisma.design.create({
      //@ts-ignore
      data: {
        //@ts-ignore
        productId: newProductCanvas.id,
        positionX: 0,
        positionY: 0,
        angle: 0,
        scale: 0,
        price: 49.95,
        priceId: priceProductCanvas.id,
        url: imgArtURL.Location,
        urlLogo: imgArtURL.Location,
        artistId: artistId,
        size: `11"x14"`,
      },
    });

    const createDesignCanvas2 = await prisma.design.create({
      //@ts-ignore
      data: {
        //@ts-ignore
        productId: newProductCanvas.id,
        positionX: 0,
        positionY: 0,
        angle: 0,
        scale: 0,
        price: 99.99,
        priceId: priceProduct.id,
        url: imgArtURL.Location,
        urlLogo: imgArtURL.Location,
        artistId: artistId,
        size: `20"x30"`,
      },
    });

  }
  if (shouldCreatePoster === "true") {
    // Create Price of stripe
    const newOfProductPosterSmall = await stripe.products.create({
      name: `${name}-Poster-17x25.5-product`,
      images: [imgArtURL.Location],
    });
    const newOfProductPosterLarge = await stripe.products.create({
      name: `${name}-Poster-24x36-product`,
      images: [imgArtURL.Location],
    });

    const priceProductPosterSmall = await stripe.prices.create({
      product: newOfProductPosterSmall.id,
      currency: "usd",
      unit_amount: 25.99 * 100,
    });
    const priceProductPosterLarge = await stripe.prices.create({
      product: newOfProductPosterLarge.id,
      currency: "usd",
      unit_amount: 39.99 * 100,
    });

    const newProductPoster = await productService.create({
      price: 25.99,
      title: posterName,
      subtitle: "",
      description: "",
      artistId: artistId,
      idGeneral: generateCode(),
      groupId: newGroup.id,
      // tag: {
      //   connectOrCreate: tagOperations,
      // },
      types: {
        connectOrCreate: {
          where: { value: "Poster" },
          create: { value: "Poster" },
        },
      },
      sizes: {
        connectOrCreate: [
          {
            where: { value: `17"x25.5"` },
            create: { value: `17"x25.5"` },
          },
          {
            where: { value: `24"x36"` },
            create: { value: `24"x36"` },
          },
        ],
      },
    });

    const createDesignPosterSmall = await prisma.design.create({
      //@ts-ignore
      data: {
        //@ts-ignore
        productId: newProductPoster.id,
        positionX: 0,
        positionY: 0,
        angle: 0,
        scale: 0,
        price: 25.99,
        priceId: priceProductPosterSmall.id,
        url: imgArtURL.Location,
        urlLogo: imgArtURL.Location,
        artistId: artistId,
        size: `17"x25.5"`,
      },
    });

    const createDesignPosterLarge = await prisma.design.create({
      //@ts-ignore
      data: {
        //@ts-ignore
        productId: newProductPoster.id,
        positionX: 0,
        positionY: 0,
        angle: 0,
        scale: 0,
        price: 39.99,
        priceId: priceProductPosterLarge.id,
        url: imgArtURL.Location,
        urlLogo: imgArtURL.Location,
        artistId: artistId,
        size: `24"x36"`,
      },
    });
  }

  res.status(200).json({
    message: "Updated image",
  });
};

const getGallery = async (req: Request, res: Response) => {
  const artistId = req.user.artistId;
  //@ts-ignore
  const gallery = await prisma.group.findMany({
    where: {
      artistId,
    },
  });
  res.status(200).json({
    message: "List of gallery",
    gallery,
  });
};

const getGroupRelation = async (req: Request, res: Response) => {
  const groupId = parseInt(req.params.groupId);
  //@ts-ignore
  const artist = await prisma.artist.findFirst({
    where: {
      group: {
        some: {
          id: groupId,
        },
      },
    },
  });
  const groupRelation = await prisma.group.findMany({
    take: 4,
    where: {
      artistId: artist.id,
      product: {
        some: {},
      },
    },
    include: {
      product: {
        include: {
          design: true,
          types: true,
        },
      },
    },
  });
  res.status(200).json({
    message: "List of group relation",
    groupRelation,
  });
};

const getGroupRelationByArtist = async (req: Request, res: Response) => {
  const artistName = req.params.artist.replace(/-/g, " ");

  //@ts-ignore
  const groupRelation = await prisma.group.findMany({
    where: {
      artist: {
        name: artistName,
      },
      product: {
        some: {},
      },
    },
    include: {
      product: {
        include: {
          design: true,
          types: true,
        },
      },
    },
  });
  res.status(200).json({
    message: "List of group relation",
    groupRelation,
  });
};

const getCategories = async (req: Request, res: Response) => {
  const categories = await prisma.tag.findMany({
    where: {
      products: {
        some: {},
      },
    },
    include: {
      products: {
        select: {
          group: {
            select: {
              urlImage: true,
            },
          },
        },
      },
    },
  });
  res.status(200).json({
    message: "List of group relation",
    categories,
  });
};

const getArtsFromCategory = async (req: Request, res: Response) => {
  const category = req.params.category;
  const productsWithTags = await prisma.tag.findMany({
    where: {
      value: category,
    },
    include: {
      products: {
        include: {
          group: true,
          types: true,
        },
      },
    },
  });

  const firstProductsByGroupId = {};

  // Iterar sobre los productos y almacenar solo el primer producto de cada groupId
  productsWithTags.forEach((tag) => {
    tag.products.forEach((product) => {
      const groupId = product.groupId; // Asegúrate de usar la clave correcta para groupId
      if (!firstProductsByGroupId[groupId]) {
        firstProductsByGroupId[groupId] = product;
      }
    });
  });

  // Obtener los productos filtrados como un array
  const uniqueProducts = Object.values(firstProductsByGroupId);

  res.status(200).json({
    message: "List of group relation",
    products: uniqueProducts,
  });
};
const getProductByGroupWithArtist = async (req: Request, res: Response) => {
  const artist = req.params.artist.replace("-", " ");
  const productId = Number(req.query.productId);
  const type = String(req.query.type);
  const variant = String(req.query.variant);

  const data = await prisma.artist.findFirst({
    where: {
      name: artist,
    },
    select: {
      product: {
        where: {
          id: productId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          types: { where: { value: type }, select: { value: true } },
          design: {select:{size:true,url:true,variant:true,priceId:true} },
        },
      },
    },
  });
  res.status(200).json({ data: data });
};
const getArtsFromHome = async (req: Request, res: Response) => {
  const arts = await prisma.group.findMany({
    where: {
      product: {
        some: {},
      },
    },
    orderBy: {
      id: "desc",
    },
    take: 15,
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
  res.status(200).json({
    message: "List of arts",
    arts,
  });
};

const createCanvas = async (req: Request, res: Response) => {
  const { type, groupId } = req.body;

  const productName = req.body.name;
  const productSubtitle = req.body.subtitle;
  const productDescription = req.body.description;
  const s3 = connectionAws();
  const stripe = connectionStripe();
  const artistId = req.user.artistId;

  const logoURL = await productService.uploadLogo(
    req.body.imgLogo,
    s3,
    productName
  );

  const newOfProduct = await stripe.products.create({
    name: `${productName}-Canvas-20x30-product`,
    images: [logoURL],
  });

  const priceProduct = await stripe.prices.create({
    product: newOfProduct.id,
    currency: "usd",
    unit_amount: 99.99 * 100,
  });

  const newProduct = await productService.create({
    price: 99.99,
    title: productName,
    subtitle: productSubtitle,
    description: productDescription,
    artistId: artistId,
    idGeneral: generateCode(),
    groupId,
    // tag: {
    //   connectOrCreate: tagOperations,
    // },
    types: {
      connectOrCreate: {
        where: { value: type },
        create: { value: type },
      },
    },
    sizes: {
      connectOrCreate: {
        where: { value: `20"x30"` },
        create: { value: `20"x30"` },
      },
    },
  });
  const createDesign = await prisma.design.create({
    //@ts-ignore
    data: {
      //@ts-ignore
      productId: newProduct.id,
      positionX: 0,
      positionY: 0,
      angle: 0,
      scale: 0,
      price: 99.99,
      priceId: priceProduct.id,
      url: logoURL,
      urlLogo: logoURL,
      artistId: artistId,
      size: `20"x30"`,
    },
  });

  res.status(200).json({
    message: "Canvas created",
    createDesign,
  });
};
const findProductsByFilters = async(req:Request, res:Response)=> {
  const {
    variant,
    type,
    size,
    minPrice,
    maxPrice,
    searchWord,
    sort,
    page = 1,
    pageSize = 9,
  } = req.query;
  const where: any = {}; // Use any for flexibility
  const designWhere:any = {};
  const typesWhere:any = {};
  if (variant) {
    where.design = {
    some: {
      variant: { contains: variant, mode: "insensitive" },
    },
  };
  designWhere.variant = { contains: variant, mode: "insensitive" }
}
if(searchWord){
  where.title = {
    contains:searchWord.toString(),mode: 'insensitive'
  }
}

// Filter by type
if (type) {
  where.types = {
    some: {
      value: { equals: type },
    },
  };
  typesWhere.value = {equals: type}
} else{
  where.types = {
    none: {
      value:{in:["Poster", "Canvas"]}
    },
  };
}

// Filter by size
if (size) {
  where.sizes = {
    some: {
      value: { equals: size },
    },
  };
  designWhere.size = { contains: size}
}

// Filter by price range
if (minPrice || maxPrice) {
  where.price = {};
  if (minPrice) {
    where.price.gte = minPrice;
  }
  if (maxPrice) {
    where.price.lte = maxPrice;
  }
}

const skip = (Number(page) - 1) * Number(pageSize);
const sortBy:{price:"asc"|"desc"}|{} = (sort==="HighToLow")? {price:"desc"} : (sort==="LowToHigh")?{price:"asc"}:{}

const products = await prisma.product.findMany({
  where,
  select:{id:true,price:true,design:{select:{url:true,size:true,variant:true},where:designWhere},types:{select:{value:true},where:typesWhere},artist:{select:{name:true}}},
  // include: {
  //   design: true,
  //   types: true,
  //   sizes: true,
  //   artist:true
  // },
  orderBy:sortBy,
  skip,
  take: Number(pageSize),
});  
const productCount = await prisma.product.count({where})
res.json({data:products,count:productCount});
return 
}

const createWithDecorators = withErrorHandlingDecorator(create);
const getAllWithDecorators = withErrorHandlingDecorator(getAll);
const getByUserWithDecorators = withErrorHandlingDecorator(getByUser);
const getByIdWithDecorators = withErrorHandlingDecorator(getById);
const getByIdUniqueWithDecorators = withErrorHandlingDecorator(getByIdUnique);

const sessionWithDecorators = withErrorHandlingDecorator(session);
const webhookWithDecorators = withErrorHandlingDecorator(webhook);
// const fulfillmentWebhookWithDecorators = withErrorHandlingDecorator(fulfillmentWebhook);
const getOrdersWithDecorators = withErrorHandlingDecorator(getOrders);
const updateWithDecorators = withErrorHandlingDecorator(update);
const deleteWithDecorators = withErrorHandlingDecorator(deleteProduct);
const createGroupWithDecorators = withErrorHandlingDecorator(createGroup);
const getGalleryWithDecorators = withErrorHandlingDecorator(getGallery);
const getGroupRelationWithDecorators =
  withErrorHandlingDecorator(getGroupRelation);
const getGroupRelationByArtistWithDecorators = withErrorHandlingDecorator(
  getGroupRelationByArtist
);
const getCategoriesWithDecorators = withErrorHandlingDecorator(getCategories);
const getArtsFromCategoryWithDecorators =
  withErrorHandlingDecorator(getArtsFromCategory);
const getArtsFromHomeWithDecorators =
  withErrorHandlingDecorator(getArtsFromHome);
const createCanvasWithDecorators = withErrorHandlingDecorator(createCanvas);
const getProductByGroupWithArtistWithDecorators = withErrorHandlingDecorator(
  getProductByGroupWithArtist
);
const findProductsByFiltersWithDecorators = withErrorHandlingDecorator(
  findProductsByFilters
);

export const productController = {
  create: createWithDecorators,
  getAll: getAllWithDecorators,
  getByUser: getByUserWithDecorators,
  getById: getByIdWithDecorators,
  session: sessionWithDecorators,
  webhook: webhookWithDecorators,
  // fulfillmentWebhook: fulfillmentWebhookWithDecorators,  
  getOrders: getOrdersWithDecorators,
  update: updateWithDecorators,
  delete: deleteWithDecorators,
  createGroup: createGroupWithDecorators,
  getGallery: getGalleryWithDecorators,
  getGroupRelation: getGroupRelationWithDecorators,
  getGroupRelationByArtist: getGroupRelationByArtistWithDecorators,
  getByIdUnique: getByIdUniqueWithDecorators,
  getCategories: getCategoriesWithDecorators,
  getArtsFromCategory: getArtsFromCategoryWithDecorators,
  getArtsFromHome: getArtsFromHomeWithDecorators,
  createCanvas: createCanvasWithDecorators,
  getProductByGroupWithArtist: getProductByGroupWithArtistWithDecorators,
  findProductsByFilters: findProductsByFiltersWithDecorators,
};

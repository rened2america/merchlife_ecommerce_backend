import express from "express";
import routes from "./route/route";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
// import bodyParser from "body-parser";
const app = express();

app.use(
  cors({
    credentials: true,
    origin: [
      "*",
      "http://localhost:3001",
      "http://localhost:3000",
      "https://merchlife-alternative-frontend.vercel.app",
      "https://merchlife-dashboard-frontend.vercel.app",
      "https://www.merchlife.co",
      "https://dashboard.merchlife.co",      
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin', 'Access-Control-Allow-Methods'],
    optionsSuccessStatus: 200
  })
);
// app.use(express.json());
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/api/1", routes);
const PORT = 4000;

app.listen(PORT, () => {
  console.log("Se ejecuto en el puerto: ", PORT);
});

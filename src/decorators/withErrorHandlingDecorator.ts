import { isBoom } from "@hapi/boom";
import { Request, Response } from "express";
import { logger } from "../configuration/logger/logger";

type ControllerFunction = (req: Request, res: Response) => Promise<void>;

export const withErrorHandlingDecorator =
  (fn: ControllerFunction): ControllerFunction =>
  async (req: Request, res: Response): Promise<void> => {
    try {
      await fn(req, res);
    } catch (error) {
      logger.error("Error:", error);
      // console.error("Error:", error);
      if (isBoom(error)) {
        res.status(error.output.statusCode).json(error.output.payload);
      } else {
        res.status(500).json({ error: "Ha ocurrido un error en el servidor." });
      }
    }
  };

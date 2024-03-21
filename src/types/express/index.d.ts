declare namespace Express {
  export interface Request {
    user: {
      artistId;
    };
  }
  export interface Response {
    user: any;
  }
}

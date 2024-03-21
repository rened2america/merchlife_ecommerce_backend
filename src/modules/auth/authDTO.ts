export interface CreateSession {
  artistId: number;
  accessCode: string;
  refreshCode: string;
  accessToken: string;
  refreshToken: string;
}

export interface SessionCreated {
  id: number;
  accessCode: string;
  refreshCode: string;
  artistId: number;
}

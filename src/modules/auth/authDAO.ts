import { prisma } from "../../database/initialConfig";

class AuthDAO {
  createUser = async (data: any) => {
    const newUser = await prisma.artist.create({
      data,
    });

    return newUser;
  };

  userExists = async (email: string) => {
    const user = await prisma.artist.findFirst({
      where: {
        email: email
      }
    });
    
    console.log(user)
    
    return !!user;
  };

  getUserByEmail = async (email: string) => {
    const user = await prisma.artist.findUnique({
      where: {
        email,
      },
    });

    return user;
  };
}

export default new AuthDAO();

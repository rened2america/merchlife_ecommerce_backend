import Boom from "@hapi/boom";

export const authErrors = {
  userNotFound: Boom.notFound("User not found"),
};

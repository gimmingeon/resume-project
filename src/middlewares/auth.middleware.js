// src/middlewares/auth.middleware.js

import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";

export default async function (req, res, next) {
  try {

    // 헤더에서 aceessToken 가져오기
    const { authorization } = req.cookies;
    if (!authorization)
      throw new Error("요청한 사용자의 토큰이 존재하지 않습니다.");

    // accessToken의 인증방식이 올바른가
    const [tokenType, tokenValue] = authorization.split(" ");

    if (tokenType !== "Bearer")
      throw new Error("토큰 타입이 일치하지 않습니다.");

    if (!tokenValue)
      throw new Error("인증 정보가 올바르지 않습니다");

    // 12시간의 유효기간이 암아있는가?
    const token = jwt.verify(tokenValue, "resume-key");

    // accessToken 안에 userId 데이터가 잘 들어있는가?
    if (!token.userId) {
      throw new Error("인증 정보가 올바르지 않습니다");
    }

    const user = await prisma.users.findFirst({
      where: { userId: token.userId },
    });

    if (!user) {
      res.clearCookie("authorization");
      throw new Error("토큰 사용자가 존재하지 않습니다.");
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    })

  }
}


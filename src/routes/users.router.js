import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/sign-up", async (req, res, next) => {
  const { email, password, passwordcheck, name } = req.body;

  const isExistUser = await prisma.users.findFirst({
    where: { email },
  });

  if (isExistUser) {
    return res.status(409).json({ message: "이미 존재하는 이메일입니다." });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "비밀번호는 8자리 이상으로 만들어야 합니다" });
  }

  if (password !== passwordcheck) {
    return res
      .status(400)
      .json({ message: "비밀번호가 비밀번호 확인과 다릅니다" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: { email, password: hashedPassword, name },
  });

  const info = { ...user, password: undefined };

  return res.status(201).json({ data: info });
});

router.post("/sign-in", async (req, res, next) => {
  // 1. `email`, `password`를 **body**로 전달받습니다.
  const { email, password } = req.body;

  // 2. 전달 받은 `email`에 해당하는 사용자가 있는지 확인합니다.
  const user = await prisma.users.findFirst({ where: { email } });

  if (!user) {
    return res.status(401).json({ message: "없는 이메일입니다" });
  }

  // 3. 전달 받은 `password`와 데이터베이스의 저장된 `password`를 bcrypt를 이용해 검증합니다.
  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "비밀번호가 틀렸습니다" });
  }

  // 사용자에게 jwt를 할당한다
  const token = jwt.sign({ userId: user.userId }, "custom-secret-key", {
    expiresIn: "12h",
  });

  res.cookie("authorization", `Bearer ${token}`);
  return res.status(200).json({ message: "로그인되었습니다" });
});

// 사용자 정보 조회
router.get("/users", authMiddleware, async (req, res, next) => {
  // user에서 가져온 userId를 바탕으로 정보를 조회한다
  const { userId } = req.user;

  // 데이터 조회
  const user = await prisma.users.findFirst({
    where: { userId: +userId },
    select: {
      userId: true,
      email: true,
      name: true,
    },
  });

  return res.status(201).json({ data: user });
});

export default router;

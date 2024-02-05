import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/sign-up", async (req, res, next) => {
  const { email, password, passwordcheck, name } = req.body;

  if (!email) {
    return res.status(400).json({message: "이메일을 적지 않았습니다"});
  }

  if (!password) {
    return res.status(400).json({message: "비밀번호를 적지 않았습니다"});
  }

  if (!passwordcheck) {
    return res.status(400).json({message: "비밀번호 확인을 적지 않았습니다"});
  }

  if (!name) {
    return res.status(400).json({message: "이름을 적지 않았습니다"});
  }

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

  return res.status(201).json({ email, name });
});

router.post("/sign-in", async (req, res, next) => {

  const { email, password } = req.body;

  const user = await prisma.users.findFirst({ where: { email } });

  if (!user) {
    return res.status(401).json({ message: "없는 이메일입니다" });
  }

  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "비밀번호가 틀렸습니다" });
  }

  const token = jwt.sign({ userId: user.userId }, "custom-secret-key", {
    expiresIn: "12h",
  });

  res.cookie("authorization", `Bearer ${token}`);
  return res.status(200).json({ message: "로그인되었습니다" });
});

router.get("/users", authMiddleware, async (req, res, next) => {

  const { userId } = req.user;
  
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

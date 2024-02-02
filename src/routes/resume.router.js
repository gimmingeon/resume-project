import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 이력서 생성
router.post("/resume", authMiddleware, async (req, res, next) => {
  const { userId } = req.user;
  const { title, introduction, author, status } = req.body;

  const resumeStatus = status || "APPLY";

  const statusOption = [
    "APPLY",
    "DROP",
    "PASS",
    "INTERVIEW1",
    "INTERVIEW2",
    "FINAL_PASS",
  ];
  if (!statusOption.includes(resumeStatus)) {
    return res.status(400).json({ message: "이력서 상태를 잘못 입력했습니다" });
  }

  const resume = await prisma.resume.create({
    data: {
      userId: +userId,
      title: title,
      introduction: introduction,
      author: author,
      status: resumeStatus,
    },
  });

  return res.status(201).json({ data: resume });
});

router.get("/resume", async (req, res, next) => {
  const resume = await prisma.resume.findMany({
    select: {
      resumeId: true,
      title: true,
      introduction: true,
      author: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.status(200).json({ data: resume });
});

router.get("/resume/:resumeId", async (req, res, next) => {
  const { resumeId } = req.params;

  const resume = await prisma.resume.findFirst({
    where: { resumeId: +resumeId },
    select: {
      resumeId: true,
      title: true,
      introduction: true,
      author: true,
      status: true,
      createdAt: true,
    },
  });

  return res.status(200).json({ data: resume });
});


router.put("/resume/:resumeId", authMiddleware, async (req, res, next) => {
  const { resumeId } = req.params;
  const { title, introduction, status } = req.body;
  const {userId} = req.user;

  const resume = await prisma.resume.findUnique({
    where: {
      resumeId: +resumeId,
    },
  });

  if (!resume) {
    return res.status(404).json({ message: "이력서 조회에 실패하였습니다." });
  }

  if (resume.user !== +userId) {
    return res.status(403).json({message: "당신의 이력서가 아닙니다"});
  }

  await prisma.resume.update({
    data: {
      title: title,
      introduction: introduction,
      status: status,
    },
    where: {
      resumeId: +resumeId,
    },
  });

  return res.status(200).json({ message: "이력서 수정 완료" });
});


router.delete("/resume/:resumeId", authMiddleware, async (req, res, next) => {
  const { resumeId } = req.params;
  const {userId} = req.user;

  const resume = await prisma.resume.findUnique({
    where: {
      resumeId: +resumeId,
    },
  });

  if (!resume) {
    return res.status(404).json({ message: "이력서조회에 실패했습니다" });
  }

  if(resume.resumeId !== +userId) {
    return res.status(404).json({message: "당신의 이력서가 아닙니다"});
  }

  await prisma.resume.delete({
    where: { resumeId: +resumeId },
  });

  return res.status(200).json({ message: "이력서 삭제" });
});

export default router;

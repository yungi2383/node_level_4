import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 좋아요 등록, 취소
router.put("/posts/:postId/like", authMiddleware, async (req, res) => {
    try {
      const { postId } = req.params;
      const { userId } = req.user;
  
      const isExistPost = await prisma.posts.findUnique({
        where: { postId: +postId },
      });
      if (!isExistPost) {
        return res.status(404).json({
          errorMessage: "게시글이 존재하지 않습니다.",
        });
      }
  
      let isLike = await prisma.likes.findFirst({
        where: {
          PostId: +postId,
          UserId: +userId,
        },
      });
  
      if (!isLike) {
        await prisma.likes.create({
          data: {
            PostId: +postId,
            UserId: +userId,
          },
        });
  
        return res
          .status(200)
          .json({ message: "게시글의 좋아요를 등록하였습니다." });
      } else {
        await prisma.likes.delete({
          where: { likeId: +isLike.likeId },
        });
  
        return res
          .status(200)
          .json({ message: "게시글의 좋아요를 취소하였습니다." });
      }
    } catch (error) {
      console.error(`${req.method} ${req.originalUrl} : ${error.message}`);
      return res.status(400).json({
        errorMessage: "게시글 좋아요에 실패하였습니다.",
      });
    }
  });


// 좋아요 게시글 조회
router.get("/posts/like", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    const posts = await prisma.posts.findMany({
      where: {
        Like: {
          some: {
            UserId: +userId,
          },
        },
      },
      select: {
        postId: true,
        User: {
            select: {
              nickname: true,
            },
          },
        UserId: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            Like: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const parseLikePosts = parseLikePostsModel(posts);

    // Like와 Post모델을 Join한 결과를 Plat Object로 변환하는 함수
    function parseLikePostsModel(posts){
      return posts.map((post) => {
        let obj = {};

        // 첫 번째 레벨의 키-값을 대상 객체에 복사합니다.
        Object.entries(post).forEach(([key, value]) => {
          if (typeof value === "object" && !(value instanceof Date)) {
            // 두 번째 레벨의 키-값도 대상 객체에 복사합니다.
            Object.entries(value).forEach(([subKey, subValue]) => {
              obj[subKey] = subValue;
            });
          } else {
            obj[key] = value;
          }
        });
        return obj;
      });
    };

    return res.status(200).json({
      data: parseLikePosts,
    });
  } catch (error) {
    console.error(`${req.method} ${req.originalUrl} : ${error.message}`);
    console.error(error);
    return res.status(400).json({
      errorMessage: "좋아요 게시글 조회에 실패하였습니다.",
    });
  }
});

export default router;

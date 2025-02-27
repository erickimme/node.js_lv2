import express from "express";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router({ mergeParams: true });


// 댓글 생성 API
// router.post("/", async (req, res, next) => {
//   const { postId } = req.params;
//   const { user, password, content } = req.body;

//   if (!user || !password || !content) {
//     return res.status(400).json({ message: res.locals.messages.noData });
//   }

//   try {
//     const existingPost = await prisma.post.findUnique({
//       where: { postId: postId },
//     });

//     if (!existingPost) {
//       return res.status(404).json({ message: res.locals.messages.notFound });
//     }

//     await prisma.comment.create({
//       data: {
//         postId: postId,
//         user,
//         password,
//         content,
//       },
//     });

//     return res.status(200).json({ message: "댓글을 생성하였습니다." });

//   } catch (err) {
//     next(err);
//   }
// });

/* 댓글 생성 Logic - Eric */
// 1. request body input : user, password, content
// 2. validation check : user, password, content
// 3. create comment in Comments table : user, password, content
// 4. response : {  "message": "댓글을 생성하였습니다."} 출력
// 5. error handling : # 400 body 또는 params를 입력받지 못한 경우 { message: '데이터 형식이 올바르지 않습니다.' } 출력
// 5. error handling : # 400 body의 content를 입력받지 못한 경우 { message: '댓글 내용을 입력해주세요.' } 출력
router.post('/', async (req, res, next) => {
  const { postId } = req.params;
  const { user, password, content } = req.body;

  if (!postId || !user || !password || !content) {
    res.status(400).json({ message: res.locals.messages.noData });
  } else if (!content) {
    res.status(400).json({ message: res.locals.messages.noComment });
  } else {
    try {
      const existingPost = await prisma.posts.findUnique({
        where: { postId },
      });

      if (!existingPost) {
        res.status(404).json({ message: res.locals.messages.notFound });
      }

      const createdComment = await prisma.comments.create({
        data: {
          postId,
          user,
          password,
          content,
        },
      });
      res.status(201).json({ message: '댓글을 생성하였습니다.' });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
});






// // 댓글 조회 API
// router.get("/", async (req, res, next) => {
//   const { postId } = req.params;

//   try {
//     // 댓글을 데이터베이스에서 검색
//     const comments = await prisma.comment.findMany({
//       where: { postId: postId },
//       select: {
//         commentId: true,
//         user: true,
//         content: true,
//         createdAt: true,
//       },
//     });


//     const commentsPrint = comments.map((comment) => ({
//       commentId: comment.commentId,
//       user: comment.user,
//       content: comment.content,
//       createdAt: comment.createdAt,
//     }));

//     if (commentsPrint.length === 0) {
//       return res.status(400).json({ message: "댓글이 존재하지 않습니다." });
//     }

//     return res.status(200).json({ data: commentsPrint });
//   } catch (err) {
//     next(err);
//   }
// });



/*  게시글 별 댓글 전체 목록 조회 Logic - Eric */
// 1. request body input : 없음
// 2. validation check : 없음
// 3. select all comments in Comments table and sort by createdAt in descending order
// 4. response :
// {
//     "data":
//     [{
//         "commentId": "62d6d3fd30b5ca5442641b94",
//         "user": "Developer",
//         "content": "수정된 댓글입니다.",
//         "createdAt": "2023-08-27T15:55:41.490Z"
//     },
//     {
//         "commentId": "62d6d34b256e908fc79feaf8",
//         "user": "Developer",
//         "content": "안녕하세요 댓글입니다.",
//         "createdAt": "2023-08-27T15:52:43.212Z"
//     }
//     ]
// }
// 5. error handling : # 400 postId를 입력받지 못한 경우 { message: '데이터 형식이 올바르지 않습니다.' } 출력
// 5. error handling : # 404 postId에 해당하는 댓글이 없는 경우 { message: '댓글 조회에 실패하였습니다.' } 출력
router.get('/posts/:postId/comments', async (req, res, next) => {
  const { postId } = req.params;
  if (!postId) {
    res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });
  } else {
    try {
      const comments = await prisma.comments.findMany({
        where: {
          postId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          commentId: true,
          user: true,
          content: true,
          createdAt: true,
        },
      });
      if (comments.length === 0) {
        res.status(404).json({ message: '댓글 조회에 실패하였습니다.' });
      } else {
        res.status(200).json({ data: comments });
      }
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
});





// 댓글 수정
router.put("/:commentId", async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;
    const { password, content } = req.body;

    // 게시글 조회 (게시글이 있는지 확인)
    const post = await prisma.post.findUnique({
      where: { postId },
    });

    // 게시글이 없는 경우
    if (!post) {
      return res.status(404).json({ message: "게시글 조회에 실패하였습니다." });
    }

    // 댓글 조회
    const comment = await prisma.comment.findUnique({
      where: { commentId },
    });

    // 댓글이 없는 경우
    if (!comment) {
      return res.status(404).json({ message: "댓글 조회에 실패하였습니다." });
    }

    // 비밀번호 확인
    if (password !== comment.password) {
      return res.status(401).json({ message: "비밀번호가 다릅니다." });
    }

    // 댓글 수정
    await prisma.comment.update({
      where: { commentId: commentId },
      data: { content: content },
    });

    return res.status(200).json({ message: "댓글을 수정하였습니다." });
  } catch (err) {
    console.error(err);
    next(err); // 에러를 처리하는 미들웨어로 넘김
  }
});

// 댓글 삭제 API
router.delete("/:commentId", async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;
    const { password } = req.body;

    // 게시글 조회
    const post = await prisma.post.findUnique({
      where: { postId },
    });

    // 게시글이 없는 경우
    if (!post) {
      return res.status(404).json({ message: "게시글이 존재하지 않습니다." });
    }

    // 댓글 조회
    const comment = await prisma.comment.findUnique({
      where: { commentId },
    });

    // 댓글이 없는 경우 또는 댓글의 postId와 주어진 postId가 일치하지 않는 경우
    if (!comment || comment.postId !== postId) {
      return res.status(404).json({ message: "댓글 조회에 실패하였습니다." });
    }

    // 비밀번호 확인
    if (password !== comment.password) {
      return res.status(401).json({ message: "비밀번호가 다릅니다." });
    }

    // 댓글 삭제
    await prisma.comment.delete({
      where: { commentId },
    });

    return res.status(200).json({ message: "댓글을 삭제하였습니다." });
  } catch (err) {
    console.error(err);
    next(err); // 에러를 처리하는 미들웨어로 넘김
  }
});






/* 댓글 수정 Logic */
// 1. request body input : password, content
// 2. validation check : password, content
// 3. select comment in Comments table by commentId
// 4. 댓글 조회되었다면 해당하는 게시글과 댓글의 `password`가 일치하는지 확인합니다.
// 5. update comment in Comments table : password, content
// 6. response : {  "message": "댓글을 수정하였습니다."} 출력
// 7. error handling : # 400 body의 content를 입력받지 못한 경우 { message: '댓글 내용을 입력해주세요.' } 출력
// 7. error handling : # 400 body 또는 params를 입력받지 못한 경우 { message: '데이터 형식이 올바르지 않습니다.' } 출력
// 7. error handling : # 404 _commentId에 해당하는 댓글이 존재하지 않을 경우 { message: '댓글 조회에 실패하였습니다.' } 출력

// router.put('/posts/:postId/comments/:commentId', async (req, res, next) => {
//   console.log("hello");
//   const { postId, commentId } = req.params;
//   const { password, content } = req.body;

//   if (!postId, !commentId || !password || !content) {
//       res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });
//   } else if (!content) {
//       res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
//   } else {
//       try {
//           const comment = await prisma.comments.findUnique({
//               where: {
//                   commentId,
//               },
//           });
//           if (!comment) {
//               res.status(404).json({ message: '댓글 조회에 실패하였습니다.' });
//           } else {
//               if (comment.password !== password) {
//                   res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
//               }
//               const updatedComment = await prisma.comments.update({
//                   where: {
//                       commentId,
//                       postId,
//                   },
//                   data: {
//                       content,
//                   },
//               });
//               res.status(200).json({ message: '댓글을 수정하였습니다.' });
//           }
//       } catch (error) {
//           console.error(error);
//           next(error);
//       }
//   }
// });




/* 댓글 삭제 Logic */
// 1. request body input : password
// 2. paramerter : /posts/:postId/comments/:commentId
// 3. validation check : password
// 4. select comment in Comments table by commentId
// 5. 댓글 조회되었다면 해당하는 게시글과 댓글의 `password`가 일치하는지 확인합니다.
// 6. delete comment in Comments table by commentId
// 7. response : {  "message": "댓글을 삭제하였습니다."} 출력
// 8. error handling : # 400 body 또는 params를 입력받지 못한 경우 { message: '데이터 형식이 올바르지 않습니다.' } 출력
// 8. error handling : # 404 _commentId에 해당하는 댓글이 존재하지 않을 경우 { message: '댓글 조회에 실패하였습니다.' } 출력
// router.delete('/posts/:postId/comments/:commentId', async (req, res, next) => {
//   const { postId, commentId } = req.params;
//   const { password } = req.body;

//   if (!postId, !commentId || !password) {
//       res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });
//   } else {
//       try {
//           const comment = await prisma.comments.findUnique({
//               where: {
//                   commentId,
//               },
//           });
//           if (!comment) {
//               res.status(404).json({ message: '댓글 조회에 실패하였습니다.' });
//           } else {
//               if (comment.password !== password) {
//                   res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
//               }
//               await prisma.comments.delete({
//                   where: {
//                       commentId,
//                       postId,
//                   },
//               });
//               res.status(200).json({ message: '댓글을 삭제하였습니다.' });
//           }
//       } catch (error) {
//           console.error(error);
//           next(error);
//       }
//   }
// });



export default router;

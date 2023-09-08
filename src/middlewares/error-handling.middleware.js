// ** "서버에서 에러가 발생하였습니다." 와 같은 추상적인 내용을 클라이언트에게 전달하도록 구현
// ** -> 무슨 말인지 잘 모르겠당

// src/middlewares/error-handling.middleware.js

export default function (err, req, res, next) {
  // 에러를 출력합니다.
  console.error(err);

  // 클라이언트에게 에러 메시지를 전달합니다.
  res.status(400).json({ errorMessage: "요청한 데이터 형식이 올바르지 않습니다." });
}

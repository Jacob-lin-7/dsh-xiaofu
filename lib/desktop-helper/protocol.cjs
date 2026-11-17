/**
 * helper → 宿主的消息格式。
 * petId 默认注入，避免 set-position / reset-position / reload-desktop 这类
 * 请求漏掉宠物标识后被宿主判成 pet not found。
 */
function buildMessage(petId, type, payload = {}, requestId) {
  return { petId, ...payload, type, requestId };
}

module.exports = { buildMessage };

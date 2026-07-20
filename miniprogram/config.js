/**
 * 全局配置
 *
 * 在手机上预览测试时，将 API_HOST 改为 Mac 的局域网 IP
 * 获取本机 IP 的命令：ipconfig getifaddr en0
 *
 * 手机测试示例：const API_HOST = 'http://192.168.1.105:8001'
 * 本机开发示例：const API_HOST = 'http://127.0.0.1:8001'
 */
const API_HOST = 'https://www.yinuoai.cloud'

export const CONFIG = {
  API_BASE_URL: API_HOST + '/api',
  WEB_BASE_URL: API_HOST,
}

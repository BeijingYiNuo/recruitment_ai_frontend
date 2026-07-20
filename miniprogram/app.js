/**
 * 晓聘 - 智能面试助手小程序
 * 全局入口
 */
import { auth } from './utils/auth'

App({
  globalData: {
    userInfo: null,
    token: '',
    pendingQrTicket: null,  // 扫码登录待确认的 ticket_id
  },

  onLaunch(options) {
    // 检查登录态
    const token = auth.getToken()
    if (token) {
      this.globalData.token = token
      const userInfo = auth.getUserInfo()
      if (userInfo) {
        this.globalData.userInfo = userInfo
      }
    }

    // 从小程序码扫码进入，保存 ticket_id
    this._handleScanScene(options)
  },

  onShow(options) {
    // 从后台切到前台也可能携带 scene（扫码进入）
    if (options && options.query && options.query.scene) {
      this._handleScanScene(options)
    }
  },

  /**
   * 处理从小程序码扫码进入的 scene 参数
   */
  _handleScanScene(options) {
    if (!options || !options.query) return
    const scene = options.query.scene
    if (!scene) return

    const ticketId = decodeURIComponent(scene)
    if (!ticketId) return

    this.globalData.pendingQrTicket = ticketId
    console.log('[扫码登录] 收到待确认 ticket:', ticketId)
  },

  setUserInfo(userInfo, token) {
    this.globalData.userInfo = userInfo
    this.globalData.token = token
    auth.saveToken(token)
    auth.saveUserInfo(userInfo)
  },

  logout() {
    this.globalData.userInfo = null
    this.globalData.token = ''
    auth.clear()
    wx.reLaunch({ url: '/pages/login/login' })
  },
})

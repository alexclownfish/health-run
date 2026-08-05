# 轻跑 / NFC 健康打卡小程序

项目分为两部分：

- `ui-prototype/`：之前完成的 H5 UI 原型，打开 `ui-prototype/index.html` 即可预览。
- `miniprogram/`：微信原生小程序源码，导入项目根目录到微信开发者工具即可运行。

## 导入方式

使用微信开发者工具打开当前仓库根目录，工具会读取 `project.config.json` 的 `miniprogramRoot` 配置。项目已配置正式 AppID，上传前需在开发者工具中登录拥有该小程序权限的微信账号。

## 已实现流程

路线首页 -> NFC 感应验证 -> 点击开始动作并完成计时 -> 必须拍照上传 -> 点位完成 -> 3/3 完赛凭证。当前线上版本临时保留 NFC 跳过入口用于测试；只跳过 NFC 读取，动作、照片上传和点位顺序仍严格校验。实体标签就绪后将 `utils/config.js` 中的 `allowNfcSkip` 改为 `false` 即可关闭。

进度、NFC、动作状态和照片路径使用本地 storage 保存。`wx.chooseMedia` 已接入真实相机/相册入口。项目使用小程序 AppID `wx44b333d3d8cef506`，照片通过云开发环境 `cloudbase-d7gfg8vr06572506e` 的对象存储上传；只有 `wx.cloud.uploadFile` 返回 `fileID` 后才会完成点位。头像与昵称使用微信授权控件，记录页日历基于系统日期动态生成。

## 测试

```bash
npm test
```

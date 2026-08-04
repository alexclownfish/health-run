# 轻跑 / NFC 健康打卡小程序

项目分为两部分：

- `ui-prototype/`：之前完成的 H5 UI 原型，打开 `ui-prototype/index.html` 即可预览。
- `miniprogram/`：微信原生小程序源码，导入项目根目录到微信开发者工具即可运行。

## 导入方式

使用微信开发者工具打开当前仓库根目录，工具会读取 `project.config.json` 的 `miniprogramRoot` 配置。当前使用 `touristappid` 作为占位 AppID，真机预览、云开发和发布前请替换为正式 AppID。

## 已实现流程

路线首页 -> NFC 感应模拟 -> 动作引导与计时 -> 相机/相册上传 -> 点位完成 -> 3/3 完赛凭证。

进度和照片临时路径使用本地 storage 保存。`wx.chooseMedia` 已接入真实相机/相册入口，NFC 当前保留可替换的模拟入口，便于没有 NFC 标签时联调 UI。

## 测试

```bash
npm test
```

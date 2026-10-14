# Research: 二维码使用提示

## Decision: 固定提示包装原文

采用原有纯文本二维码，在HRQ1数据之前加入用户指定的一行提示。无URL、跳转、服务器或加密；外部扫码仍读到完整内容。

**Rationale**: 最小化更改，五个点位的pointCode、qrId、qrToken保持不变，现有本地记录和云完赛摘要不迁移。
**Alternatives considered**: 静态提示网页需要域名和托管；替换为随机短码不解决外部显示提示的需求。

## Decision: 明确的新旧两种格式

发布清单分别保存新版payload和计算得到的legacyPayload；解析只移除固定提示加一个换行，再按原HRQ1规则和清单精确匹配。兼容LF/CRLF，不从任意文本中搜寻点位数据。

**Rationale**: 兼容原标牌且保留错误点位、未知、重复登记拒绝规则。

## Decision: 标准工具生成并独立解码

电脑端使用qrcode生成黑白PNG，4模块白边、整数像素模块；使用jsQR独立解码，pngjs读取像素。仅为开发依赖，不进入小程序代码。

**Rationale**: 验证真正的图片内容，避免中文编码、二维码损坏或点位图片对调的问题。

## Evidence & Limits

已审阅qr-tags.js、qr-validation.js和checkin.js。沿用现有wx.scanCode.result接口，不新增平台能力。外部软件显示和手机现场读码须真机验收；本地解码不等于全部扫码软件已验证。

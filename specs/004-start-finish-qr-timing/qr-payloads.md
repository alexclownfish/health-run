# 二维码制作原文

选择二维码生成器的“文本”类型，每个代码块是一张二维码，编码时不要加入中文名称、换行或 Markdown 标记。

## 起点（000）

```text
HRQ1|000|QR-START-A|9f4e8c2a7b1d6e3f5a0c9d8b7e6f1a2c
```

## 任务点 1（001，原码不变）

```text
HRQ1|001|QR-001-A|ced81f9f7eb9a66ad9e5bcd07d732613
```

## 任务点 2（002，原码不变）

```text
HRQ1|002|QR-002-A|6a75420f4b73f6b13b73679a280c0a2e
```

## 任务点 3（003，原码不变）

```text
HRQ1|003|QR-003-A|f8f3d159740d3cf8104f3aa5618302e6
```

## 终点（999）

```text
HRQ1|999|QR-FINISH-A|3c7a1e9b5d2f8a604e1c9b7d3f5a2e8c
```

内容与 `miniprogram/utils/qr-tags.js` 一致，只能用小程序内“扫码打卡”完成本地校验，不用于自动打开小程序。

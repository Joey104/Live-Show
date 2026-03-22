# Frontend_For_Admin - Live-Show 后台管理界面

## 项目概述

基于 **AdminLTE 3** 构建的后台管理系统，用于管理 Live-Show 直播平台的前台内容和运营数据。

**部署方式**: 本地化部署（所有资源已下载到本地，无需外网 CDN）

## 目录结构

```
Frontend_For_Admin/
├── assets/                    # 本地静态资源
│   ├── css/                  # CSS 文件
│   │   ├── adminlte.min.css  # AdminLTE 主题
│   │   ├── bootstrap.min.css # Bootstrap 4
│   │   └── fontawesome.min.css # FontAwesome 图标
│   ├── js/                   # JS 文件
│   │   ├── adminlte.min.js   # AdminLTE 脚本
│   │   ├── bootstrap.bundle.min.js # Bootstrap 脚本
│   │   └── jquery.min.js     # jQuery
│   └── webfonts/             # 字体文件
│       ├── fa-brands-400.woff2
│       ├── fa-regular-400.woff2
│       └── fa-solid-900.woff2
├── index.html                # 后台首页
├── package.json              # 项目配置
├── download-assets.sh        # 资源下载脚本
└── README.md                 # 本文件
```

## 功能规划

### 核心模块

| 模块 | 说明 | 优先级 |
|------|------|--------|
| 📊 Dashboard | 数据概览、实时统计 | P0 |
| 👥 用户管理 | 主播/观众账户管理 | P0 |
| 📺 直播管理 | 直播间审核、监控 | P0 |
| 💰 财务管理 | 充值、提现、分成 | P1 |
| 🎁 礼物管理 | 礼物配置、定价 | P1 |
| 📝 内容审核 | 弹幕、评论审核 | P1 |
| ⚙️ 系统设置 | 平台参数配置 | P2 |

## 技术栈

- **AdminLTE 3** - Bootstrap 4 管理后台模板
- **jQuery** - DOM 操作
- **Bootstrap 4** - UI 框架
- **FontAwesome 5** - 图标库

## 快速开始

### 方式一：直接打开（最简单）
```bash
cd Frontend_For_Admin
# 直接用浏览器打开 index.html
```

### 方式二：使用本地服务器（推荐）
```bash
cd Frontend_For_Admin
npx serve .
# 访问 http://localhost:3000
```

### 方式三：Python 简易服务器
```bash
cd Frontend_For_Admin
python3 -m http.server 8080
# 访问 http://localhost:8080
```

## AdminLTE 说明

本项目使用 **本地化部署** 的 AdminLTE 3，所有资源文件已下载到 `assets/` 目录，无需外网连接即可正常使用。

### 官方资源
- GitHub: https://github.com/ColorlibHQ/AdminLTE
- 文档: https://adminlte.io/docs/3.2/
- 演示: https://adminlte.io/themes/v3/

### 如何更新本地资源
如果未来需要更新 AdminLTE 版本，可以运行：
```bash
bash download-assets.sh
```

## 自定义主题色

当前主题色已设置为 Live-Show 品牌色（活力橙 #FF6B35），在 `index.html` 的 `<style>` 标签中修改：

```css
:root {
  --primary: #FF6B35;      /* 主色 */
  --primary-dark: #E85A2B; /* 深色 */
}
```

---
*创建于 2026-03-14*  
*开发者: Kimi Claw*

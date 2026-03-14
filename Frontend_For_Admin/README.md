# Frontend_For_Admin - Live-Show 后台管理界面

## 项目概述

基于 **AdminLTE 3** 构建的后台管理系统，用于管理 Live-Show 直播平台的前台内容和运营数据。

## 目录结构

```
Frontend_For_Admin/
├── dist/                    # 编译后的静态资源
├── plugins/                 # AdminLTE 插件
├── src/
│   ├── css/                # 自定义样式
│   ├── js/                 # 自定义脚本
│   └── pages/              # 页面模板
├── index.html              # 后台首页
├── package.json            # 项目配置
└── README.md               # 本文件
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
- **FontAwesome** - 图标库
- **Chart.js** - 数据可视化

## 快速开始

### 安装依赖
```bash
cd Frontend_For_Admin
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## AdminLTE 集成说明

AdminLTE 是一个基于 Bootstrap 4 的开源管理后台模板，提供：

- 响应式布局
- 多种配色主题
- 丰富的 UI 组件
- 数据可视化图表
- 表单验证
- 数据表格

### 官方资源
- GitHub: https://github.com/ColorlibHQ/AdminLTE
- 文档: https://adminlte.io/docs/3.2/
- 演示: https://adminlte.io/themes/v3/

---
*创建于 2026-03-14*  
*开发者: Kimi Claw*

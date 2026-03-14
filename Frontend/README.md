# 🎥 Live-Show Frontend

**項目**: Live-Show 直播平台前端  
**技術棧**: React 18 + TypeScript + Vite + Tailwind CSS  
**設計師**: Kimi Claw  
**日期**: 2026-03-14

---

## 📁 項目結構

```
frontend/
├── index.html              # HTML 入口
├── package.json            # 依賴配置
├── tsconfig.json           # TypeScript 配置
├── tsconfig.node.json      # Node 配置
├── vite.config.ts          # Vite 配置
├── tailwind.config.js      # Tailwind 配置
├── postcss.config.js       # PostCSS 配置
└── src/
    ├── main.tsx            # React 入口
    ├── App.tsx             # 根組件
    ├── index.css           # 全局樣式
    ├── vite-env.d.ts       # 類型聲明
    ├── components/         # 公共組件
    │   ├── Layout.tsx      # 布局組件
    │   ├── Navbar.tsx      # 頂部導航
    │   └── BottomNav.tsx   # 底部導航（移動端）
    ├── pages/              # 頁面組件
    │   ├── Home.tsx        # 首頁
    │   ├── LiveRoom.tsx    # 直播間
    │   ├── Profile.tsx     # 個人中心
    │   ├── Discover.tsx    # 發現/搜索
    │   └── Leaderboard.tsx # 排行榜
    ├── types/              # TypeScript 類型
    │   └── index.ts
    └── utils/              # 工具函數
        └── index.ts
```

---

## 🎨 設計規範

### 色彩系統

| 名稱 | 色值 | 用途 |
|------|------|------|
| Primary | `#FF6B35` | 主色（按鈕、高亮） |
| Secondary | `#6C5CE7` | 輔助色（VIP、特殊） |
| Accent | `#00D4AA` | 強調色（成功、在線） |
| Danger | `#FF4757` | 危險/錯誤 |
| Dark BG | `#0F0F0F` | 深色背景 |
| Dark Card | `#1A1A1A` | 卡片背景 |

### 字體

- **標題**: Inter + Noto Sans TC
- **正文**: Inter + Noto Sans TC
- **數字**: JetBrains Mono

---

## 🚀 快速開始

### 安裝依賴

```bash
cd frontend
npm install
```

### 開發模式

```bash
npm run dev
```

訪問 http://localhost:3000

### 構建生產版本

```bash
npm run build
```

---

## 📱 頁面清單

| 路由 | 頁面 | 說明 |
|------|------|------|
| `/` | 首頁 | 推薦直播、分類、直播列表 |
| `/room/:id` | 直播間 | 視頻播放、聊天、禮物 |
| `/profile/:id` | 個人中心 | 用戶信息、統計、歷史 |
| `/discover` | 發現 | 搜索、熱搜、分類 |
| `/leaderboard` | 排行榜 | 主播榜、打賞榜 |

---

## 🎯 核心功能

### 已實現
- ✅ 響應式布局（桌面 + 移動端）
- ✅ 深色主題設計
- ✅ 導航系統
- ✅ 首頁直播列表
- ✅ 直播間界面（含聊天、禮物）
- ✅ 個人中心
- ✅ 發現頁
- ✅ 排行榜

### 待實現（需要後端支持）
- 🔲 WebSocket 實時聊天
- 🔲 WebRTC/HLS 視頻播放
- 🔲 用戶認證系統
- 🔲 禮物打賞功能
- 🔲 支付集成

---

## 📦 主要依賴

```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.22.0",
  "zustand": "^4.5.0",
  "@tanstack/react-query": "^5.24.0",
  "axios": "^1.6.7",
  "socket.io-client": "^4.7.4",
  "hls.js": "^1.5.7",
  "framer-motion": "^11.0.5",
  "lucide-react": "^0.344.0",
  "tailwindcss": "^3.4.1"
}
```

---

## 🔧 開發建議

### 添加新頁面

1. 在 `src/pages/` 創建組件
2. 在 `src/App.tsx` 添加路由
3. 在導航中添加入口（如需要）

### API 集成

使用 React Query:

```typescript
import { useQuery } from '@tanstack/react-query'

const { data, isLoading } = useQuery({
  queryKey: ['streams'],
  queryFn: () => api.get('/streams').then(res => res.data)
})
```

### 狀態管理

使用 Zustand:

```typescript
import { create } from 'zustand'

interface UserState {
  user: User | null
  setUser: (user: User) => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user })
}))
```

---

## 📝 注意事項

1. **圖片資源**: 目前使用 placeholder，需要替換為真實圖片
2. **API 地址**: 開發時代理到 `localhost:5102`，生產環境需配置
3. **WebSocket**: 聊天功能需要後端 WebSocket 服務
4. **視頻播放**: 集成 hls.js 或 WebRTC

---

**設計文檔**: 參考 `LiveShow_UI_Design.md`

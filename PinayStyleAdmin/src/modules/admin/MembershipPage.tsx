/**
 * @file MembershipPage.tsx
 * @description Membership level management workspace: levels list, upgrade rules, multipliers, calculators and blueprint.
 */

import { useMemo, useState } from 'react'
import {
  Users,
  BadgePercent,
  Settings2,
  Calculator as CalculatorIcon,
  ArrowUpRight,
  PlusCircle,
  Edit3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { FeatureList, type FeatureItem } from '../../components/common/FeatureList'

/**
 * @description 可切換的子頁籤 ID。
 */
type MembershipTabId = 'overview' | 'levels' | 'rules' | 'calculator' | 'blueprint'

/**
 * @description 會員等級適用對象。
 */
type LevelAudience = 'Player' | 'Broadcaster' | 'Both'

/**
 * @description 會員等級狀態。
 */
type LevelStatus = 'active' | 'inactive'

/**
 * @description 會員等級資料模型。
 */
interface MembershipLevel {
  /** 唯一 ID。 */
  id: string
  /** 等級代碼（例如：L1 / VIP1）。 */
  code: string
  /** 顯示名稱。 */
  name: string
  /** 適用對象：Player / Broadcaster / Both。 */
  audience: LevelAudience
  /** 升級門檻（累積充值點數）。 */
  thresholdRecharge: number
  /** 升級門檻（累積消費點數）。 */
  thresholdSpend: number
  /** 等級權益：點數獲取倍率。 */
  pointsMultiplier: number
  /** 等級權益：禮物收益加成倍率。 */
  giftRevenueMultiplier: number
  /** 等級權益：Bonus 發放倍率。 */
  bonusMultiplier: number
  /** 是否啟用。 */
  status: LevelStatus
  /** 排序權重（數字越小越前面）。 */
  order: number
  /** 簡短備註或權益摘要。 */
  note?: string
}

/**
 * @description 會員等級編輯表單狀態。
 */
interface LevelFormState {
  code: string
  name: string
  audience: LevelAudience
  thresholdRecharge: string
  thresholdSpend: string
  pointsMultiplier: string
  giftRevenueMultiplier: string
  bonusMultiplier: string
  status: LevelStatus
  note: string
}

/**
 * @description 會員等級升降級與權益規則配置。
 */
interface LevelRuleConfig {
  /** 升級依據：充值 / 消費 / 混合。 */
  upgradeMode: 'recharge' | 'spend' | 'mixed'
  /** 計算窗口（天），例如最近 30 / 90 / 365 天內。 */
  windowDays: number
  /** 是否啟用自動降級。 */
  autoDowngrade: boolean
  /** 降級前緩衝天數。 */
  downgradeGraceDays: number
  /** 是否每年重置等級。 */
  resetYearly: boolean
  /** 是否允許人工調整（客服 / 營運）。 */
  allowManualAdjust: boolean
  /** 等級權益試算：預設禮物收益加成倍率。 */
  defaultGiftMultiplier: number
  /** 等級權益試算：預設 Bonus 發放倍率。 */
  defaultBonusMultiplier: number
  /** 備註 / 實作建議。 */
  note: string
}

/**
 * @description 等級權益試算表單狀態。
 */
interface LevelCalculatorState {
  /** 試算類型：禮物收益或 Bonus 發放。 */
  type: 'giftRevenue' | 'bonus'
  /** 基礎金額 / 點數。 */
  baseAmount: string
  /** 選擇的會員等級代碼。 */
  levelCode: string
}

/**
 * @description 產生初始會員等級範例資料。
 */
function createInitialLevels(): MembershipLevel[] {
  return [
    {
      id: 'L1',
      code: 'L1',
      name: '一般會員 L1',
      audience: 'Both',
      thresholdRecharge: 0,
      thresholdSpend: 0,
      pointsMultiplier: 1,
      giftRevenueMultiplier: 1,
      bonusMultiplier: 1,
      status: 'active',
      order: 1,
      note: '預設等級，無額外加成，作為所有新註冊用戶起點。',
    },
    {
      id: 'L2',
      code: 'L2',
      name: '進階會員 L2',
      audience: 'Both',
      thresholdRecharge: 10_000,
      thresholdSpend: 5_000,
      pointsMultiplier: 1.1,
      giftRevenueMultiplier: 1.05,
      bonusMultiplier: 1.1,
      status: 'active',
      order: 2,
      note: '適合輕度付費用戶，提供小幅點數與 Bonus 加成。',
    },
    {
      id: 'L3',
      code: 'L3',
      name: '高級會員 L3',
      audience: 'Both',
      thresholdRecharge: 50_000,
      thresholdSpend: 30_000,
      pointsMultiplier: 1.25,
      giftRevenueMultiplier: 1.15,
      bonusMultiplier: 1.25,
      status: 'active',
      order: 3,
      note: '中高價值會員，建議同步開通專屬客服與活動白名單。',
    },
    {
      id: 'VIP1',
      code: 'VIP1',
      name: 'VIP 主播',
      audience: 'Broadcaster',
      thresholdRecharge: 0,
      thresholdSpend: 100_000,
      pointsMultiplier: 1.3,
      giftRevenueMultiplier: 1.3,
      bonusMultiplier: 1.4,
      status: 'active',
      order: 4,
      note: '針對主播端的 VIP 等級，配合抽成比例與簽約制度。',
    },
  ]
}

/**
 * @description 產生預設的等級規則配置。
 */
function createDefaultRuleConfig(): LevelRuleConfig {
  return {
    upgradeMode: 'mixed',
    windowDays: 90,
    autoDowngrade: true,
    downgradeGraceDays: 30,
    resetYearly: false,
    allowManualAdjust: true,
    defaultGiftMultiplier: 1.2,
    defaultBonusMultiplier: 1.15,
    note: '建議依據平台營運策略調整窗口天數與是否自動降級，並確保所有變動寫入 Audit Log。',
  }
}

/**
 * @description Membership management main component, mirroring PlayersPage style:
 * - 子頁籤：總覽 / 等級列表 / 規則配置 / 試算工具 / 規格藍圖。
 * - 含可實際操作的子表單：等級新增 / 編輯抽屜、規則編輯抽屜、等級權益試算表單。
 */
export function MembershipPage() {
  const [activeTab, setActiveTab] = useState<MembershipTabId>('overview')

  /** 等級列表本地狀態，用於模擬管理操作。 */
  const [levels, setLevels] = useState<MembershipLevel[]>(() => createInitialLevels())

  /** 目前正在編輯的等級（null 表示新增）。 */
  const [editingLevel, setEditingLevel] = useState<MembershipLevel | null>(null)
  /** 等級編輯表單狀態。 */
  const [levelForm, setLevelForm] = useState<LevelFormState | null>(null)

  /** 等級規則實際生效配置。 */
  const [ruleConfig, setRuleConfig] = useState<LevelRuleConfig>(() =>
    createDefaultRuleConfig(),
  )
  /** 等級規則編輯中的暫存草稿。 */
  const [ruleDraft, setRuleDraft] = useState<LevelRuleConfig | null>(null)

  /** 等級權益試算表單狀態。 */
  const [calculator, setCalculator] = useState<LevelCalculatorState>({
    type: 'giftRevenue',
    baseAmount: '',
    levelCode: 'L1',
  })

  /** 等級列表分頁狀態（示意）。 */
  const [page, setPage] = useState(1)
  const pageSize = 5

  /** 等級列表依 order 排序後再分頁。 */
  const sortedLevels = useMemo(
    () => [...levels].sort((a, b) => a.order - b.order),
    [levels],
  )

  const totalPages = Math.max(1, Math.ceil(sortedLevels.length / pageSize))
  const paginatedLevels = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedLevels.slice(start, start + pageSize)
  }, [sortedLevels, page])

  /** 依等級統計一些摘要資訊，用於 Overview 區塊。 */
  const overviewStats = useMemo(
    () => ({
      activeCount: levels.filter((l) => l.status === 'active').length,
      inactiveCount: levels.filter((l) => l.status === 'inactive').length,
      playerLevels: levels.filter((l) => l.audience !== 'Broadcaster').length,
      broadcasterLevels: levels.filter((l) => l.audience !== 'Player').length,
    }),
    [levels],
  )

  /**
   * @description 開啟「新增等級」抽屜。
   */
  const handleCreateLevel = () => {
    setEditingLevel(null)
    setLevelForm({
      code: '',
      name: '',
      audience: 'Both',
      thresholdRecharge: '',
      thresholdSpend: '',
      pointsMultiplier: '1',
      giftRevenueMultiplier: '1',
      bonusMultiplier: '1',
      status: 'active',
      note: '',
    })
  }

  /**
   * @description 開啟「編輯等級」抽屜。
   */
  const handleEditLevel = (level: MembershipLevel) => {
    setEditingLevel(level)
    setLevelForm({
      code: level.code,
      name: level.name,
      audience: level.audience,
      thresholdRecharge: String(level.thresholdRecharge),
      thresholdSpend: String(level.thresholdSpend),
      pointsMultiplier: String(level.pointsMultiplier),
      giftRevenueMultiplier: String(level.giftRevenueMultiplier),
      bonusMultiplier: String(level.bonusMultiplier),
      status: level.status,
      note: level.note ?? '',
    })
  }

  /**
   * @description 關閉等級編輯抽屜並重置表單。
   */
  const handleCloseLevelDrawer = () => {
    setEditingLevel(null)
    setLevelForm(null)
  }

  /**
   * @description 儲存等級編輯（新增或修改），僅更新前端狀態。
   */
  const handleSaveLevel = async () => {
    if (!levelForm) return

    const code = levelForm.code.trim()
    const name = levelForm.name.trim()

    if (!code || !name) {
      await showAlert('請填寫「等級代碼」與「等級名稱」。')
      return
    }

    const thresholdRecharge = Number(levelForm.thresholdRecharge || '0')
    const thresholdSpend = Number(levelForm.thresholdSpend || '0')
    const pointsMultiplier = Number(levelForm.pointsMultiplier || '1')
    const giftRevenueMultiplier = Number(levelForm.giftRevenueMultiplier || '1')
    const bonusMultiplier = Number(levelForm.bonusMultiplier || '1')

    if (
      Number.isNaN(thresholdRecharge) ||
      Number.isNaN(thresholdSpend) ||
      Number.isNaN(pointsMultiplier) ||
      Number.isNaN(giftRevenueMultiplier) ||
      Number.isNaN(bonusMultiplier)
    ) {
      await showAlert('請確認門檻與倍率欄位皆為數字。')
      return
    }

    // 檢查代碼是否重複（新增時 or 修改為其他已存在代碼）。
    const duplicate = levels.find(
      (l) => l.code.toLowerCase() === code.toLowerCase() && l.id !== editingLevel?.id,
    )
    if (duplicate) {
      await showAlert(`等級代碼「${code}」已存在，請使用其他代碼。`)
      return
    }

    if (editingLevel) {
      // 編輯既有等級
      const updated: MembershipLevel = {
        ...editingLevel,
        code,
        name,
        audience: levelForm.audience,
        thresholdRecharge: Math.max(0, thresholdRecharge),
        thresholdSpend: Math.max(0, thresholdSpend),
        pointsMultiplier,
        giftRevenueMultiplier,
        bonusMultiplier,
        status: levelForm.status,
        note: levelForm.note.trim() || undefined,
      }
      setLevels((prev) => prev.map((l) => (l.id === editingLevel.id ? updated : l)))
    } else {
      // 新增等級，order 取現有最大 + 1
      const maxOrder = levels.reduce((max, l) => Math.max(max, l.order), 0)
      const newLevel: MembershipLevel = {
        id: code,
        code,
        name,
        audience: levelForm.audience,
        thresholdRecharge: Math.max(0, thresholdRecharge),
        thresholdSpend: Math.max(0, thresholdSpend),
        pointsMultiplier,
        giftRevenueMultiplier,
        bonusMultiplier,
        status: levelForm.status,
        order: maxOrder + 1,
        note: levelForm.note.trim() || undefined,
      }
      setLevels((prev) => [...prev, newLevel])
    }

    handleCloseLevelDrawer()
  }

  /**
   * @description 開啟規則編輯抽屜，將現有 ruleConfig 拷貝為草稿。
   */
  const handleOpenRuleDrawer = () => {
    setRuleDraft({ ...ruleConfig })
  }

  /**
   * @description 關閉規則編輯抽屜。
   */
  const handleCloseRuleDrawer = () => {
    setRuleDraft(null)
  }

  /**
   * @description 儲存規則配置（覆寫當前 ruleConfig，僅更新前端狀態）。
   */
  const handleSaveRuleConfig = async () => {
    if (!ruleDraft) return

    if (ruleDraft.windowDays <= 0) {
      await showAlert('計算窗口（天數）需為大於 0 的數字。')
      return
    }

    if (ruleDraft.autoDowngrade && ruleDraft.downgradeGraceDays < 0) {
      await showAlert('降級緩衝天數不可為負數。')
      return
    }

    setRuleConfig({ ...ruleDraft })
    setRuleDraft(null)
  }

  /**
   * @description 根據試算表單與等級資訊計算預估權益結果。
   */
  const calculatorResult = useMemo(() => {
    const raw = calculator.baseAmount.trim()
    const amount = Number(raw)
    if (!raw || Number.isNaN(amount) || amount <= 0) {
      return null
    }
    const level = levels.find((l) => l.code === calculator.levelCode)
    if (!level) return null

    if (calculator.type === 'giftRevenue') {
      const multiplier = level.giftRevenueMultiplier || ruleConfig.defaultGiftMultiplier
      const estimated = amount * multiplier
      return {
        label: '預估禮物收益（含加成）',
        base: amount,
        multiplier,
        estimated,
      }
    }

    const multiplier = level.bonusMultiplier || ruleConfig.defaultBonusMultiplier
    const estimated = amount * multiplier
    return {
      label: '預估 Bonus 發放點數',
      base: amount,
      multiplier,
      estimated,
    }
  }, [calculator, levels, ruleConfig])

  /**
   * @description 本頁功能清單，作為規格藍圖 tab 使用。
   */
  const features: FeatureItem[] = [
    {
      id: 19,
      name: '會員等級列表',
      description:
        '列出等級名稱、達成門檻（累積充值 / 消費 / 任務）、當前狀態（啟用 / 停用）。',
      tag: '列表',
    },
    {
      id: 20,
      name: '升級 / 降級（批量）',
      description:
        '支援 Player / Broadcaster 分流批次調整等級與生效時間，需顯示等級變更前後對照。',
      tag: '高風險',
    },
    {
      id: 21,
      name: '等級提成 / 發放比例編輯',
      description:
        '依會員等級維度設定活動獎勵 / 推薦分潤等倍率，建議用矩陣或可編輯表格呈現。',
      tag: '配置',
    },
    {
      id: 22,
      name: '兌換 / 發放預覽計算',
      description:
        '根據等級與倍率即時計算預估入帳點數與 Bonus 成本，避免錯誤配置造成損失。',
      tag: '預覽',
    },
    {
      id: 23,
      name: '等級權益檢視',
      description:
        '彙總展示各等級的返利、加成、解鎖功能與限制規則，協助營運與客服快速查詢。',
      tag: '說明',
    },
    {
      id: 24,
      name: '等級變更 Audit Log',
      description:
        '所有升級 / 降級 / 人工調整必須記錄操作人、來源模組、理由與前後差異，支援匯出。',
      tag: 'Audit',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Sub tabs header: 總覽 / 等級列表 / 規則配置 / 試算工具 / 規格清單 */}
      <section className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-xs font-semibold text-slate-100">會員等級管理</span>
          <span className="text-[10px] text-slate-500">
            依「等級列表」、「升降級規則」、「試算工具」與「規格藍圖」拆分工作區。
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={[
              'rounded-full px-2 py-0.5',
              activeTab === 'overview'
                ? 'bg-slate-700 text-white'
                : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            總覽
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('levels')}
            className={[
              'rounded-full px-2 py-0.5',
              activeTab === 'levels'
                ? 'bg-sky-600 text-white'
                : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            等級列表
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={[
              'rounded-full px-2 py-0.5',
              activeTab === 'rules'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            升降級規則
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={[
              'rounded-full px-2 py-0.5',
              activeTab === 'calculator'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            等級權益試算
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blueprint')}
            className={[
              'rounded-full px-2 py-0.5',
              activeTab === 'blueprint'
                ? 'bg-slate-700 text-white'
                : 'text-slate-200 hover:bg-slate-800/80',
            ].join(' ')}
          >
            功能清單（規格）
          </button>
        </div>
      </section>

      {/* Tab: 總覽 */}
      {activeTab === 'overview' && (
        <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <BadgePercent className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">會員等級配置總覽</span>
            </div>
            <span className="text-[10px] text-slate-500">
              等級變動建議一律納入 RBAC 與 Audit Log 控制。
            </span>
          </header>
          <p className="text-[11px] text-slate-400">
            此頁聚焦等級結構與權益配置的「全貌」，協助 PM / 營運 / 客服快速理解目前的等級設計與調整策略。
            實作時建議搭配「等級變更報表」與「高價值用戶分群」功能。
          </p>
          <div className="grid gap-3 md:grid-cols-4 text-[11px]">
            <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/80 p-3">
              <div className="text-slate-400">啟用中等級數量</div>
              <div className="text-lg font-semibold text-slate-50">
                {overviewStats.activeCount}
              </div>
              <p className="text-[10px] text-slate-500">
                目前平台實際對外曝光與使用中的會員等級數量。
              </p>
            </div>
            <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/80 p-3">
              <div className="text-slate-400">停用中等級數量</div>
              <div className="text-lg font-semibold text-slate-50">
                {overviewStats.inactiveCount}
              </div>
              <p className="text-[10px] text-slate-500">
                建議定期清理或改版，避免歷史等級規則干擾新方案。
              </p>
            </div>
            <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/80 p-3">
              <div className="text-slate-400">Player 端等級數量</div>
              <div className="text-lg font-semibold text-slate-50">
                {overviewStats.playerLevels}
              </div>
              <p className="text-[10px] text-slate-500">
                影響一般玩家的返利與任務門檻，建議維持 3–5
                段，避免過於複雜。
              </p>
            </div>
            <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/80 p-3">
              <div className="text-slate-400">Broadcaster 端等級數量</div>
              <div className="text-lg font-semibold text-slate-50">
                {overviewStats.broadcasterLevels}
              </div>
              <p className="text-[10px] text-slate-500">
                影響主播端抽成與簽約策略，通常與合約與風控政策綁定。
              </p>
            </div>
          </div>

          <section className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-900/80 p-3 text-[11px]">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-200">
                <Settings2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-semibold">當前升降級規則摘要</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('rules')}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-600/80 bg-slate-950/80 px-2 py-1 text-[10px] text-emerald-100 hover:bg-emerald-600/80 hover:text-white"
              >
                前往編輯
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </header>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-slate-400">升級依據</div>
                <div className="text-slate-100">
                  {ruleConfig.upgradeMode === 'recharge'
                    ? '僅依累積充值'
                    : ruleConfig.upgradeMode === 'spend'
                    ? '僅依累積消費'
                    : '充值 + 消費混合計算'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-slate-400">計算窗口</div>
                <div className="text-slate-100">{ruleConfig.windowDays} 天滾動窗口</div>
              </div>
              <div className="space-y-1">
                <div className="text-slate-400">自動降級</div>
                <div className="text-slate-100">
                  {ruleConfig.autoDowngrade
                    ? `啟用，自動降級前緩衝 ${ruleConfig.downgradeGraceDays} 天`
                    : '關閉自動降級，僅人工調整'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-slate-400">人工調整</div>
                <div className="text-slate-100">
                  {ruleConfig.allowManualAdjust
                    ? '允許客服 / 營運人工升降級，需搭配 RBAC 與 Audit Log'
                    : '不允許人工調整，只能由系統自動變更'}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">{ruleConfig.note}</p>
          </section>
        </section>
      )}

      {/* Tab: 等級列表 + 新增 / 編輯抽屜 */}
      {activeTab === 'levels' && (
        <section className="space-y-3 rounded-2xl border border-sky-700/70 bg-slate-950/80 p-4">
          <header className="mb-1 flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <BadgePercent className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">會員等級列表（示意）</span>
              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-100">
                支援新增 / 編輯等級、設定門檻與倍率，僅示意前端流程。
              </span>
            </div>
            <button
              type="button"
              onClick={handleCreateLevel}
              className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-sky-500"
            >
              <PlusCircle className="h-3 w-3" />
              新增等級
            </button>
          </header>

          <div className="overflow-hidden rounded-xl border border-sky-700/60 bg-slate-950/80">
            <table className="min-w-full border-collapse text-[11px]">
              <thead className="bg-slate-900/90 text-sky-100">
                <tr>
                  <th className="w-8 border-b border-sky-700/60 px-2 py-2 text-left">#</th>
                  <th className="border-b border-sky-700/60 px-2 py-2 text-left">等級</th>
                  <th className="border-b border-sky-700/60 px-2 py-2 text-left">適用對象</th>
                  <th className="border-b border-sky-700/60 px-2 py-2 text-right">
                    充值門檻
                  </th>
                  <th className="border-b border-sky-700/60 px-2 py-2 text-right">
                    消費門檻
                  </th>
                  <th className="border-b border-sky-700/60 px-2 py-2 text-right">
                    點數倍率
                  </th>
                  <th className="border-b border-sky-700/60 px-2 py-2 text-right">
                    禮物加成
                  </th>
                  <th className="border-b border-sky-700/60 px-2 py-2 text-right">
                    Bonus 倍率
                  </th>
                  <th className="border-b border-sky-700/60 px-2 py-2 text-left">狀態</th>
                  <th className="border-b border-sky-700/60 px-2 py-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLevels.map((level) => (
                  <tr
                    key={level.id}
                    className="border-b border-sky-800/60 text-slate-50 last:border-b-0"
                  >
                    <td className="px-2 py-1.5 text-slate-300">{level.order}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {level.name} ({level.code})
                        </span>
                        {level.note && (
                          <span className="text-[10px] text-slate-400">{level.note}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-slate-200">
                      {level.audience === 'Both'
                        ? 'Player + Broadcaster'
                        : level.audience === 'Player'
                        ? 'Player'
                        : 'Broadcaster'}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {level.thresholdRecharge.toLocaleString()}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {level.thresholdSpend.toLocaleString()}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      x{level.pointsMultiplier.toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      x{level.giftRevenueMultiplier.toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      x{level.bonusMultiplier.toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className={[
                          'rounded-full px-2 py-0.5 text-[10px]',
                          level.status === 'active'
                            ? 'bg-emerald-500/25 text-emerald-100'
                            : 'bg-slate-600/40 text-slate-100',
                        ].join(' ')}
                      >
                        {level.status === 'active' ? '啟用' : '停用'}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleEditLevel(level)}
                        className="inline-flex items-center gap-0.5 rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] text-slate-100 hover:bg-sky-600/80 hover:text-white"
                      >
                        <Edit3 className="h-3 w-3" />
                        編輯
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedLevels.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-6 text-center text-[11px] text-sky-100/80"
                    >
                      目前尚未設定任何會員等級。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <footer className="flex items-center justify-between border-t border-sky-700/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
              <div>
                總等級數：{sortedLevels.length} · 每頁 {pageSize} 筆
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3 w-3" />
                  上一頁
                </button>
                <span>
                  第 {page} / {totalPages} 頁
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-100 disabled:opacity-40"
                >
                  下一頁
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </footer>
          </div>
        </section>
      )}

      {/* Tab: 升降級規則配置 + 規則編輯抽屜 */}
      {activeTab === 'rules' && (
        <section className="space-y-3 rounded-2xl border border-emerald-600/70 bg-slate-950/80 p-4">
          <header className="mb-1 flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold">升級 / 降級規則配置</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-100">
                僅示意前端配置畫面，實際規則需由後端實作並嚴格控管。
              </span>
            </div>
          </header>

          <div className="grid gap-3 md:grid-cols-2 text-[11px]">
            <div className="space-y-2 rounded-xl border border-emerald-600/60 bg-slate-950/80 p-3">
              <div className="text-[11px] font-semibold text-emerald-100">升級規則</div>
              <ul className="list-disc space-y-1 pl-4 text-emerald-50">
                <li>
                  升級依據：
                  {ruleConfig.upgradeMode === 'recharge'
                    ? '僅累積充值'
                    : ruleConfig.upgradeMode === 'spend'
                    ? '僅累積消費'
                    : '累積充值 + 累積消費的加總或加權'}。
                </li>
                <li>計算窗口：最近 {ruleConfig.windowDays} 天內的有效行為。</li>
                <li>
                  建議實作：
                  <span className="text-emerald-300">
                    每日批次 Job + 實時 Cache 更新，避免每次查詢都重算。
                  </span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 rounded-xl border border-amber-500/60 bg-slate-950/80 p-3">
              <div className="text-[11px] font-semibold text-amber-100">降級與重置</div>
              <ul className="list-disc space-y-1 pl-4 text-amber-50">
                <li>
                  自動降級：
                  {ruleConfig.autoDowngrade
                    ? `啟用（未達門檻連續 ${ruleConfig.downgradeGraceDays} 天後降級）。`
                    : '關閉（僅人工操作）。'}
                </li>
                <li>
                  等級年度重置：
                  {ruleConfig.resetYearly ? '啟用，建議搭配年度活動。' : '關閉，一般不重置。'}
                </li>
                <li>所有降級建議透過站內信 / Push 通知提醒用戶。</li>
              </ul>
            </div>
          </div>

          <section className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-900/80 p-3 text-[11px]">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-200">
                <CalculatorIcon className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-semibold">預設倍率配置摘要</span>
              </div>
              <button
                type="button"
                onClick={handleOpenRuleDrawer}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-600/80 bg-slate-950/80 px-2 py-1 text-[10px] text-emerald-100 hover:bg-emerald-600/80 hover:text-white"
              >
                編輯規則
              </button>
            </header>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-slate-400">預設禮物收益加成倍率</div>
                <div className="text-slate-100">
                  x{ruleConfig.defaultGiftMultiplier.toFixed(2)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-slate-400">預設 Bonus 發放倍率</div>
                <div className="text-slate-100">
                  x{ruleConfig.defaultBonusMultiplier.toFixed(2)}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              以上為「無個別等級覆蓋設定時」所採用的全局預設倍率；實作時建議在資料庫中拆分「全局配置」與「等級覆蓋」兩層。
            </p>
          </section>
        </section>
      )}

      {/* Tab: 等級權益試算工具 */}
      {activeTab === 'calculator' && (
        <section className="space-y-3 rounded-2xl border border-indigo-600/70 bg-slate-950/80 p-4">
          <header className="mb-1 flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <CalculatorIcon className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-semibold">等級權益試算工具</span>
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-100">
                依會員等級與倍率試算禮物收益或 Bonus 發放點數。
              </span>
            </div>
          </header>

          <div className="grid gap-3 md:grid-cols-2 text-[11px]">
            <form
              className="space-y-3 rounded-xl border border-indigo-600/70 bg-slate-950/80 p-3"
              onSubmit={(e) => {
                e.preventDefault()
              }}
            >
              <div className="space-y-1">
                <label className="block text-[11px] text-indigo-100">試算類型</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCalculator((prev) => ({ ...prev, type: 'giftRevenue' }))
                    }
                    className={[
                      'flex-1 rounded-full px-2 py-1 text-[10px]',
                      calculator.type === 'giftRevenue'
                        ? 'bg-indigo-600 text-white'
                        : 'border border-indigo-700/80 bg-slate-900/80 text-indigo-100 hover:bg-slate-800/80',
                    ].join(' ')}
                  >
                    禮物收益加成
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalculator((prev) => ({ ...prev, type: 'bonus' }))}
                    className={[
                      'flex-1 rounded-full px-2 py-1 text-[10px]',
                      calculator.type === 'bonus'
                        ? 'bg-indigo-600 text-white'
                        : 'border border-indigo-700/80 bg-slate-900/80 text-indigo-100 hover:bg-slate-800/80',
                    ].join(' ')}
                  >
                    Bonus 發放
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-indigo-100">
                  基礎金額 / 點數
                </label>
                <input
                  value={calculator.baseAmount}
                  onChange={(e) =>
                    setCalculator((prev) => ({ ...prev, baseAmount: e.target.value }))
                  }
                  inputMode="decimal"
                  className="h-7 w-full rounded-md border border-indigo-700/80 bg-slate-950/80 px-2 text-[11px] text-indigo-50 outline-none focus:border-indigo-400"
                  placeholder="請輸入欲試算的金額 / 點數"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-indigo-100">會員等級</label>
                <select
                  value={calculator.levelCode}
                  onChange={(e) =>
                    setCalculator((prev) => ({ ...prev, levelCode: e.target.value }))
                  }
                  className="h-7 w-full rounded-md border border-indigo-700/80 bg-slate-950/80 px-2 text-[11px] text-indigo-50 outline-none focus:border-indigo-400"
                >
                  {sortedLevels.map((level) => (
                    <option key={level.code} value={level.code}>
                      {level.name} ({level.code})
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[10px] text-indigo-200/80">
                實作時可將此試算工具提供給營運 / 客服與 BD
                使用，以便快速評估新等級方案的成本與收益。
              </p>
            </form>

            <section className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-900/80 p-3 text-[11px] text-slate-200">
              <div className="text-xs font-semibold text-slate-100">試算結果</div>
              {calculatorResult ? (
                <>
                  <div className="rounded-lg border border-slate-700/80 bg-slate-950/90 px-3 py-2 text-[11px]">
                    <div className="text-[11px] font-semibold text-slate-100">
                      {calculatorResult.label}
                    </div>
                    <div className="mt-1 grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <div className="text-slate-400">基礎金額</div>
                        <div className="font-mono text-slate-50">
                          {calculatorResult.base.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">使用倍率</div>
                        <div className="font-mono text-slate-50">
                          x{calculatorResult.multiplier.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">預估結果</div>
                        <div className="font-mono text-slate-50">
                          {calculatorResult.estimated.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    以上僅為前端示意計算；正式環境建議由後端提供專用試算 API，確保與實際結算邏輯一致，並可記錄詢問紀錄。
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-slate-400">
                  請先輸入大於 0 的基礎金額 / 點數，即可看到依不同等級與倍率計算出的預估結果。
                </p>
              )}
            </section>
          </div>
        </section>
      )}

      {/* Tab: 功能清單（規格藍圖） */}
      {activeTab === 'blueprint' && (
        <FeatureList
          title="會員等級管理功能清單"
          subtitle="協助 PM / 財務 / 風控對齊會員等級與收益邏輯。"
          items={features}
        />
      )}

      {/* 抽屜：會員等級新增 / 編輯表單 */}
      {levelForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-sky-700/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-sky-700/70 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-sky-100">
                  <BadgePercent className="h-3.5 w-3.5 text-sky-400" />
                  <span className="font-semibold">
                    {editingLevel ? '編輯會員等級' : '新增會員等級'}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-sky-200/80">
                  {editingLevel
                    ? `${editingLevel.name} (${editingLevel.code})`
                    : '建立新的會員等級，並設定門檻與倍率。'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseLevelDrawer}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-sky-700/80 bg-slate-900/80 text-sky-200 hover:border-sky-400 hover:text-sky-100"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-sky-50">
              <p className="mb-3 text-[10px] text-sky-200/80">
                此處僅示意「等級基本資料維護」表單，實務上建議將
                RBAC、審核流程與版本管理一併納入設計，避免直接覆寫線上等級規則。
              </p>

              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSaveLevel()
                }}
              >
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-sky-100">等級代碼</label>
                    <input
                      value={levelForm.code}
                      onChange={(e) =>
                        setLevelForm((prev) =>
                          prev ? { ...prev, code: e.target.value.toUpperCase() } : prev,
                        )
                      }
                      className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400"
                      placeholder="例如：L1 / VIP1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-sky-100">等級名稱</label>
                    <input
                      value={levelForm.name}
                      onChange={(e) =>
                        setLevelForm((prev) =>
                          prev ? { ...prev, name: e.target.value } : prev,
                        )
                      }
                      className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400"
                      placeholder="前台與後台顯示的名稱"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-sky-100">適用對象</label>
                  <select
                    value={levelForm.audience}
                    onChange={(e) =>
                      setLevelForm((prev) =>
                        prev
                          ? { ...prev, audience: e.target.value as LevelAudience }
                          : prev,
                      )
                    }
                    className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400"
                  >
                    <option value="Both">Player + Broadcaster</option>
                    <option value="Player">僅 Player</option>
                    <option value="Broadcaster">僅 Broadcaster</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-sky-100">
                      累積充值門檻
                    </label>
                    <input
                      value={levelForm.thresholdRecharge}
                      onChange={(e) =>
                        setLevelForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                thresholdRecharge: e.target.value,
                              }
                            : prev,
                        )
                      }
                      inputMode="decimal"
                      className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400"
                      placeholder="例如：10000"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-sky-100">
                      累積消費門檻
                    </label>
                    <input
                      value={levelForm.thresholdSpend}
                      onChange={(e) =>
                        setLevelForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                thresholdSpend: e.target.value,
                              }
                            : prev,
                        )
                      }
                      inputMode="decimal"
                      className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400"
                      placeholder="例如：5000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-sky-100">點數獲取倍率</label>
                    <input
                      value={levelForm.pointsMultiplier}
                      onChange={(e) =>
                        setLevelForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                pointsMultiplier: e.target.value,
                              }
                            : prev,
                        )
                      }
                      inputMode="decimal"
                      className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400"
                      placeholder="例如：1.2"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-sky-100">禮物收益加成</label>
                    <input
                      value={levelForm.giftRevenueMultiplier}
                      onChange={(e) =>
                        setLevelForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                giftRevenueMultiplier: e.target.value,
                              }
                            : prev,
                        )
                      }
                      inputMode="decimal"
                      className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400"
                      placeholder="例如：1.1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-sky-100">Bonus 發放倍率</label>
                    <input
                      value={levelForm.bonusMultiplier}
                      onChange={(e) =>
                        setLevelForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                bonusMultiplier: e.target.value,
                              }
                            : prev,
                        )
                      }
                      inputMode="decimal"
                      className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400"
                      placeholder="例如：1.3"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-sky-100">狀態</label>
                  <select
                    value={levelForm.status}
                    onChange={(e) =>
                      setLevelForm((prev) =>
                        prev
                          ? { ...prev, status: e.target.value as LevelStatus }
                          : prev,
                      )
                    }
                    className="h-7 w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50 outline-none focus:border-sky-400"
                  >
                    <option value="active">啟用</option>
                    <option value="inactive">停用</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-sky-100">
                    備註 / 權益摘要（選填）
                  </label>
                  <textarea
                    value={levelForm.note}
                    onChange={(e) =>
                      setLevelForm((prev) =>
                        prev ? { ...prev, note: e.target.value } : prev,
                      )
                    }
                    rows={3}
                    className="w-full rounded-md border border-sky-700/80 bg-slate-950/80 px-2 py-1 text-[11px] text-sky-50 outline-none focus:border-sky-400"
                    placeholder="簡要說明此等級的主要權益與使用情境，方便客服與營運理解。"
                  />
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseLevelDrawer}
                    className="inline-flex items-center gap-1 rounded-full border border-sky-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-sky-100 hover:bg-slate-800/80"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-sky-500"
                  >
                    儲存等級
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* 抽屜：升降級與倍率規則編輯 */}
      {ruleDraft && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-emerald-600/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-emerald-600/60 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-emerald-50">
                  <Settings2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-semibold">編輯升降級與倍率規則</span>
                </div>
                <p className="mt-0.5 text-[11px] text-emerald-200/80">
                  僅示意前端表單；正式環境建議搭配多人審核與版本管理，避免誤調整造成成本失控。
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseRuleDrawer}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-700/80 bg-slate-900/80 text-emerald-200 hover:border-emerald-400 hover:text-emerald-100"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-emerald-50">
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSaveRuleConfig()
                }}
              >
                <div className="space-y-1">
                  <label className="block text-[11px] text-emerald-100">升級依據</label>
                  <select
                    value={ruleDraft.upgradeMode}
                    onChange={(e) =>
                      setRuleDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              upgradeMode: e.target.value as LevelRuleConfig['upgradeMode'],
                            }
                          : prev,
                      )
                    }
                    className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                  >
                    <option value="recharge">僅累積充值金額</option>
                    <option value="spend">僅累積消費金額</option>
                    <option value="mixed">充值 + 消費混合（可加權）</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-emerald-100">
                      計算窗口（天）
                    </label>
                    <input
                      value={ruleDraft.windowDays}
                      onChange={(e) =>
                        setRuleDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                windowDays: Number(e.target.value || '0'),
                              }
                            : prev,
                        )
                      }
                      inputMode="numeric"
                      className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                      placeholder="例如：90"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-emerald-100">
                      降級緩衝天數
                    </label>
                    <input
                      value={ruleDraft.downgradeGraceDays}
                      onChange={(e) =>
                        setRuleDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                downgradeGraceDays: Number(e.target.value || '0'),
                              }
                            : prev,
                        )
                      }
                      inputMode="numeric"
                      className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                      placeholder="例如：30"
                    />
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-emerald-700/70 bg-slate-950/90 p-3 text-[10px]">
                  <div className="flex items-center gap-2">
                    <input
                      id="autoDowngrade"
                      type="checkbox"
                      checked={ruleDraft.autoDowngrade}
                      onChange={(e) =>
                        setRuleDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                autoDowngrade: e.target.checked,
                              }
                            : prev,
                        )
                      }
                      className="h-3 w-3 rounded border-emerald-600 bg-slate-900/80"
                    />
                    <label
                      htmlFor="autoDowngrade"
                      className="text-[11px] text-emerald-100"
                    >
                      啟用自動降級
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="resetYearly"
                      type="checkbox"
                      checked={ruleDraft.resetYearly}
                      onChange={(e) =>
                        setRuleDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                resetYearly: e.target.checked,
                              }
                            : prev,
                        )
                      }
                      className="h-3 w-3 rounded border-emerald-600 bg-slate-900/80"
                    />
                    <label
                      htmlFor="resetYearly"
                      className="text-[11px] text-emerald-100"
                    >
                      每年重置等級
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="allowManualAdjust"
                      type="checkbox"
                      checked={ruleDraft.allowManualAdjust}
                      onChange={(e) =>
                        setRuleDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                allowManualAdjust: e.target.checked,
                              }
                            : prev,
                        )
                      }
                      className="h-3 w-3 rounded border-emerald-600 bg-slate-900/80"
                    />
                    <label
                      htmlFor="allowManualAdjust"
                      className="text-[11px] text-emerald-100"
                    >
                      允許客服 / 營運人工升降級（需 RBAC + Audit Log）
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-emerald-100">
                      預設禮物加成倍率
                    </label>
                    <input
                      value={ruleDraft.defaultGiftMultiplier}
                      onChange={(e) =>
                        setRuleDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                defaultGiftMultiplier: Number(e.target.value || '1'),
                              }
                            : prev,
                        )
                      }
                      inputMode="decimal"
                      className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                      placeholder="例如：1.2"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-emerald-100">
                      預設 Bonus 倍率
                    </label>
                    <input
                      value={ruleDraft.defaultBonusMultiplier}
                      onChange={(e) =>
                        setRuleDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                defaultBonusMultiplier: Number(e.target.value || '1'),
                              }
                            : prev,
                        )
                      }
                      inputMode="decimal"
                      className="h-7 w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                      placeholder="例如：1.15"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-emerald-100">
                    備註 / 實作說明
                  </label>
                  <textarea
                    value={ruleDraft.note}
                    onChange={(e) =>
                      setRuleDraft((prev) =>
                        prev ? { ...prev, note: e.target.value } : prev,
                      )
                    }
                    rows={3}
                    className="w-full rounded-md border border-emerald-700/80 bg-slate-950/80 px-2 py-1 text-[11px] text-emerald-50 outline-none focus:border-emerald-400"
                    placeholder="補充關於批次 Job、風控、預算管控與版本管理的實作建議。"
                  />
                </div>

                <section className="space-y-1 rounded-lg border border-amber-500/60 bg-amber-500/10 p-3 text-[10px] text-amber-50">
                  <div className="font-semibold">風險提醒</div>
                  <ul className="list-disc space-y-0.5 pl-4">
                    <li>等級規則直接影響平台成本與收益，建議採用多階段審核。</li>
                    <li>建議保留歷史版本與灰度發佈能力，避免一次性全量切換。</li>
                    <li>所有變更須寫入 Audit Log，並與報表中心對齊。</li>
                  </ul>
                </section>

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseRuleDrawer}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-emerald-100 hover:bg-slate-800/80"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500"
                  >
                    儲存規則
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default MembershipPage
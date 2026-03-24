/**
 * @file RbacPage.tsx
 * @description RBAC 權限管理工作台
 * 子模組：總覽 / 管理員帳號 / 角色管理 / 權限配置 / Audit Log / 功能清單
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { showAlert, showConfirm } from '../../lib/dialog'
import {
  Shield,
  Users,
  Key,
  Activity,
  Lock,
  Unlock,
  Trash2,
  Edit3,
  PlusCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  Filter,
  ClipboardList,
  BarChart3,
} from 'lucide-react'
import { FeatureList, type FeatureItem } from '../../components/common/FeatureList'

// ─── Types ────────────────────────────────────────────────────────────────────

type RbacTabId = 'overview' | 'admins' | 'roles' | 'permissions' | 'audit' | 'blueprint'

type AdminStatus = 'active' | 'locked' | 'disabled'

type AuditActionType = '新增管理員' | '修改角色' | '修改權限' | '重置密碼' | '鎖定帳號'

type PermModule =
  | '用戶管理'
  | '直播管理'
  | '財務管理'
  | '支付管理'
  | '市場營銷'
  | 'Bonus管理'
  | '禮物管理'
  | '系統設定'

type PermAction = '查看' | '新增' | '編輯' | '刪除' | '審核' | '匯出'

interface Permission {
  module: PermModule
  action: PermAction
}

interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  status: 'active' | 'inactive'
  createdAt: string
}

interface Admin {
  id: string
  adminId: string
  name: string
  email: string
  roleIds: string[]
  status: AdminStatus
  lastLogin: string
}

interface AuditLog {
  id: string
  timestamp: string
  operator: string
  actionType: AuditActionType
  target: string
  summary: string
  ip: string
}

interface RoleForm {
  name: string
  description: string
  permissions: Permission[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PERM_MODULES: PermModule[] = [
  '用戶管理', '直播管理', '財務管理', '支付管理',
  '市場營銷', 'Bonus管理', '禮物管理', '系統設定',
]

const PERM_ACTIONS: PermAction[] = ['查看', '新增', '編輯', '刪除', '審核', '匯出']

// ─── Mock Data ────────────────────────────────────────────────────────────────

function mockRoles(): Role[] {
  return [
    {
      id: 'role-superadmin',
      name: '超級管理員',
      description: '擁有所有模組完整權限，僅限技術與資安負責人使用。',
      permissions: PERM_MODULES.flatMap(m =>
        PERM_ACTIONS.map(a => ({ module: m, action: a }))
      ),
      status: 'active',
      createdAt: '2025-01-01 00:00',
    },
    {
      id: 'role-finance',
      name: '財務管理員',
      description: '負責財務、支付、Bonus 相關模組的查看、審核與匯出，不允許刪除與系統設定。',
      permissions: [
        { module: '財務管理', action: '查看' },
        { module: '財務管理', action: '審核' },
        { module: '財務管理', action: '匯出' },
        { module: '支付管理', action: '查看' },
        { module: '支付管理', action: '審核' },
        { module: '支付管理', action: '匯出' },
        { module: 'Bonus管理', action: '查看' },
        { module: 'Bonus管理', action: '審核' },
        { module: 'Bonus管理', action: '匯出' },
        { module: '禮物管理', action: '查看' },
        { module: '禮物管理', action: '匯出' },
      ],
      status: 'active',
      createdAt: '2025-01-05 09:00',
    },
    {
      id: 'role-risk',
      name: '風控管理員',
      description: '負責用戶行為監控與風控操作，可查看各模組資料、鎖定用戶與核審高風險操作。',
      permissions: [
        { module: '用戶管理', action: '查看' },
        { module: '用戶管理', action: '編輯' },
        { module: '用戶管理', action: '審核' },
        { module: '直播管理', action: '查看' },
        { module: '財務管理', action: '查看' },
        { module: '財務管理', action: '審核' },
        { module: '支付管理', action: '查看' },
        { module: 'Bonus管理', action: '查看' },
        { module: '禮物管理', action: '查看' },
        { module: '市場營銷', action: '查看' },
      ],
      status: 'active',
      createdAt: '2025-01-10 10:30',
    },
    {
      id: 'role-cs',
      name: '客服人員',
      description: '處理用戶客服請求，可查看用戶資料與直播資訊，不允許修改財務與系統設定。',
      permissions: [
        { module: '用戶管理', action: '查看' },
        { module: '用戶管理', action: '編輯' },
        { module: '直播管理', action: '查看' },
        { module: '禮物管理', action: '查看' },
      ],
      status: 'active',
      createdAt: '2025-02-01 08:00',
    },
  ]
}

function mockAdmins(): Admin[] {
  return [
    {
      id: 'admin-001',
      adminId: 'ADM-001',
      name: 'Alice Chen',
      email: 'alice@admin.com',
      roleIds: ['role-superadmin'],
      status: 'active',
      lastLogin: '2025-03-24 17:30',
    },
    {
      id: 'admin-002',
      adminId: 'ADM-002',
      name: 'Bob Lin',
      email: 'bob@admin.com',
      roleIds: ['role-finance'],
      status: 'active',
      lastLogin: '2025-03-24 15:45',
    },
    {
      id: 'admin-003',
      adminId: 'ADM-003',
      name: 'Carol Wu',
      email: 'carol@admin.com',
      roleIds: ['role-risk', 'role-cs'],
      status: 'active',
      lastLogin: '2025-03-23 10:20',
    },
    {
      id: 'admin-004',
      adminId: 'ADM-004',
      name: 'Dave Huang',
      email: 'dave@admin.com',
      roleIds: ['role-cs'],
      status: 'locked',
      lastLogin: '2025-03-10 09:00',
    },
    {
      id: 'admin-005',
      adminId: 'ADM-005',
      name: 'Eve Tsai',
      email: 'eve@admin.com',
      roleIds: ['role-finance', 'role-risk'],
      status: 'disabled',
      lastLogin: '2025-02-20 14:00',
    },
  ]
}

function mockAuditLogs(): AuditLog[] {
  return [
    {
      id: 'AUDIT-001',
      timestamp: '2025-03-24 17:35',
      operator: 'Alice Chen',
      actionType: '新增管理員',
      target: 'Dave Huang (ADM-004)',
      summary: '新增客服管理員帳號，指派角色：客服人員',
      ip: '192.168.1.101',
    },
    {
      id: 'AUDIT-002',
      timestamp: '2025-03-24 16:10',
      operator: 'Alice Chen',
      actionType: '鎖定帳號',
      target: 'Dave Huang (ADM-004)',
      summary: '因連續登入失敗 5 次，帳號已被系統鎖定',
      ip: '192.168.1.101',
    },
    {
      id: 'AUDIT-003',
      timestamp: '2025-03-23 14:20',
      operator: 'Bob Lin',
      actionType: '修改角色',
      target: '財務管理員 (role-finance)',
      summary: '新增「Bonus管理 > 匯出」與「禮物管理 > 匯出」權限',
      ip: '10.0.0.55',
    },
    {
      id: 'AUDIT-004',
      timestamp: '2025-03-22 11:00',
      operator: 'Alice Chen',
      actionType: '修改權限',
      target: '風控管理員 (role-risk)',
      summary: '移除「支付管理 > 審核」，新增「財務管理 > 審核」與「市場營銷 > 查看」',
      ip: '192.168.1.101',
    },
    {
      id: 'AUDIT-005',
      timestamp: '2025-03-21 09:30',
      operator: 'Alice Chen',
      actionType: '重置密碼',
      target: 'Carol Wu (ADM-003)',
      summary: '應用戶請求重置管理員密碼，已發送臨時密碼至 carol@admin.com',
      ip: '192.168.1.101',
    },
    {
      id: 'AUDIT-006',
      timestamp: '2025-03-20 15:45',
      operator: 'Alice Chen',
      actionType: '修改角色',
      target: '客服人員 (role-cs)',
      summary: '更新角色描述，確認「用戶管理 > 查看」與「用戶管理 > 編輯」保留',
      ip: '192.168.1.101',
    },
    {
      id: 'AUDIT-007',
      timestamp: '2025-03-19 10:00',
      operator: 'Alice Chen',
      actionType: '新增管理員',
      target: 'Eve Tsai (ADM-005)',
      summary: '新增財務風控複合角色管理員，指派財務管理員 + 風控管理員',
      ip: '192.168.1.101',
    },
    {
      id: 'AUDIT-008',
      timestamp: '2025-03-18 14:30',
      operator: 'Alice Chen',
      actionType: '修改權限',
      target: '超級管理員 (role-superadmin)',
      summary: '確認超級管理員擁有全模組所有操作權限（定期複核）',
      ip: '192.168.1.101',
    },
  ]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasPermission(perms: Permission[], module: PermModule, action: PermAction): boolean {
  return perms.some(p => p.module === module && p.action === action)
}

function togglePermission(perms: Permission[], module: PermModule, action: PermAction): Permission[] {
  const exists = perms.some(p => p.module === module && p.action === action)
  if (exists) return perms.filter(p => !(p.module === module && p.action === action))
  return [...perms, { module, action }]
}

function getAdminEffectiveModules(admin: Admin, roles: Role[]): string[] {
  const modules = new Set<string>()
  for (const roleId of admin.roleIds) {
    const role = roles.find(r => r.id === roleId)
    if (role && role.status === 'active') {
      for (const perm of role.permissions) {
        modules.add(perm.module)
      }
    }
  }
  return Array.from(modules)
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RbacPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<RbacTabId>('overview')

  // ── Data ─────────────────────────────────────────────────────────────────────
  const [roles, setRoles] = useState<Role[]>(() => mockRoles())
  const [admins, setAdmins] = useState<Admin[]>(() => mockAdmins())
  const [auditLogs] = useState<AuditLog[]>(() => mockAuditLogs())

  // ── Pagination ────────────────────────────────────────────────────────────────
  const PS = 5
  const [auditPage, setAuditPage] = useState(1)

  // ── Filters ───────────────────────────────────────────────────────────────────
  const [auditTypeFilter, setAuditTypeFilter] = useState<'全部' | AuditActionType>('全部')

  // ── Drawer: Admin Detail ─────────────────────────────────────────────────────
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [adminRolesDraft, setAdminRolesDraft] = useState<string[]>([])
  const [addRoleSelect, setAddRoleSelect] = useState<string>('')

  // ── Drawer: Role Edit ────────────────────────────────────────────────────────
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [isNewRole, setIsNewRole] = useState(false)
  const [roleForm, setRoleForm] = useState<RoleForm | null>(null)

  // ── Computed ──────────────────────────────────────────────────────────────────
  const overview = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weeklyAudits = auditLogs.filter(a => new Date(a.timestamp) >= weekAgo)
    const highRiskActions: AuditActionType[] = ['鎖定帳號', '修改權限']
    const highRisk = weeklyAudits.filter(a => highRiskActions.includes(a.actionType))
    return {
      totalAdmins: admins.length,
      activeRoles: roles.filter(r => r.status === 'active').length,
      weeklyAuditCount: weeklyAudits.length,
      highRiskCount: highRisk.length,
      pendingRequests: 2,
    }
  }, [admins, roles, auditLogs])

  const filteredAuditLogs = useMemo(() => {
    if (auditTypeFilter === '全部') return auditLogs
    return auditLogs.filter(a => a.actionType === auditTypeFilter)
  }, [auditLogs, auditTypeFilter])

  const auditTotalPages = Math.max(1, Math.ceil(filteredAuditLogs.length / PS))
  const pagedAuditLogs = useMemo(() => {
    const start = (auditPage - 1) * PS
    return filteredAuditLogs.slice(start, start + PS)
  }, [filteredAuditLogs, auditPage])

  const rolesWithCount = useMemo(() =>
    roles.map(role => ({
      ...role,
      adminCount: admins.filter(a => a.roleIds.includes(role.id)).length,
    })),
    [roles, admins]
  )

  // ── Handlers: Admin ───────────────────────────────────────────────────────────

  function openAdminDrawer(admin: Admin) {
    setSelectedAdmin(admin)
    setAdminRolesDraft([...admin.roleIds])
    setAddRoleSelect('')
  }

  function closeAdminDrawer() {
    setSelectedAdmin(null)
    setAdminRolesDraft([])
    setAddRoleSelect('')
  }

  async function handleResetPassword(admin: Admin) {
    const ok = await showConfirm(
      `確認重置「${admin.name}（${admin.adminId}）」的密碼嗎？\n系統將發送臨時密碼至：${admin.email}`
    )
    if (!ok) return
    await showAlert(`已模擬重置密碼，臨時密碼已發送至 ${admin.email}（示意）。`)
  }

  async function handleToggleLock(admin: Admin) {
    const isLocking = admin.status === 'active'
    const ok = await showConfirm(
      isLocking
        ? `確認鎖定管理員「${admin.name}（${admin.adminId}）」嗎？\n鎖定後此帳號將無法登入。`
        : `確認解鎖管理員「${admin.name}（${admin.adminId}）」嗎？`
    )
    if (!ok) return
    setAdmins(prev =>
      prev.map(a => a.id === admin.id ? { ...a, status: isLocking ? 'locked' : 'active' } : a)
    )
  }

  async function handleRemoveAdmin(admin: Admin) {
    const ok = await showConfirm(
      `⚠ 高風險操作：確認移除管理員「${admin.name}（${admin.adminId}）」嗎？\n此操作無法復原，移除後帳號將永久停用。`
    )
    if (!ok) return
    setAdmins(prev =>
      prev.map(a => a.id === admin.id ? { ...a, status: 'disabled' } : a)
    )
    if (selectedAdmin?.id === admin.id) closeAdminDrawer()
  }

  function handleRemoveRoleFromDraft(roleId: string) {
    setAdminRolesDraft(prev => prev.filter(r => r !== roleId))
  }

  function handleAddRoleToDraft() {
    if (!addRoleSelect) return
    if (adminRolesDraft.includes(addRoleSelect)) return
    setAdminRolesDraft(prev => [...prev, addRoleSelect])
    setAddRoleSelect('')
  }

  async function handleSaveAdminRoles() {
    if (!selectedAdmin) return
    const ok = await showConfirm(
      `確認儲存「${selectedAdmin.name}」的角色指派嗎？\n角色更動將即時生效。`
    )
    if (!ok) return
    setAdmins(prev =>
      prev.map(a => a.id === selectedAdmin.id ? { ...a, roleIds: adminRolesDraft } : a)
    )
    closeAdminDrawer()
  }

  // ── Handlers: Roles ───────────────────────────────────────────────────────────

  function openRoleDrawer(role: Role) {
    setEditingRole(role)
    setIsNewRole(false)
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
    })
  }

  function openNewRoleDrawer() {
    setEditingRole(null)
    setIsNewRole(true)
    setRoleForm({ name: '', description: '', permissions: [] })
  }

  function closeRoleDrawer() {
    setEditingRole(null)
    setIsNewRole(false)
    setRoleForm(null)
  }

  function handleTogglePermInForm(module: PermModule, action: PermAction) {
    if (!roleForm) return
    setRoleForm(prev =>
      prev ? { ...prev, permissions: togglePermission(prev.permissions, module, action) } : prev
    )
  }

  function handleToggleModuleAll(module: PermModule) {
    if (!roleForm) return
    const allChecked = PERM_ACTIONS.every(a => hasPermission(roleForm.permissions, module, a))
    if (allChecked) {
      setRoleForm(prev =>
        prev ? { ...prev, permissions: prev.permissions.filter(p => p.module !== module) } : prev
      )
    } else {
      const existing = roleForm.permissions.filter(p => p.module !== module)
      const newPerms = PERM_ACTIONS.map(a => ({ module, action: a }))
      setRoleForm(prev => prev ? { ...prev, permissions: [...existing, ...newPerms] } : prev)
    }
  }

  async function handleSaveRole() {
    if (!roleForm) return
    if (!roleForm.name.trim()) {
      await showAlert('請填寫「角色名稱」。')
      return
    }
    const ok = await showConfirm(
      isNewRole
        ? `確認建立新角色「${roleForm.name}」嗎？\n已選擇 ${roleForm.permissions.length} 項權限。`
        : `確認儲存角色「${roleForm.name}」的變更嗎？\n目前已選 ${roleForm.permissions.length} 項權限。`
    )
    if (!ok) return
    if (isNewRole) {
      const newRole: Role = {
        id: `role-${Date.now()}`,
        name: roleForm.name.trim(),
        description: roleForm.description.trim(),
        permissions: roleForm.permissions,
        status: 'active',
        createdAt: new Date().toLocaleString('zh-TW', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit',
        }),
      }
      setRoles(prev => [...prev, newRole])
    } else if (editingRole) {
      setRoles(prev =>
        prev.map(r =>
          r.id === editingRole.id
            ? { ...r, name: roleForm.name.trim(), description: roleForm.description.trim(), permissions: roleForm.permissions }
            : r
        )
      )
    }
    closeRoleDrawer()
  }

  async function handleToggleRoleStatus(role: Role) {
    const isDeactivating = role.status === 'active'
    const ok = await showConfirm(
      isDeactivating
        ? `確認停用角色「${role.name}」嗎？\n停用後持有此角色的管理員將失去對應權限。`
        : `確認啟用角色「${role.name}」嗎？`
    )
    if (!ok) return
    setRoles(prev =>
      prev.map(r => r.id === role.id ? { ...r, status: isDeactivating ? 'inactive' : 'active' } : r)
    )
  }

  async function handleDeleteRole(role: Role) {
    const assignedCount = admins.filter(a => a.roleIds.includes(role.id)).length
    const ok = await showConfirm(
      `⚠ 高風險操作：確認刪除角色「${role.name}」嗎？\n` +
      (assignedCount > 0
        ? `目前有 ${assignedCount} 位管理員持有此角色，刪除後將失去對應權限。\n`
        : '') +
      '此操作無法復原。'
    )
    if (!ok) return
    setRoles(prev => prev.filter(r => r.id !== role.id))
    setAdmins(prev =>
      prev.map(a => ({ ...a, roleIds: a.roleIds.filter(id => id !== role.id) }))
    )
  }

  // ── Handlers: Permissions Matrix ──────────────────────────────────────────────

  async function handlePermCellClick(module: PermModule, action: PermAction) {
    const rolesWithPerm = roles.filter(
      r => r.status === 'active' && r.permissions.some(p => p.module === module && p.action === action)
    )
    if (rolesWithPerm.length === 0) {
      await showAlert(`「${module} > ${action}」\n\n目前沒有任何角色持有此權限。`)
    } else {
      await showAlert(
        `「${module} > ${action}」\n\n持有此權限的角色（共 ${rolesWithPerm.length} 個）：\n\n` +
        rolesWithPerm.map(r => `• ${r.name}`).join('\n')
      )
    }
  }

  // ── Blueprint ─────────────────────────────────────────────────────────────────

  const blueprintFeatures: FeatureItem[] = [
    {
      id: 33,
      name: '管理員帳號管理',
      description: '設為 / 取消管理員、鎖定狀態、重置密碼，並且所有操作需權限檢查與 Audit Log。',
      tag: '帳號',
    },
    {
      id: 34,
      name: '角色管理',
      description: '建立 / 編輯 / 停用角色，包含角色描述與用途說明，方便後續審查與維護。',
      tag: '角色',
    },
    {
      id: 35,
      name: '權限（Permission）管理',
      description: '以「模組 → 操作」方式配置權限，例如可審核 / 可發放 / 可回滾 / 可匯出等細粒度控制。',
      tag: 'Permission',
    },
    {
      id: 36,
      name: '管理員 → 角色綁定',
      description: '將管理員綁定一或多個角色，實際有效權限為角色權限集合，支援即時生效。',
      tag: '綁定',
    },
    {
      id: 37,
      name: '權限生效預覽',
      description: '在儲存前預覽此角色可執行的模組與操作，避免錯誤授權造成安全風險。',
      tag: '預覽',
    },
    {
      id: 38,
      name: '操作稽核 Audit Log',
      description: '記錄誰在何時對點數 / Bonus / 支付狀態 / 權限做了何種變更，便於稽核與追責。',
      tag: 'Audit Log',
    },
  ]


  // ── Render ────────────────────────────────────────────────────────────────────

  const tabs: { id: RbacTabId; label: string; color: string }[] = [
    { id: 'overview', label: t('common.overview'), color: 'bg-slate-700' },
    { id: 'admins', label: t('tabs.rbacAdmins'), color: 'bg-sky-600' },
    { id: 'roles', label: t('tabs.rbacRoles'), color: 'bg-indigo-600' },
    { id: 'permissions', label: t('tabs.rbacPermissions'), color: 'bg-violet-600' },
    { id: 'audit', label: t('tabs.rbacAudit'), color: 'bg-amber-600' },
    { id: 'blueprint', label: t('common.blueprint'), color: 'bg-slate-700' },
  ]

  const adminStatusBadge: Record<AdminStatus, string> = {
    active: 'bg-emerald-500/30 text-emerald-50',
    locked: 'bg-amber-500/30 text-amber-50',
    disabled: 'bg-slate-600/40 text-slate-300',
  }
  const adminStatusLabel: Record<AdminStatus, string> = {
    active: '啟用中', locked: '已鎖定', disabled: '已停用',
  }

  const auditTypeBadge: Record<AuditActionType, string> = {
    '新增管理員': 'bg-sky-500/30 text-sky-50',
    '修改角色': 'bg-indigo-500/30 text-indigo-50',
    '修改權限': 'bg-violet-500/30 text-violet-50',
    '重置密碼': 'bg-amber-500/30 text-amber-50',
    '鎖定帳號': 'bg-rose-500/40 text-rose-50',
  }

  return (
    <div className="space-y-4">
      {/* Tab header */}
      <section className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-xs font-semibold text-slate-100">RBAC 權限管理</span>
          <span className="text-[10px] text-slate-500">管理員帳號 / 角色 / 權限矩陣 / Audit Log</span>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={['rounded-full px-2 py-0.5', activeTab === t.id ? `${t.color} text-white` : 'text-slate-200 hover:bg-slate-800/80'].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── 總覽 ─────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">RBAC 系統總覽</span>
            </div>
            <span className="text-[10px] text-slate-500">前端僅負責顯示 / 禁用，最終驗證必須由後端完成。</span>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-[11px]">
            <div className="space-y-1 rounded-xl border border-sky-600/60 bg-sky-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><Users className="h-3.5 w-3.5 text-sky-400" />管理員總數</div>
              <div className="text-lg font-semibold text-sky-100">{overview.totalAdmins}</div>
              <p className="text-[10px] text-sky-200/80">所有帳號（含停用與鎖定）。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-indigo-600/60 bg-indigo-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><Key className="h-3.5 w-3.5 text-indigo-400" />啟用中角色</div>
              <div className="text-lg font-semibold text-indigo-100">{overview.activeRoles}</div>
              <p className="text-[10px] text-indigo-200/80">狀態為 active 的角色數。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-amber-600/60 bg-amber-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><Activity className="h-3.5 w-3.5 text-amber-400" />本週 Audit 操作</div>
              <div className="text-lg font-semibold text-amber-100">{overview.weeklyAuditCount} 筆</div>
              <p className="text-[10px] text-amber-200/80">最近 7 天的稽核操作紀錄。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-rose-600/60 bg-rose-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><AlertTriangle className="h-3.5 w-3.5 text-rose-400" />高風險操作</div>
              <div className="text-lg font-semibold text-rose-100">{overview.highRiskCount} 次</div>
              <p className="text-[10px] text-rose-200/80">本週鎖定帳號 / 修改權限等高風險操作。</p>
            </div>
            <div className="space-y-1 rounded-xl border border-violet-600/60 bg-violet-500/10 p-3">
              <div className="flex items-center gap-1.5 text-slate-100"><ClipboardList className="h-3.5 w-3.5 text-violet-400" />待審權限申請</div>
              <div className="text-lg font-semibold text-violet-100">{overview.pendingRequests} 件</div>
              <p className="text-[10px] text-violet-200/80">等待審核的角色 / 權限變更申請。</p>
            </div>
          </div>
          <div className="space-y-1 rounded-xl border border-slate-700/80 bg-slate-900/80 p-3 text-[11px] text-slate-400">
            <div className="font-semibold text-slate-300">安全提示</div>
            <ul className="list-disc space-y-0.5 pl-4 text-[10px]">
              <li>所有高風險操作（修改權限、鎖定帳號）皆需雙重確認，並寫入 Audit Log。</li>
              <li>前端展示應與後端 ACL 驗證一致，避免僅依賴前端隱藏按鈕作為安全邊界。</li>
              <li>超級管理員帳號建議設定 IP 白名單與多因素驗證（MFA）。</li>
            </ul>
          </div>
        </section>
      )}

      {/* ── 管理員帳號 ───────────────────────────────────────────────────── */}
      {activeTab === 'admins' && (
        <section className="space-y-3 rounded-2xl border border-sky-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold">管理員帳號管理</span>
              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-100">指派角色 · 鎖定 / 解鎖 · 重置密碼</span>
            </div>
          </header>
          <div className="overflow-hidden rounded-xl border border-sky-600/60 bg-slate-950/80">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-900/90 text-sky-100">
                <tr>
                  {['#', '管理員 ID', '名稱', 'Email', '目前角色', '狀態', '最後登入', '操作'].map(h => (
                    <th key={h} className="border-b border-sky-600/60 px-2 py-2 text-left last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins.map((admin, i) => {
                  const adminRoles = admin.roleIds
                    .map(rid => roles.find(r => r.id === rid))
                    .filter(Boolean) as Role[]
                  return (
                    <tr key={admin.id} className="border-b border-sky-600/30 text-sky-50 last:border-b-0">
                      <td className="px-2 py-1.5 text-slate-300">{i + 1}</td>
                      <td className="px-2 py-1.5 font-medium">{admin.adminId}</td>
                      <td className="px-2 py-1.5">{admin.name}</td>
                      <td className="px-2 py-1.5 text-[10px] text-sky-100/80">{admin.email}</td>
                      <td className="px-2 py-1.5">
                        <div className="flex flex-wrap gap-1">
                          {adminRoles.length > 0
                            ? adminRoles.map(r => (
                              <span key={r.id} className="rounded-full bg-indigo-500/30 px-1.5 py-0.5 text-[10px] text-indigo-50">{r.name}</span>
                            ))
                            : <span className="text-[10px] text-slate-500">無角色</span>
                          }
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${adminStatusBadge[admin.status]}`}>
                          {adminStatusLabel[admin.status]}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-[10px] text-sky-100/80">{admin.lastLogin}</td>
                      <td className="px-2 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openAdminDrawer(admin)}
                            className="inline-flex items-center gap-0.5 rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-50 hover:bg-sky-500/30"
                          >
                            <Eye className="h-3 w-3" />詳情
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetPassword(admin)}
                            className="inline-flex items-center gap-0.5 rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-white hover:bg-slate-600"
                          >
                            重置密碼
                          </button>
                          {admin.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => handleToggleLock(admin)}
                              className="inline-flex items-center gap-0.5 rounded-full bg-amber-600 px-2 py-0.5 text-[10px] text-white hover:bg-amber-500"
                            >
                              <Lock className="h-3 w-3" />鎖定
                            </button>
                          )}
                          {admin.status === 'locked' && (
                            <button
                              type="button"
                              onClick={() => handleToggleLock(admin)}
                              className="inline-flex items-center gap-0.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white hover:bg-emerald-500"
                            >
                              <Unlock className="h-3 w-3" />解鎖
                            </button>
                          )}
                          {admin.status !== 'disabled' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAdmin(admin)}
                              className="inline-flex items-center gap-0.5 rounded-full bg-rose-700 px-2 py-0.5 text-[10px] text-white hover:bg-rose-600"
                            >
                              <Trash2 className="h-3 w-3" />移除
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── 角色管理 ─────────────────────────────────────────────────────── */}
      {activeTab === 'roles' && (
        <section className="space-y-3 rounded-2xl border border-indigo-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-semibold">角色管理</span>
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-100">建立 / 編輯 / 停用角色及權限矩陣</span>
            </div>
            <button
              type="button"
              onClick={openNewRoleDrawer}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-indigo-500"
            >
              <PlusCircle className="h-3 w-3" />新增角色
            </button>
          </header>
          <div className="overflow-hidden rounded-xl border border-indigo-600/60 bg-slate-950/80">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-900/90 text-indigo-100">
                <tr>
                  {['#', '角色 ID', '名稱', '描述', '權限數', '已指派人數', '狀態', '建立時間', '操作'].map(h => (
                    <th key={h} className="border-b border-indigo-600/60 px-2 py-2 text-left last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rolesWithCount.map((role, i) => (
                  <tr key={role.id} className="border-b border-indigo-600/30 text-indigo-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{i + 1}</td>
                    <td className="px-2 py-1.5 text-[10px] text-indigo-100/80">{role.id}</td>
                    <td className="px-2 py-1.5 font-medium">{role.name}</td>
                    <td className="px-2 py-1.5 text-[10px] text-indigo-100/80 max-w-[180px]">{role.description}</td>
                    <td className="px-2 py-1.5 tabular-nums text-center">{role.permissions.length}</td>
                    <td className="px-2 py-1.5 tabular-nums text-center">{role.adminCount}</td>
                    <td className="px-2 py-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${role.status === 'active' ? 'bg-emerald-500/30 text-emerald-50' : 'bg-slate-600/40 text-slate-300'}`}>
                        {role.status === 'active' ? '啟用' : '停用'}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-indigo-100/80">{role.createdAt}</td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openRoleDrawer(role)}
                          className="inline-flex items-center gap-0.5 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-50 hover:bg-indigo-500/30"
                        >
                          <Edit3 className="h-3 w-3" />編輯
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleRoleStatus(role)}
                          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] text-white ${role.status === 'active' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                        >
                          {role.status === 'active' ? '停用' : '啟用'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(role)}
                          className="inline-flex items-center gap-0.5 rounded-full bg-rose-700 px-2 py-0.5 text-[10px] text-white hover:bg-rose-600"
                        >
                          <Trash2 className="h-3 w-3" />刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── 權限配置 ─────────────────────────────────────────────────────── */}
      {activeTab === 'permissions' && (
        <section className="space-y-3 rounded-2xl border border-violet-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-violet-400" />
              <span className="font-semibold">權限配置總覽（唯讀矩陣）</span>
            </div>
            <span className="text-[10px] text-violet-200/80">此為唯讀總覽，編輯請前往「角色管理」頁籤</span>
          </header>
          <p className="text-[11px] text-slate-400">點擊格子可查看持有該權限的完整角色清單。</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[11px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 border-b border-r border-violet-600/60 bg-slate-900/90 px-3 py-2 text-left text-violet-100 min-w-[100px]">模組 \ 操作</th>
                  {PERM_ACTIONS.map(a => (
                    <th key={a} className="border-b border-violet-600/60 bg-slate-900/90 px-3 py-2 text-center text-violet-100 whitespace-nowrap">{a}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERM_MODULES.map(module => (
                  <tr key={module} className="border-b border-violet-600/20">
                    <td className="sticky left-0 z-10 border-r border-violet-600/40 bg-slate-900/90 px-3 py-1.5 font-medium text-violet-100 whitespace-nowrap">{module}</td>
                    {PERM_ACTIONS.map(action => {
                      const matchingRoles = roles.filter(
                        r => r.status === 'active' && r.permissions.some(p => p.module === module && p.action === action)
                      )
                      return (
                        <td
                          key={action}
                          className="border-r border-violet-600/20 px-2 py-1.5 text-center align-top cursor-pointer hover:bg-violet-500/10 transition-colors"
                          onClick={() => handlePermCellClick(module, action)}
                        >
                          {matchingRoles.length === 0 ? (
                            <span className="text-[10px] text-slate-600">—</span>
                          ) : (
                            <div className="flex flex-wrap justify-center gap-0.5">
                              {matchingRoles.slice(0, 2).map(r => (
                                <span key={r.id} className="rounded-full bg-violet-500/30 px-1.5 py-0.5 text-[9px] text-violet-100 whitespace-nowrap">{r.name}</span>
                              ))}
                              {matchingRoles.length > 2 && (
                                <span className="rounded-full bg-slate-700 px-1.5 py-0.5 text-[9px] text-slate-300">+{matchingRoles.length - 2}</span>
                              )}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Audit Log ────────────────────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <section className="space-y-3 rounded-2xl border border-amber-600/70 bg-slate-950/80 p-4">
          <header className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold">操作稽核 Audit Log</span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-100">記錄所有高風險 RBAC 操作</span>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={auditTypeFilter}
                onChange={e => { setAuditTypeFilter(e.target.value as '全部' | AuditActionType); setAuditPage(1) }}
                className="h-7 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 text-[11px] text-slate-100"
              >
                <option value="全部">全部類型</option>
                <option value="新增管理員">新增管理員</option>
                <option value="修改角色">修改角色</option>
                <option value="修改權限">修改權限</option>
                <option value="重置密碼">重置密碼</option>
                <option value="鎖定帳號">鎖定帳號</option>
              </select>
            </div>
          </header>
          <div className="overflow-hidden rounded-xl border border-amber-600/60 bg-slate-950/80">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-900/90 text-amber-100">
                <tr>
                  {['#', '操作時間', '操作人', '類型', '目標對象', '變更摘要', 'IP'].map(h => (
                    <th key={h} className="border-b border-amber-600/60 px-2 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedAuditLogs.map((log, i) => (
                  <tr key={log.id} className="border-b border-amber-600/30 text-amber-50 last:border-b-0">
                    <td className="px-2 py-1.5 text-slate-300">{(auditPage - 1) * PS + i + 1}</td>
                    <td className="px-2 py-1.5 text-[10px] whitespace-nowrap text-amber-100/80">{log.timestamp}</td>
                    <td className="px-2 py-1.5 font-medium">{log.operator}</td>
                    <td className="px-2 py-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${auditTypeBadge[log.actionType]}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-amber-100/80">{log.target}</td>
                    <td className="px-2 py-1.5 text-[10px] text-amber-100/80 max-w-[260px]">{log.summary}</td>
                    <td className="px-2 py-1.5 text-[10px] text-slate-400">{log.ip}</td>
                  </tr>
                ))}
                {pagedAuditLogs.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-amber-100/80">目前沒有符合條件的稽核紀錄。</td></tr>
                )}
              </tbody>
            </table>
            <footer className="flex items-center justify-between border-t border-amber-600/60 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300">
              <div>總筆數：{filteredAuditLogs.length} · 每頁 {PS} 筆</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={auditPage <= 1}
                  onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3 w-3" />上一頁
                </button>
                <span>第 {auditPage} / {auditTotalPages} 頁</span>
                <button
                  type="button"
                  disabled={auditPage >= auditTotalPages}
                  onClick={() => setAuditPage(p => Math.min(auditTotalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2 py-1 disabled:opacity-40"
                >
                  下一頁<ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </footer>
          </div>
        </section>
      )}

      {/* ── 功能清單 ─────────────────────────────────────────────────────── */}
      {activeTab === 'blueprint' && (
        <FeatureList
          title="RBAC 權限管理功能清單"
          subtitle="保障後台操作安全與可追溯性。"
          items={blueprintFeatures}
        />
      )}

      {/* ── Drawer: 管理員詳情 / 指派角色 ────────────────────────────────── */}
      {selectedAdmin && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-sky-700/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-sky-700/60 px-4 py-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-sky-100">
                  <UserCheck className="h-3.5 w-3.5 text-sky-400" />
                  <span className="font-semibold">管理員詳情 / 指派角色</span>
                </div>
                <p className="mt-0.5 text-[11px] text-sky-200/80">{selectedAdmin.adminId} · {selectedAdmin.name}</p>
              </div>
              <button
                type="button"
                onClick={closeAdminDrawer}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-sky-700/80 bg-slate-900/80 text-sky-200 hover:border-sky-400"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="flex-1 overflow-auto px-4 py-3 space-y-4 text-[11px] text-sky-50">
              {/* Basic Info */}
              <div className="space-y-1.5 rounded-xl border border-sky-700/60 bg-slate-900/80 p-3">
                <div className="flex justify-between"><span className="text-sky-200/70">管理員 ID</span><span className="font-medium">{selectedAdmin.adminId}</span></div>
                <div className="flex justify-between"><span className="text-sky-200/70">名稱</span><span>{selectedAdmin.name}</span></div>
                <div className="flex justify-between"><span className="text-sky-200/70">Email</span><span className="text-[10px]">{selectedAdmin.email}</span></div>
                <div className="flex justify-between"><span className="text-sky-200/70">狀態</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${adminStatusBadge[selectedAdmin.status]}`}>
                    {adminStatusLabel[selectedAdmin.status]}
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-sky-200/70">最後登入</span><span>{selectedAdmin.lastLogin}</span></div>
              </div>

              {/* Assigned Roles */}
              <div className="space-y-2">
                <div className="font-semibold text-sky-100">已指派角色</div>
                <div className="flex flex-wrap gap-1.5">
                  {adminRolesDraft.length > 0
                    ? adminRolesDraft.map(rid => {
                        const r = roles.find(role => role.id === rid)
                        return r ? (
                          <span key={rid} className="inline-flex items-center gap-1 rounded-full bg-indigo-500/30 px-2 py-0.5 text-[10px] text-indigo-50">
                            {r.name}
                            <button
                              type="button"
                              onClick={() => handleRemoveRoleFromDraft(rid)}
                              className="ml-0.5 text-indigo-200 hover:text-white"
                            >×</button>
                          </span>
                        ) : null
                      })
                    : <span className="text-[10px] text-slate-500">尚未指派任何角色</span>
                  }
                </div>
                {/* Add Role */}
                <div className="flex items-center gap-2">
                  <select
                    value={addRoleSelect}
                    onChange={e => setAddRoleSelect(e.target.value)}
                    className="h-7 flex-1 rounded-md border border-sky-700/80 bg-slate-950/80 px-2 text-[11px] text-sky-50"
                  >
                    <option value="">選擇要新增的角色...</option>
                    {roles
                      .filter(r => r.status === 'active' && !adminRolesDraft.includes(r.id))
                      .map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))
                    }
                  </select>
                  <button
                    type="button"
                    onClick={handleAddRoleToDraft}
                    disabled={!addRoleSelect}
                    className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-2 py-1 text-[10px] text-white hover:bg-sky-500 disabled:opacity-40"
                  >
                    <PlusCircle className="h-3 w-3" />新增
                  </button>
                </div>
              </div>

              {/* Effective Permissions Preview */}
              <div className="space-y-2">
                <div className="font-semibold text-sky-100">合併權限預覽（生效中模組）</div>
                {(() => {
                  const effectiveModules = (() => {
                    const modules = new Set<string>()
                    for (const roleId of adminRolesDraft) {
                      const role = roles.find(r => r.id === roleId)
                      if (role && role.status === 'active') {
                        for (const perm of role.permissions) modules.add(perm.module)
                      }
                    }
                    return Array.from(modules)
                  })()
                  return effectiveModules.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {effectiveModules.map(m => (
                        <span key={m} className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-100">{m}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500">無生效中的模組（無有效角色或角色均停用）。</p>
                  )
                })()}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeAdminDrawer}
                  className="inline-flex items-center gap-1 rounded-full border border-sky-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-sky-100 hover:bg-slate-800/80"
                >取消</button>
                <button
                  type="button"
                  onClick={handleSaveAdminRoles}
                  className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-sky-500"
                >
                  <CheckCircle2 className="h-3 w-3" />確認儲存
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ── Drawer: 角色新增 / 編輯 ──────────────────────────────────────── */}
      {roleForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-indigo-700/70 bg-slate-950/95">
            <header className="flex items-center justify-between border-b border-indigo-700/60 px-4 py-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-indigo-100">
                  <Key className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="font-semibold">{isNewRole ? '新增角色' : `編輯角色：${editingRole?.name}`}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-indigo-200/80">
                  已選 {roleForm.permissions.length} 項權限
                </p>
              </div>
              <button
                type="button"
                onClick={closeRoleDrawer}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-indigo-700/80 bg-slate-900/80 text-indigo-200 hover:border-indigo-400"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="flex-1 overflow-auto px-4 py-3 text-[11px] text-indigo-50 space-y-3">
              {/* Name & Description */}
              <div className="space-y-1">
                <label className="block text-indigo-100">角色名稱</label>
                <input
                  value={roleForm.name}
                  onChange={e => setRoleForm(prev => prev ? { ...prev, name: e.target.value } : prev)}
                  className="h-7 w-full rounded-md border border-indigo-700/80 bg-slate-950/80 px-2 text-[11px] text-indigo-50 outline-none focus:border-indigo-400"
                  placeholder="例如：財務主管"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-indigo-100">角色描述</label>
                <textarea
                  value={roleForm.description}
                  onChange={e => setRoleForm(prev => prev ? { ...prev, description: e.target.value } : prev)}
                  rows={2}
                  className="w-full rounded-md border border-indigo-700/80 bg-slate-950/80 px-2 py-1 text-[11px] text-indigo-50 outline-none focus:border-indigo-400"
                  placeholder="描述此角色的用途與適用對象。"
                />
              </div>

              {/* Permission Matrix */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-indigo-100">權限矩陣（以模組分組）</label>
                  <span className="text-[10px] text-indigo-200/70">已選 {roleForm.permissions.length} / {PERM_MODULES.length * PERM_ACTIONS.length}</span>
                </div>
                <div className="space-y-2">
                  {PERM_MODULES.map(module => {
                    const allChecked = PERM_ACTIONS.every(a => hasPermission(roleForm.permissions, module, a))
                    const someChecked = PERM_ACTIONS.some(a => hasPermission(roleForm.permissions, module, a))
                    return (
                      <div key={module} className="rounded-lg border border-indigo-700/50 bg-slate-900/60 p-2">
                        <div className="mb-1.5 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={allChecked}
                            ref={el => { if (el) el.indeterminate = someChecked && !allChecked }}
                            onChange={() => handleToggleModuleAll(module)}
                            className="h-3 w-3 rounded border-indigo-600 bg-slate-900/80 accent-indigo-500"
                          />
                          <span className="text-[11px] font-medium text-indigo-100">{module}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {PERM_ACTIONS.map(action => (
                            <label key={action} className="flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-1 hover:bg-indigo-500/10">
                              <input
                                type="checkbox"
                                checked={hasPermission(roleForm.permissions, module, action)}
                                onChange={() => handleTogglePermInForm(module, action)}
                                className="h-3 w-3 rounded border-indigo-600 bg-slate-900/80 accent-indigo-500"
                              />
                              <span className="text-[10px] text-indigo-100/90">{action}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeRoleDrawer}
                  className="inline-flex items-center gap-1 rounded-full border border-indigo-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-indigo-100 hover:bg-slate-800/80"
                >取消</button>
                <button
                  type="button"
                  onClick={handleSaveRole}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-indigo-500"
                >
                  <CheckCircle2 className="h-3 w-3" />儲存角色
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default RbacPage

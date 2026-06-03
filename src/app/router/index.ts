import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '@/app/layout/MainLayout.vue'
import AssetsPage from '@/pages/assets/AssetsPage.vue'
import DashboardPage from '@/pages/dashboard/DashboardPage.vue'
import MarketObservationsPage from '@/pages/market-observations/MarketObservationsPage.vue'
import MonthlyReportsPage from '@/pages/monthly-reports/MonthlyReportsPage.vue'
import PlansPage from '@/pages/plans/PlansPage.vue'
import PositionsPage from '@/pages/positions/PositionsPage.vue'
import ReviewsPage from '@/pages/reviews/ReviewsPage.vue'
import SettingsPage from '@/pages/settings/SettingsPage.vue'
import TradesPage from '@/pages/trades/TradesPage.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: DashboardPage, meta: { title: '仪表盘' } },
      { path: 'assets', name: 'assets', component: AssetsPage, meta: { title: '投资标的' } },
      { path: 'plans', name: 'plans', component: PlansPage, meta: { title: '交易计划' } },
      { path: 'trades', name: 'trades', component: TradesPage, meta: { title: '交易记录' } },
      {
        path: 'positions',
        name: 'positions',
        component: PositionsPage,
        meta: { title: '仓位快照' },
      },
      { path: 'reviews', name: 'reviews', component: ReviewsPage, meta: { title: '交易复盘' } },
      {
        path: 'market-observations',
        name: 'market-observations',
        component: MarketObservationsPage,
        meta: { title: '市场观察' },
      },
      {
        path: 'monthly-reports',
        name: 'monthly-reports',
        component: MonthlyReportsPage,
        meta: { title: '月度报告' },
      },
      { path: 'settings', name: 'settings', component: SettingsPage, meta: { title: '设置' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 页面标题自动更新
router.afterEach((to) => {
  const title = (to.meta.title as string | undefined) ?? 'Invest Record Pro'
  document.title = `${title} | Invest Record Pro`
})

export default router

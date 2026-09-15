<template>
  <div class="app" :class="{ 'sidebar-collapsed': collapsed }">
    <!-- Mobile backdrop -->
    <div
      v-if="mobileOpen"
      class="sidebar-backdrop"
      @click="closeMobile"
    ></div>

    <!-- Sidebar -->
    <!-- aria-hidden only when the mobile drawer is off-canvas; desktop sidebar stays in the a11y tree -->
    <aside
      id="app-sidebar"
      class="sidebar"
      :class="{ 'is-open': mobileOpen }"
      :aria-hidden="mobileOpen ? 'false' : (isMobile ? 'true' : 'false')"
    >
      <div class="sidebar-logo">
        <div class="logo-mark">{{ companyInitial }}</div>
        <div v-show="!collapsed" class="logo-text">
          <span class="logo-name">{{ t('nav.companyName') }}</span>
          <span class="logo-subtitle">{{ t('nav.subtitle') }}</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: $route.path === item.to }"
          :aria-current="$route.path === item.to ? 'page' : null"
          :aria-label="collapsed ? t(item.key) : null"
          :title="collapsed ? t(item.key) : null"
          @click="closeMobile"
        >
          <span class="nav-icon" v-html="icons[item.icon]"></span>
          <span v-show="!collapsed" class="nav-label">{{ t(item.key) }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button
          class="collapse-btn"
          @click="toggleCollapsed"
          :aria-expanded="!collapsed"
          :aria-label="collapsed ? t('nav.expand') : t('nav.collapse')"
          :title="collapsed ? t('nav.expand') : t('nav.collapse')"
        >
          <span class="nav-icon" v-html="collapsed ? icons.chevronRight : icons.chevronLeft"></span>
          <span v-show="!collapsed" class="nav-label">{{ t('nav.collapse') }}</span>
        </button>
      </div>
    </aside>

    <!-- Content column -->
    <div class="content-column">
      <header class="top-bar">
        <div class="top-bar-left">
          <button
            class="hamburger"
            @click="toggleMobile"
            :aria-label="t('nav.openMenu')"
            :aria-expanded="mobileOpen"
            aria-controls="app-sidebar"
          >
            <span class="nav-icon" v-html="icons.menu"></span>
          </button>
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="top-bar-right">
          <FilterBar />
          <LanguageSwitcher />
          <ProfileMenu
            @show-profile-details="showProfileDetails = true"
            @show-tasks="showTasks = true"
          />
        </div>
      </header>

      <main class="main-content">
        <router-view />
      </main>
    </div>

    <ProfileDetailsModal
      :is-open="showProfileDetails"
      @close="showProfileDetails = false"
    />

    <TasksModal
      :is-open="showTasks"
      :tasks="tasks"
      @close="showTasks = false"
      @add-task="addTask"
      @delete-task="deleteTask"
      @toggle-task="toggleTask"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { api } from './api'
import { useAuth } from './composables/useAuth'
import { useI18n } from './composables/useI18n'
import { useSidebar } from './composables/useSidebar'
import FilterBar from './components/FilterBar.vue'
import ProfileMenu from './components/ProfileMenu.vue'
import ProfileDetailsModal from './components/ProfileDetailsModal.vue'
import TasksModal from './components/TasksModal.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'

// Nav items — labels/routes/icons live in one place
const navItems = [
  { to: '/',          key: 'nav.overview',       icon: 'grid'  },
  { to: '/inventory', key: 'nav.inventory',      icon: 'box'   },
  { to: '/orders',    key: 'nav.orders',         icon: 'cart'  },
  { to: '/spending',  key: 'nav.finance',        icon: 'chart' },
  { to: '/demand',    key: 'nav.demandForecast', icon: 'trend' },
  { to: '/reports',   key: 'nav.reports',        icon: 'doc'   },
]

// Inline SVG icons (stroke = currentColor, 20x20)
const icons = {
  grid: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  box: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  cart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
  chart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  trend: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  doc: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  chevronLeft: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  chevronRight: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
}

export default {
  name: 'App',
  components: {
    FilterBar,
    ProfileMenu,
    ProfileDetailsModal,
    TasksModal,
    LanguageSwitcher
  },
  setup() {
    const { currentUser } = useAuth()
    const { t } = useI18n()
    const route = useRoute()
    const { collapsed, mobileOpen, toggleCollapsed, toggleMobile, closeMobile } = useSidebar()

    const showProfileDetails = ref(false)
    const showTasks = ref(false)
    const apiTasks = ref([])

    // Reactive mobile-breakpoint flag (matches the max-width: 767px CSS media query)
    // Used to drive the sidebar's aria-hidden so the desktop drawer is never hidden.
    const mobileQuery = window.matchMedia('(max-width: 767px)')
    const isMobile = ref(mobileQuery.matches)
    const handleMediaChange = (e) => { isMobile.value = e.matches }

    // Escape-to-close for the mobile drawer
    const handleKeydown = (e) => {
      if (e.key === 'Escape' && mobileOpen.value) {
        closeMobile()
      }
    }

    const companyInitial = computed(() => {
      const name = t('nav.companyName')
      return name ? name.charAt(0) : 'C'
    })

    // Page title derived from route, reusing the SAME keys as navItems
    const pageTitleMap = navItems.reduce((acc, item) => {
      acc[item.to] = item.key
      return acc
    }, {})

    const pageTitle = computed(() => {
      const key = pageTitleMap[route.path]
      return key ? t(key) : t('nav.companyName')
    })

    // Merge mock tasks from currentUser with API tasks
    const tasks = computed(() => {
      return [...currentUser.value.tasks, ...apiTasks.value]
    })

    const loadTasks = async () => {
      try {
        apiTasks.value = await api.getTasks()
      } catch (err) {
        console.error('Failed to load tasks:', err)
      }
    }

    const addTask = async (taskData) => {
      try {
        const newTask = await api.createTask(taskData)
        // Add new task to the beginning of the array
        apiTasks.value.unshift(newTask)
      } catch (err) {
        console.error('Failed to add task:', err)
      }
    }

    const deleteTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const isMockTask = currentUser.value.tasks.some(t => t.id === taskId)

        if (isMockTask) {
          // Remove from mock tasks
          const index = currentUser.value.tasks.findIndex(t => t.id === taskId)
          if (index !== -1) {
            currentUser.value.tasks.splice(index, 1)
          }
        } else {
          // Remove from API tasks
          await api.deleteTask(taskId)
          apiTasks.value = apiTasks.value.filter(t => t.id !== taskId)
        }
      } catch (err) {
        console.error('Failed to delete task:', err)
      }
    }

    const toggleTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const mockTask = currentUser.value.tasks.find(t => t.id === taskId)

        if (mockTask) {
          // Toggle mock task status
          mockTask.status = mockTask.status === 'pending' ? 'completed' : 'pending'
        } else {
          // Toggle API task
          const updatedTask = await api.toggleTask(taskId)
          const index = apiTasks.value.findIndex(t => t.id === taskId)
          if (index !== -1) {
            apiTasks.value[index] = updatedTask
          }
        }
      } catch (err) {
        console.error('Failed to toggle task:', err)
      }
    }

    onMounted(() => {
      loadTasks()
      mobileQuery.addEventListener('change', handleMediaChange)
      window.addEventListener('keydown', handleKeydown)
    })

    onUnmounted(() => {
      mobileQuery.removeEventListener('change', handleMediaChange)
      window.removeEventListener('keydown', handleKeydown)
    })

    return {
      t,
      navItems,
      icons,
      collapsed,
      mobileOpen,
      isMobile,
      toggleCollapsed,
      toggleMobile,
      closeMobile,
      companyInitial,
      pageTitle,
      showProfileDetails,
      showTasks,
      tasks,
      addTask,
      deleteTask,
      toggleTask
    }
  }
}
</script>

<style>
:root {
  --slate-900:#0f172a; --slate-700:#334155; --slate-600:#64748b; --slate-400:#94a3b8;
  --slate-300:#e2e8f0; --slate-100:#f1f5f9; --slate-50:#f8fafc; --white:#ffffff;
  --indigo-600:#6366f1; --indigo-700:#4f46e5; --indigo-50:#eef2ff;   /* accent / active nav */
  --green:#10b981; --amber:#f59e0b; --red:#ef4444; --blue:#3b82f6;    /* status */
  --space-1:.25rem; --space-2:.5rem; --space-3:.75rem; --space-4:1rem; --space-5:1.5rem; --space-6:2rem;
  --radius-control:6px; --radius-card:12px;
  --card-pad:1.5rem;
  --shadow-card:0 1px 3px rgba(0,0,0,.06); --shadow-card-hover:0 4px 12px rgba(0,0,0,.08);
  --shadow-nav:0 1px 3px 0 rgba(0,0,0,.05); --shadow-dropdown:0 10px 25px rgba(0,0,0,.1);
  --sidebar-w:256px; --sidebar-w-collapsed:64px; --topbar-h:64px;
  --font:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font);
  background: var(--slate-50);
  color: var(--slate-900);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  min-height: 100vh;
}

/* ============ SIDEBAR ============ */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: var(--sidebar-w);
  background: var(--white);
  border-right: 1px solid var(--slate-300);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 200;
  transition: width .2s ease, transform .2s ease;
}

.app.sidebar-collapsed .sidebar {
  width: var(--sidebar-w-collapsed);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--topbar-h);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--slate-300);
  flex-shrink: 0;
}

.logo-mark {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-control);
  background: var(--indigo-600);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.logo-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.logo-name {
  font-size: 0.938rem;
  font-weight: 700;
  color: var(--slate-900);
  letter-spacing: -0.025em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logo-subtitle {
  font-size: 0.688rem;
  color: var(--slate-600);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-2);
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  color: var(--slate-600);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.938rem;
  border-radius: var(--radius-control);
  transition: background .15s ease, color .15s ease;
  white-space: nowrap;
}

.nav-item:hover {
  color: var(--slate-900);
  background: var(--slate-100);
}

.nav-item.active {
  color: var(--indigo-600);
  background: var(--indigo-50);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.app.sidebar-collapsed .nav-item,
.app.sidebar-collapsed .collapse-btn {
  justify-content: center;
}

.sidebar-footer {
  padding: var(--space-2);
  border-top: 1px solid var(--slate-300);
  flex-shrink: 0;
}

.collapse-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: none;
  border: none;
  color: var(--slate-600);
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  font-size: 0.938rem;
  border-radius: var(--radius-control);
  transition: background .15s ease, color .15s ease;
}

.collapse-btn:hover {
  color: var(--slate-900);
  background: var(--slate-100);
}

.sidebar-backdrop {
  display: none;
}

/* ============ CONTENT COLUMN ============ */
.content-column {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin-left: var(--sidebar-w);
  transition: margin-left .2s ease;
}

.app.sidebar-collapsed .content-column {
  margin-left: var(--sidebar-w-collapsed);
}

/* ============ TOP BAR ============ */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--topbar-h);
  background: var(--white);
  border-bottom: 1px solid var(--slate-300);
  box-shadow: var(--shadow-nav);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 0 var(--space-6);
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.hamburger {
  display: none;
  align-items: center;
  justify-content: center;
  padding: var(--space-2);
  background: none;
  border: none;
  color: var(--slate-600);
  cursor: pointer;
  border-radius: var(--radius-control);
}

.hamburger:hover {
  background: var(--slate-100);
  color: var(--slate-900);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--slate-900);
  letter-spacing: -0.025em;
  white-space: nowrap;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  flex: 1;
  justify-content: flex-end;
}

/* ============ MAIN CONTENT ============ */
.main-content {
  flex: 1;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: var(--space-5) var(--space-6);
}

.page-header {
  margin-bottom: var(--space-5);
}

.page-header h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--slate-900);
  margin-bottom: var(--space-1);
  letter-spacing: -0.025em;
}

.page-header p {
  color: var(--slate-600);
  font-size: 0.938rem;
}

/* ============ STATS ============ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-5);
  margin-bottom: var(--space-5);
}

.stat-card {
  background: var(--white);
  padding: var(--card-pad);
  border-radius: var(--radius-card);
  border: 1px solid var(--slate-300);
  box-shadow: var(--shadow-card);
  transition: box-shadow .2s ease;
}

.stat-card:hover {
  box-shadow: var(--shadow-card-hover);
}

.stat-label {
  color: var(--slate-600);
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--space-2);
}

.stat-value {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--slate-900);
  letter-spacing: -0.025em;
}

.stat-card.warning .stat-value {
  color: var(--amber);
}

.stat-card.success .stat-value {
  color: var(--green);
}

.stat-card.danger .stat-value {
  color: var(--red);
}

.stat-card.info .stat-value {
  color: var(--indigo-600);
}

/* ============ CARD ============ */
.card {
  background: var(--white);
  border-radius: var(--radius-card);
  padding: var(--card-pad);
  border: 1px solid var(--slate-300);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--space-5);
  transition: box-shadow .2s ease;
}

.card:hover {
  box-shadow: var(--shadow-card-hover);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--slate-300);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--slate-900);
  letter-spacing: -0.025em;
}

/* ============ TABLE ============ */
.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: var(--slate-50);
  border-top: 1px solid var(--slate-300);
  border-bottom: 1px solid var(--slate-300);
  position: sticky;
  top: 0;
  z-index: 1;
}

th {
  text-align: left;
  padding: var(--space-3);
  font-weight: 600;
  color: var(--slate-700);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

td {
  padding: var(--space-3);
  border-top: 1px solid var(--slate-100);
  color: var(--slate-700);
  font-size: 0.875rem;
}

tbody tr {
  transition: background-color 0.15s ease;
}

tbody tr:hover {
  background: var(--slate-50);
}

/* ============ BADGE ============ */
.badge {
  display: inline-block;
  padding: 0.313rem 0.75rem;
  border-radius: var(--radius-control);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.badge.success {
  background: #d1fae5;
  color: #065f46;
}

.badge.warning {
  background: #fed7aa;
  color: #92400e;
}

.badge.danger {
  background: #fecaca;
  color: #991b1b;
}

.badge.info {
  background: #dbeafe;
  color: #1e40af;
}

.badge.increasing {
  background: #d1fae5;
  color: #065f46;
}

.badge.decreasing {
  background: #fecaca;
  color: #991b1b;
}

.badge.stable {
  background: #e0e7ff;
  color: #3730a3;
}

.badge.high {
  background: #fecaca;
  color: #991b1b;
}

.badge.medium {
  background: #fed7aa;
  color: #92400e;
}

.badge.low {
  background: #dbeafe;
  color: #1e40af;
}

/* ============ STATES ============ */
.loading {
  text-align: center;
  padding: var(--space-6);
  color: var(--slate-600);
  font-size: 0.938rem;
}

.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: var(--space-4);
  border-radius: var(--radius-card);
  margin: var(--space-4) 0;
  font-size: 0.938rem;
}

/* ============ RESPONSIVE ============ */
@media (max-width: 767px) {
  .sidebar {
    transform: translateX(-100%);
    width: var(--sidebar-w);
    box-shadow: var(--shadow-dropdown);
  }

  .app.sidebar-collapsed .sidebar {
    width: var(--sidebar-w);
  }

  .sidebar.is-open {
    transform: translateX(0);
  }

  .app.sidebar-collapsed .sidebar .logo-text,
  .app.sidebar-collapsed .sidebar .nav-label {
    display: inline !important;
  }

  .content-column,
  .app.sidebar-collapsed .content-column {
    margin-left: 0;
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    z-index: 150;
  }

  .hamburger {
    display: inline-flex;
  }

  .sidebar-footer {
    display: none;
  }

  .main-content {
    padding: var(--space-4);
  }

  .top-bar {
    padding: 0 var(--space-4);
  }
}

/* Keyboard focus rings — visible indigo ring for primary nav / controls */
.nav-item:focus-visible,
.collapse-btn:focus-visible,
.hamburger:focus-visible {
  outline: 2px solid var(--indigo-600);
  outline-offset: 2px;
  border-radius: var(--radius-control);
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .content-column,
  .nav-item,
  .collapse-btn,
  .card,
  .stat-card {
    transition: none !important;
  }
}
</style>

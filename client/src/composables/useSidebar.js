import { ref } from 'vue'

// Shared sidebar state (singleton pattern)
const collapsed = ref(false)   // desktop icons-only toggle
const mobileOpen = ref(false)  // mobile off-canvas drawer

export function useSidebar() {
  const toggleCollapsed = () => {
    collapsed.value = !collapsed.value
  }

  const toggleMobile = () => {
    mobileOpen.value = !mobileOpen.value
  }

  const closeMobile = () => {
    mobileOpen.value = false
  }

  return {
    // State
    collapsed,
    mobileOpen,

    // Methods
    toggleCollapsed,
    toggleMobile,
    closeMobile
  }
}

/**
 * 页面引导 composable — 基于 driver.js
 * 用法：const { startTour, GuideButton } = usePageGuide(steps)
 */
import { driver } from 'driver.js'
import { h, ref } from 'vue'

const T = {
  doneBtnText: '知道了',
  closeBtnText: '跳过',
  nextBtnText: '下一步',
  prevBtnText: '上一步',
  progressText: '{{current}} / {{total}}',
}

export function usePageGuide() {
  const tourRef = ref(null)

  function startTour(steps, options = {}) {
    if (tourRef.value) tourRef.value.destroy()
    tourRef.value = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      ...T,
      ...options,
      steps,
    })
    tourRef.value.drive()
  }

  return { startTour }
}

/**
 * 渲染一个引导按钮（可在 template 中使用）
 * 用法：<component :is="GuideButton({ steps, text:'页面引导', style:{} })" />
 */
export function createGuideButton(props = {}) {
  const { steps = [], text = '页面引导', style = {} } = props
  const { startTour } = usePageGuide()

  return {
    setup() {
      return () => h('button', {
        class: 'btn-guide',
        style,
        onClick: () => startTour(steps),
      }, [
        h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', innerHTML: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>' }),
        h('span', text),
      ])
    },
  }
}

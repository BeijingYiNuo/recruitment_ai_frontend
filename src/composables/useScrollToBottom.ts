import { ref, nextTick, type Ref } from 'vue'

/**
 * 一个用于处理容器自动滚动到底部的 Composable
 * @param scrollContainerRef 滚动容器的 ref
 */
export function useScrollToBottom(scrollContainerRef: Ref<HTMLElement | null>) {
  const scrollToBottom = () => {
    nextTick(() => {
      if (scrollContainerRef.value) {
        scrollContainerRef.value.scrollTop = scrollContainerRef.value.scrollHeight
      }
    })
  }

  return {
    scrollToBottom
  }
}

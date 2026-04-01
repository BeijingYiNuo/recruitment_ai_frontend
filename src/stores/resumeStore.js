import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useResumeStore = defineStore('resume', () => {
  // ----- State -----
  const resumes = ref([])
  const selectedResume = ref(null)

  // ----- Actions -----
  /** 添加一份新简历（上传后调用） */
  const addResume = (resume) => {
    resumes.value.unshift(resume)
  }

  /** 删除简历 */
  const deleteResume = (id) => {
    const target = resumes.value.find(r => r.id === id)
    if (target && target.preview_url) {
      URL.revokeObjectURL(target.preview_url)
    }
    resumes.value = resumes.value.filter(r => r.id !== id)
    // 如果正在查看被删除的简历，关闭详情
    if (selectedResume.value && selectedResume.value.id === id) {
      selectedResume.value = null
    }
  }

  /** 选中查看某份简历详情 */
  const selectResume = (resume) => {
    selectedResume.value = resume
  }

  /** 关闭简历详情 */
  const clearSelection = () => {
    selectedResume.value = null
  }

  return {
    resumes,
    selectedResume,
    addResume,
    deleteResume,
    selectResume,
    clearSelection
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppointmentStore = defineStore('appointment', () => {
  // ----- State -----
  const appointments = ref([])
  const showModal = ref(false)
  const isEditMode = ref(false)
  const appointmentForm = ref(createEmptyForm())

  // ----- Helpers -----
  function createEmptyForm() {
    return {
      id: null,
      candidate_id: '',
      candidate_name: '',
      scheduled_at: '',
      location: '',
      contact_phone: '',
      notes: '',
      status: 'pending'
    }
  }

  // ----- Actions -----
  /** 打开新增弹窗 */
  const openModal = () => {
    isEditMode.value = false
    appointmentForm.value = createEmptyForm()
    showModal.value = true
  }

  /** 打开编辑弹窗 */
  const editAppointment = (item) => {
    isEditMode.value = true
    appointmentForm.value = { ...item }
    showModal.value = true
  }

  /** 关闭弹窗 */
  const closeModal = () => {
    showModal.value = false
  }

  /** 保存约见（新增或编辑） */
  const saveAppointment = () => {
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ')

    if (isEditMode.value) {
      const target = appointments.value.find(a => a.id === appointmentForm.value.id)
      if (target) {
        Object.assign(target, appointmentForm.value, { updated_at: nowStr })
      }
    } else {
      const newAppointment = {
        ...appointmentForm.value,
        id: Date.now(),
        status: 'pending',
        created_at: nowStr,
        updated_at: nowStr
      }
      appointments.value.unshift(newAppointment)
    }
    showModal.value = false
  }

  /** 删除约见 */
  const deleteAppointment = (id) => {
    appointments.value = appointments.value.filter(a => a.id !== id)
  }

  /** 更新状态 */
  const updateStatus = (id, status) => {
    const target = appointments.value.find(a => a.id === id)
    if (target) {
      target.status = status
      target.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ')
    }
  }

  return {
    appointments,
    showModal,
    isEditMode,
    appointmentForm,
    openModal,
    editAppointment,
    closeModal,
    saveAppointment,
    deleteAppointment,
    updateStatus
  }
})

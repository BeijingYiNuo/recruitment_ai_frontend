const fs = require('fs');

const file = 'd:/code/recruitment_ai_frontend/src/views/DashboardView.vue';
let content = fs.readFileSync(file, 'utf8');

// Replace uploadResume block
const targetStr = `    uploadResume() {
      this.showMessage('上传简历功能开发中', 'info')
    },`;

const replacement = `    triggerResumeUpload() {
      this.$refs.resumeInput.click()
    },
    async handleResumeUpload(event) {
      const file = event.target.files[0]
      if (!file) return
      
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type) && !file.name.match(/\\.(pdf|doc|docx)$/i)) {
        this.showMessage('只支持 PDF 或 Word 格式的简历文件', 'error')
        event.target.value = ''
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        this.showMessage('简历文件大小不能超过 5MB', 'error')
        event.target.value = ''
        return
      }
      
      this.showMessage('正在解析并上传简历...', 'info')
      
      try {
        // 在这里预留未来调用后端的接口
        // const formData = new FormData()
        // formData.append('file', file)
        // await interviewApi.uploadResume(formData)
        
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1500))
        this.showMessage(\`简历 \${file.name} 上传成功！\`, 'success')
      } catch (error) {
        this.showMessage('上传失败: ' + (error.detail || error.message), 'error')
      } finally {
        event.target.value = ''
      }
    },`;

content = content.replace(targetStr, replacement);
// also try another format if CRLF
content = content.replace(targetStr.replace(/\n/g, '\r\n'), replacement);

fs.writeFileSync(file, content, 'utf8');
console.log('Update finished.');

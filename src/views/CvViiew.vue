<!-- ========== 简历管理页 ========== -->
        <template >
          <el-card class="list-card" shadow="never">
            <template #header>
              <div class="list-header" style="display: flex; justify-content: space-between; align-items: center;">
                <span>简历管理台 (功能区)</span>
                <el-button type="primary" size="small" @click="triggerResumeUpload">上传新简历</el-button>
              </div>
            </template>
            <el-table 
              :data="resumes" 
              style="width: 100%" 
              :header-cell-style="{ background: '#fafafa', color: '#606266', fontWeight: 500, borderBottom: '1px solid #ebeef5' }"
            >
              <el-table-column prop="file_name" label="文件名称" min-width="150" show-overflow-tooltip></el-table-column>
              <el-table-column prop="file_type" label="格式" width="100">
                <template #default="scope">
                  {{ scope.row.file_type.toUpperCase() }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="解析状态" width="120">
                <template #default="scope">
                  <el-tag size="small" type="success" :class="['status-tag', 'status-success']">
                    {{ scope.row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="上传时间" width="180"></el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="scope">
                  <el-button type="primary" link size="small" class="action-btn" @click="viewResume(scope.row)">查看</el-button>
                  <el-button type="danger" link size="small" class="action-btn" @click="deleteResume(scope.row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </template>
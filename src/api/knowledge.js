import request from '../utils/request'

export const knowledgeApi = {
  // 创建知识库
  createCollection: (data) => request.post('/knowledge/collection/create', data),

  // 获取用户知识库列表
  getCollections: () => request.get('/knowledge/collection/list'),

  // 删除知识库
  deleteCollection: (name) => request.delete('/knowledge/collection/delete', { params: { name } }),

  // 更新知识库描述
  updateCollection: (name, description) => request.put('/knowledge/collection/update', null, { params: { name, description } }),

  // 获取知识库详情
  getCollectionInfo: (name) => request.get('/knowledge/collection/info', { params: { name } }),

  // 获取知识库文档列表
  listDocuments: (collectionName) => request.get('/knowledge/document/list', { params: { collection_name: collectionName } }),

  // 获取文档切片列表
  listPoints: (collectionName, docId) => request.post(`/knowledge/document/list_point?collection_name=${encodeURIComponent(collectionName)}&doc_id=${encodeURIComponent(docId)}`)
}

import { useState } from 'react'
import { Button, Card, message, Upload } from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import { InboxOutlined } from '@ant-design/icons'

const { Dragger } = Upload

/**
 * 后端上传接口地址。
 * - 同域/走网关时保持相对路径 '/api/upload'；
 * - 独立后端时改成完整地址，或在 build/vite.page.mjs 里为 dev 配 server.proxy 转发。
 * 后端需接收 multipart/form-data，文件字段名为 `files`（可多文件）。
 */
const UPLOAD_URL = '/api/upload'

export default function App() {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  const draggerProps: UploadProps = {
    multiple: true,
    fileList,
    // 阻止 antd 选择后立即自动上传，改为手动点击「确定」统一提交
    beforeUpload: () => false,
    onChange: ({ fileList: list }) => setFileList(list),
  }

  const handleReset = () => setFileList([])

  const handleSubmit = async () => {
    const files = fileList
      .map((f) => f.originFileObj)
      .filter((f): f is NonNullable<typeof f> => Boolean(f))

    if (files.length === 0) {
      messageApi.warning('请先选择要上传的文件')
      return
    }

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file, file.name))

    setUploading(true)
    try {
      const res = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      messageApi.success(`成功上传 ${files.length} 个文件`)
      setFileList([])
    } catch (err) {
      messageApi.error(
        `上传失败：${err instanceof Error ? err.message : String(err)}`,
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card
      title="文件上传"
      style={{ maxWidth: 720, margin: '48px auto' }}
      extra={
        <span style={{ color: '#999', fontSize: 12 }}>接口：{UPLOAD_URL}</span>
      }
    >
      {contextHolder}
      <Dragger {...draggerProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域选择</p>
        <p className="ant-upload-hint">
          支持单次或批量选择，选好后点击下方「确定」统一上传
        </p>
      </Dragger>

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Button
          style={{ marginRight: 8 }}
          onClick={handleReset}
          disabled={uploading || fileList.length === 0}
        >
          清空
        </Button>
        <Button
          type="primary"
          loading={uploading}
          onClick={handleSubmit}
          disabled={fileList.length === 0}
        >
          确定
        </Button>
      </div>
    </Card>
  )
}

// POST /api/teacher/upload — 接收试卷文件，保存到 KV 存储并更新 teacher-upload.json
// 对应后端 backend/routes/teacher.js 中的 router.post('/upload', upload.single('file'))
// 注：后端使用 multer 存盘到本地 uploads 目录，Cloudflare 边缘改为存入 KV
// 支持两种请求形式：multipart/form-data（file 字段，与原前端一致）或 JSON（{name,size,content_base64}）
export async function onRequestPost({ request, env }) {
    try {
        const contentType = request.headers.get('content-type') || '';
        let fileName, fileSize, originalName, fileBlob = null, fileBytes = 0;

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file');
            if (!file) {
                return Response.json({ code: 1, msg: '未收到文件' }, { status: 400 });
            }
            // 文件类型校验：仅允许 PDF/Word/图片
            const allowed = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg',
                'image/png',
                'image/jpg'
            ];
            const fileType = file.type || '';
            if (fileType && !allowed.includes(fileType)) {
                return Response.json({ code: 1, msg: '不支持的文件类型: ' + fileType }, { status: 400 });
            }
            // 50MB 限制
            if (file.size > 50 * 1024 * 1024) {
                return Response.json({ code: 1, msg: '文件大小超过 50MB 限制' }, { status: 400 });
            }
            fileName = formData.get('name') || file.name;
            originalName = file.name;
            fileBytes = file.size;
            fileSize = formData.get('size') || formatSize(file.size);
            fileBlob = file;
        } else {
            // JSON 回退
            const body = await request.json();
            if (!body || !body.name) {
                return Response.json({ code: 1, msg: '未收到文件' }, { status: 400 });
            }
            fileName = body.name;
            originalName = body.original_name || body.name;
            fileBytes = body.content_base64 ? atob(body.content_base64).length : (body.size_bytes || 0);
            fileSize = body.size || formatSize(fileBytes);
        }

        // 构造新记录
        const now = new Date();
        const timeStr = '今天 ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        const fileId = 'upload_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
        const newEntry = {
            id: fileId,
            name: fileName,
            size: fileSize,
            time: timeStr,
            status: '已上传',
            progress: 30,
            _originalName: originalName,
            _bytes: fileBytes
        };

        // 读取现有 teacher-upload.json
        const raw = await env.DATA_STORE.get('teacher-upload.json');
        let data = { uploaded: [] };
        if (raw) {
            try { data = JSON.parse(raw); } catch (e) { data = { uploaded: [] }; }
        }
        if (!data.uploaded) data.uploaded = [];
        data.uploaded.unshift(newEntry);

        // 若文件内容较小（< 5MB），存入 KV 作为单独条目，便于后续解析
        if (fileBlob && fileBytes < 5 * 1024 * 1024) {
            try {
                const buf = await fileBlob.arrayBuffer();
                await env.DATA_STORE.put('uploads/' + fileId + '_' + originalName, buf);
            } catch (e) {
                // 存内容失败不影响元数据记录
            }
        }

        // 保存元数据回 KV
        await env.DATA_STORE.put('teacher-upload.json', JSON.stringify(data, null, 2));

        return Response.json({
            code: 0,
            msg: '试卷上传成功',
            data: {
                name: fileName,
                size: fileSize,
                time: timeStr,
                status: '已上传',
                progress: 30,
                filePath: 'uploads/' + fileId + '_' + originalName,
                totalUploaded: data.uploaded.length
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '上传失败: ' + e.message }, { status: 500 });
    }
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

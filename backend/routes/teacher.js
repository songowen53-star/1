// ========== 教师后台路由 ==========
// 提供试卷上传、试卷列表管理等接口
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const pagesDir = path.join(__dirname, '..', 'data', 'pages');
const uploadDir = path.join(__dirname, '..', 'data', 'uploads');

// 确保目录存在
if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// multer 配置：存储到 uploads 目录，文件名加时间戳防冲突
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 保留原始扩展名
        var ext = path.extname(file.originalname);
        var base = path.basename(file.originalname, ext);
        cb(null, base + '_' + Date.now() + ext);
    }
});

// 文件过滤：仅允许 PDF/Word/图片
function fileFilter(req, file, cb) {
    var allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/jpg'
    ];
    if (allowed.indexOf(file.mimetype) !== -1) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型: ' + file.mimetype), false);
    }
}

var upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }  // 50MB
});

// POST /api/teacher/upload
// 接收试卷文件，保存到 uploads 目录，并更新 teacher-upload.json
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ code: 1, msg: '未收到文件' });
    }

    var file = req.file;
    var fileName = req.body.name || file.originalname;
    var fileSize = req.body.size || formatSize(file.size);

    // 读取现有 teacher-upload.json
    var dataFile = path.join(pagesDir, 'teacher-upload.json');
    var data = { uploaded: [] };
    try {
        if (fs.existsSync(dataFile)) {
            data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        }
    } catch (e) {
        console.error('[teacher] 读取 teacher-upload.json 失败:', e.message);
    }

    // 构造新记录
    var now = new Date();
    var timeStr = '今天 ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    var newEntry = {
        name: fileName,
        size: fileSize,
        time: timeStr,
        status: '已上传',
        progress: 30,
        _filePath: file.path,
        _originalName: file.originalname
    };

    // 添加到列表顶部
    if (!data.uploaded) data.uploaded = [];
    data.uploaded.unshift(newEntry);

    // 保存回 JSON 文件
    try {
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('[teacher] 保存 teacher-upload.json 失败:', e.message);
    }

    res.json({
        code: 0,
        msg: '试卷上传成功',
        data: {
            name: fileName,
            size: fileSize,
            time: timeStr,
            status: '已上传',
            progress: 30,
            filePath: file.path,
            totalUploaded: data.uploaded.length
        }
    });
});

// 错误处理中间件（multer 错误）
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ code: 1, msg: '文件大小超过 50MB 限制' });
        }
        return res.status(400).json({ code: 1, msg: '上传错误: ' + err.message });
    }
    if (err) {
        return res.status(400).json({ code: 1, msg: err.message });
    }
    next();
});

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

module.exports = router;

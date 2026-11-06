/**
 * 模拟 8631同学 跑完 100 题学情诊断（token 预先生成）
 */
const http = require('http');

const HOST = 'localhost';
const PORT = 8080;

function post(path, token, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts = {
      hostname: HOST, port: PORT, path, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    };
    const req = http.request(opts, res => {
      let buf = ''; res.on('data', c => buf += c);
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch (e) { reject(new Error('bad JSON: ' + buf)); } });
    });
    req.on('error', reject);
    req.end(data);
  });
}

async function main() {
  const TOKEN = 'tk_8b9fd2cbf7dd48e47a6d54db673491d941c8';
  const USER = '8631同学 (13992818631)';
  console.log('👤 用户:', USER);

  // ===== 启动新诊断 =====
  const start = await post('/api/diagnostic/start', TOKEN, {});
  if (start.code !== 0) { console.error('❌ 启动失败:', start); process.exit(1); }
  const sessionId = start.data.session_id;
  const questions = start.data.questions;
  console.log('🎯 诊断已启动: session=' + sessionId + '  共', questions.length, '题');

  const sc = {}; questions.forEach(q => sc[q.subject] = (sc[q.subject] || 0) + 1);
  console.log('   学科分布:', JSON.stringify(sc));

  // ===== 批量答题（70% 正确率模拟） =====
  let correctCount = 0;
  const subjStats = {};

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    let chosen;
    const isCorrect = Math.random() < 0.70;
    if (isCorrect) { chosen = q.answer_index; correctCount++; }
    else {
      const wrongs = [0, 1, 2, 3].filter(x => x !== q.answer_index);
      chosen = wrongs[Math.floor(Math.random() * wrongs.length)];
    }
    subjStats[q.subject] = subjStats[q.subject] || { total: 0, correct: 0 };
    subjStats[q.subject].total++;
    if (isCorrect) subjStats[q.subject].correct++;

    await post(`/api/diagnostic/${sessionId}/answer`, TOKEN, {
      question_id: q.id,
      answer_index: chosen,
      duration_sec: 20 + Math.floor(Math.random() * 60)
    });

    if ((i + 1) % 20 === 0) process.stdout.write(`   ✅ ${i+1}/${questions.length}  正确 ${correctCount}/${i+1}  ⏳\r`);
  }
  process.stdout.write('\n\n');

  console.log('📊 各学科正确率:');
  Object.entries(subjStats).forEach(([s, v]) => {
    const pct = Math.round(v.correct / v.total * 100);
    console.log(`   ${s.padEnd(4)}  ${v.correct}/${v.total}  ${'█'.repeat(Math.round(pct/5)).padEnd(20)}  ${pct}%`);
  });
  console.log(`   总计  ${correctCount}/${questions.length}  ${'█'.repeat(Math.round(correctCount/questions.length*4)).padEnd(20)}  ${Math.round(correctCount/questions.length*100)}%\n`);

  // ===== 提交诊断 =====
  console.log('📝 提交诊断，生成报告...');
  const submit = await post(`/api/diagnostic/${sessionId}/submit`, TOKEN, {});
  if (submit.code !== 0) { console.error('❌ 提交失败:', submit); process.exit(1); }
  const report = submit.data;

  // ===== 打印报告摘要 =====
  console.log('═'.repeat(50));
  console.log('🎉 学情诊断完成报告 · 8631同学');
  console.log('═'.repeat(50));
  console.log('📚 会话 ID   :', report.session_id);
  console.log('📝 总题数   :', report.summary.total_questions);
  console.log('✅ 正确     :', report.summary.total_correct);
  console.log('📈 正确率   :', Math.round(report.summary.accuracy * 100) + '%');
  console.log('💡 薄弱学科 :', (report.summary.weak_subjects || []).join(', ') || '(无)');
  console.log('🌟 优势学科 :', (report.summary.strong_subjects || []).join(', ') || '(无)');
  console.log('⏱ 总耗时   :', Math.round(report.summary.total_duration_sec / 60) + ' 分钟');

  if (report.subject_breakdown) {
    console.log('\n📊 学科能力详情:');
    Object.values(report.subject_breakdown).forEach(sb => {
      const bar = '█'.repeat(Math.round(sb.accuracy * 15));
      console.log(`   ${sb.subject.padEnd(4)}  ${String(sb.correct).padStart(2)}/${String(sb.total).padStart(2)}  ${bar.padEnd(17)} ${Math.round(sb.accuracy*100)}%`);
    });
  }

  if (report.weak_points && report.weak_points.length) {
    console.log('\n⚠️  薄弱知识点 TOP 5:');
    report.weak_points.slice(0, 5).forEach(wp => {
      const pct = Math.round((wp.accuracy || 0) * 100);
      console.log(`   • [${wp.subject}] ${wp.knowledge_point}  (正确率 ${pct}%)`);
    });
  }

  if (report.ability_profile) {
    console.log('\n🧠 能力画像:');
    const ap = report.ability_profile;
    Object.entries(ap).forEach(([k, v]) => {
      if (typeof v === 'number' && v > 0) {
        console.log(`   ${k.padEnd(12)}: ${String(v).padStart(3)}`);
      }
    });
  }

  // 完整报告 JSON 也存一份
  const fs = require('fs');
  fs.writeFileSync('/tmp/diagnostic-report-8631.json', JSON.stringify(report, null, 2));
  console.log('\n💾 完整报告已保存到 /tmp/diagnostic-report-8631.json');
  console.log('═'.repeat(50));
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

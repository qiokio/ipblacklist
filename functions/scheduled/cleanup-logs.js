// 定时清理日志任务
export async function onSchedule(event, env, ctx) {
  try {
    // 默认保留30天的日志
    const retentionDays = 30;
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    
    // 获取所有日志
    const logs = await env.API_LOGS.list({ prefix: 'log:' });
    
    // 删除过期日志
    const deletePromises = logs.keys
      .filter(key => {
        const timestamp = parseInt(key.name.replace('log:', ''));
        return timestamp < cutoffTime;
      })
      .map(key => env.API_LOGS.delete(key.name));
    
    await Promise.all(deletePromises);
    
    console.log(`成功清理 ${deletePromises.length} 条过期日志`);
  } catch (error) {
    console.error('清理日志失败:', error);
  }
} 
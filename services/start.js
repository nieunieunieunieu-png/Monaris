const { loadEnvironment, validateEnvironment } = require('../utils/environment');
try {
  loadEnvironment();
  if (![24, 26].includes(Number(process.versions.node.split('.')[0]))) throw new Error('Monaris yêu cầu Node.js 24 hoặc 26.');  const { errors, warnings } = validateEnvironment();
  for (const warning of warnings) console.warn(`[Monaris] ${warning}`);
  if (errors.length) throw new Error(errors.join('\n'));
  require('../index');
} catch (error) {
  console.error(`[Monaris] Không thể khởi động: ${error.message}`);
  process.exitCode = 1;
}

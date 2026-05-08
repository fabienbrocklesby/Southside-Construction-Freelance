import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ports = process.argv
  .slice(2)
  .map((value) => Number.parseInt(value, 10))
  .filter((value) => Number.isInteger(value) && value > 0);

if (!ports.length) {
  console.error('Usage: node scripts/kill-ports.mjs <port> [port...]');
  process.exit(1);
}

async function pidsForPort(port) {
  try {
    const { stdout } = await execFileAsync('lsof', ['-ti', `tcp:${port}`]);
    return stdout
      .split(/\s+/)
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isInteger(value) && value > 0 && value !== process.pid);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 1) {
      return [];
    }
    throw error;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function stopPid(pid) {
  try {
    process.kill(pid, 'SIGTERM');
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error;
    return;
  }

  await sleep(350);

  try {
    process.kill(pid, 0);
    process.kill(pid, 'SIGKILL');
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error;
  }
}

for (const port of ports) {
  const pids = await pidsForPort(port);
  if (!pids.length) continue;

  console.log(`Stopping ${pids.length} process(es) on port ${port}: ${pids.join(', ')}`);
  await Promise.all(pids.map(stopPid));
}

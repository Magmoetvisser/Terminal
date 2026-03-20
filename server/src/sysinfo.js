const si = require('systeminformation');

async function getSystemInfo() {
  const [cpu, mem, cpuLoad] = await Promise.all([
    si.cpu(),
    si.mem(),
    si.currentLoad(),
  ]);

  return {
    cpu: {
      model: `${cpu.manufacturer} ${cpu.brand}`,
      cores: cpu.cores,
      loadPercent: Math.round(cpuLoad.currentLoad * 10) / 10,
    },
    memory: {
      totalGB: Math.round(mem.total / 1073741824 * 10) / 10,
      usedGB: Math.round(mem.used / 1073741824 * 10) / 10,
      usedPercent: Math.round(mem.used / mem.total * 1000) / 10,
    },
  };
}

module.exports = { getSystemInfo };

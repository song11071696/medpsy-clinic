/**
 * 风险热力图模块
 * 可视化不同维度的风险分布
 */

class RiskHeatmap {
  constructor(options = {}) {
    this.dimensions = options.dimensions || [
      'self_harm', 'substance_abuse', 'isolation',
      'sleep_disorder', 'aggression', 'suicidal_ideation'
    ];
    this.timeSlots = options.timeSlots || ['morning', 'afternoon', 'evening', 'night'];
    this.riskData = [];
  }

  /**
   * 添加风险数据点
   * @param {Object} data - 风险数据
   */
  addRiskData(data) {
    if (!data || !data.userId) throw new Error('数据必须包含userId');
    this.riskData.push({
      userId: data.userId,
      timestamp: data.timestamp || new Date().toISOString(),
      scores: data.scores || {},
      context: data.context || {}
    });
    return this;
  }

  /**
   * 生成个体风险热力图
   * @param {string} userId - 用户ID
   * @returns {Object} 热力图数据
   */
  generateUserHeatmap(userId) {
    const userData = this.riskData.filter(d => d.userId === userId);
    if (userData.length === 0) throw new Error('未找到该用户的风险数据');

    const matrix = [];
    for (const timeSlot of this.timeSlots) {
      const row = [];
      for (const dimension of this.dimensions) {
        const relevant = userData.filter(d => {
          const hour = new Date(d.timestamp).getHours();
          return this._getTimeSlot(hour) === timeSlot;
        });
        const avg = relevant.length > 0
          ? relevant.reduce((sum, d) => sum + (d.scores[dimension] || 0), 0) / relevant.length
          : 0;
        row.push(Math.round(avg * 100) / 100);
      }
      matrix.push(row);
    }

    return {
      type: 'heatmap',
      userId,
      dimensions: this.dimensions,
      timeSlots: this.timeSlots,
      matrix,
      colorScale: {
        min: 0,
        max: 100,
        colors: ['#2ecc71', '#f1c40f', '#e67e22', '#e74c3c', '#8b0000']
      },
      metadata: {
        dataPoints: userData.length,
        dateRange: {
          start: userData[0]?.timestamp,
          end: userData[userData.length - 1]?.timestamp
        }
      }
    };
  }

  /**
   * 生成群体风险热力图
   * @returns {Object} 群体热力图数据
   */
  generatePopulationHeatmap() {
    const userIds = [...new Set(this.riskData.map(d => d.userId))];
    const matrix = [];

    for (const dimension of this.dimensions) {
      const row = [];
      for (const timeSlot of this.timeSlots) {
        let total = 0;
        let count = 0;
        for (const userId of userIds) {
          const userData = this.riskData.filter(d => d.userId === userId);
          const relevant = userData.filter(d => {
            const hour = new Date(d.timestamp).getHours();
            return this._getTimeSlot(hour) === timeSlot;
          });
          if (relevant.length > 0) {
            const avg = relevant.reduce((s, d) => s + (d.scores[dimension] || 0), 0) / relevant.length;
            total += avg;
            count++;
          }
        }
        row.push(count > 0 ? Math.round((total / count) * 100) / 100 : 0);
      }
      matrix.push(row);
    }

    return {
      type: 'population_heatmap',
      dimensions: this.dimensions,
      timeSlots: this.timeSlots,
      matrix,
      userCount: userIds.length,
      totalDataPoints: this.riskData.length
    };
  }

  /**
   * 获取高风险区域
   * @param {number} threshold - 风险阈值
   * @returns {Object[]} 高风险区域列表
   */
  getHighRiskAreas(threshold = 60) {
    const heatmap = this.generatePopulationHeatmap();
    const highRiskAreas = [];

    for (let i = 0; i < heatmap.dimensions.length; i++) {
      for (let j = 0; j < heatmap.timeSlots.length; j++) {
        if (heatmap.matrix[i][j] >= threshold) {
          highRiskAreas.push({
            dimension: heatmap.dimensions[i],
            timeSlot: heatmap.timeSlots[j],
            riskScore: heatmap.matrix[i][j]
          });
        }
      }
    }

    return highRiskAreas.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * 根据小时获取时间段
   */
  _getTimeSlot(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * 获取数据统计
   */
  getStats() {
    return {
      totalDataPoints: this.riskData.length,
      uniqueUsers: [...new Set(this.riskData.map(d => d.userId))].length,
      dimensions: this.dimensions.length,
      timeSlots: this.timeSlots.length
    };
  }
}

module.exports = { RiskHeatmap };

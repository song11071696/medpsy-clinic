/**
 * 进度图表模块
 * 追踪和可视化治疗进度
 */

class ProgressChart {
  constructor(options = {}) {
    this.milestones = [];
    this.progressData = [];
  }

  /**
   * 添加进度数据点
   * @param {Object} dataPoint - 进度数据
   */
  addDataPoint(dataPoint) {
    if (!dataPoint || !dataPoint.date) {
      throw new Error('进度数据必须包含日期');
    }
    this.progressData.push({
      date: dataPoint.date,
      score: dataPoint.score || 0,
      notes: dataPoint.notes || '',
      metrics: dataPoint.metrics || {}
    });
    return this;
  }

  /**
   * 设置里程碑
   * @param {Object} milestone - 里程碑信息
   */
  addMilestone(milestone) {
    this.milestones.push({
      date: milestone.date,
      label: milestone.label,
      type: milestone.type || 'checkpoint' // checkpoint, achievement, goal
    });
    return this;
  }

  /**
   * 生成进度折线图数据
   * @returns {Object} 图表配置
   */
  generateProgressChart() {
    if (this.progressData.length === 0) {
      throw new Error('没有进度数据');
    }

    const sorted = [...this.progressData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sorted.map(d => d.date);
    const scores = sorted.map(d => d.score);

    // 计算趋势线
    const trendLine = this._calculateTrendLine(scores);

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '治疗进度',
            data: scores,
            borderColor: '#4A90D9',
            backgroundColor: 'rgba(74,144,217,0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: '趋势线',
            data: trendLine,
            borderColor: '#E74C3C',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: '治疗进度追踪' },
          annotation: {
            annotations: this._generateMilestoneAnnotations(labels)
          }
        },
        scales: {
          y: { min: 0, max: 100, title: { display: true, text: '改善程度 (%)' } }
        }
      }
    };
  }

  /**
   * 生成多指标进度图表
   * @param {string[]} metricNames - 指标名称数组
   * @returns {Object} 图表配置
   */
  generateMultiMetricChart(metricNames) {
    const sorted = [...this.progressData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sorted.map(d => d.date);

    const colors = ['#4A90D9', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C'];
    const datasets = metricNames.map((name, i) => ({
      label: name,
      data: sorted.map(d => d.metrics?.[name] || 0),
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length] + '33',
      fill: false,
      tension: 0.3
    }));

    return {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: '多维度进度追踪' } }
      }
    };
  }

  /**
   * 计算趋势线（最小二乘法）
   */
  _calculateTrendLine(values) {
    const n = values.length;
    if (n < 2) return values;

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return Array.from({ length: n }, (_, i) => Math.round((slope * i + intercept) * 100) / 100);
  }

  /**
   * 生成里程碑注解
   */
  _generateMilestoneAnnotations(labels) {
    const annotations = {};
    for (const ms of this.milestones) {
      const idx = labels.indexOf(ms.date);
      if (idx >= 0) {
        annotations[`ms-${idx}`] = {
          type: 'line',
          xMin: idx,
          xMax: idx,
          borderColor: ms.type === 'achievement' ? '#2ECC71' : '#F39C12',
          borderWidth: 2,
          label: { display: true, content: ms.label, position: 'start' }
        };
      }
    }
    return annotations;
  }

  /**
   * 获取进度摘要
   */
  getSummary() {
    if (this.progressData.length === 0) return null;
    const sorted = [...this.progressData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const first = sorted[0].score;
    const last = sorted[sorted.length - 1].score;
    const avg = sorted.reduce((s, d) => s + d.score, 0) / sorted.length;
    return {
      startDate: sorted[0].date,
      endDate: sorted[sorted.length - 1].date,
      initialScore: first,
      currentScore: last,
      improvement: last - first,
      averageScore: Math.round(avg * 100) / 100,
      dataPoints: sorted.length,
      milestones: this.milestones.length
    };
  }
}

module.exports = { ProgressChart };

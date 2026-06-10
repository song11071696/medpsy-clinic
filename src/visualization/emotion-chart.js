/**
 * 情绪图表模块
 * 生成情绪变化的可视化数据
 */

const DEFAULT_COLORS = {
  happy: '#FFD700',
  sad: '#4169E1',
  angry: '#DC143C',
  anxious: '#FF8C00',
  fearful: '#8B008B',
  surprised: '#FF69B4',
  neutral: '#808080',
  disgusted: '#006400'
};

class EmotionChart {
  constructor(options = {}) {
    this.colors = { ...DEFAULT_COLORS, ...options.colors };
    this.chartType = options.chartType || 'line'; // line, radar, heatmap
  }

  /**
   * 生成情绪趋势折线图数据
   * @param {Object[]} emotionData - 情绪分析结果数组
   * @returns {Object} 图表配置数据
   */
  generateLineChart(emotionData) {
    if (!Array.isArray(emotionData) || emotionData.length === 0) {
      throw new Error('情绪数据不能为空');
    }

    const labels = emotionData.map((_, i) => `T${i + 1}`);
    const emotions = new Set(emotionData.flatMap(d => Object.keys(d.scores || {})));

    const datasets = [];
    for (const emotion of emotions) {
      datasets.push({
        label: this._translateEmotion(emotion),
        data: emotionData.map(d => (d.scores?.[emotion] || 0) * 100),
        borderColor: this.colors[emotion] || '#999',
        backgroundColor: (this.colors[emotion] || '#999') + '33',
        fill: false,
        tension: 0.4
      });
    }

    return {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: '情绪变化趋势' },
          legend: { position: 'top' }
        },
        scales: {
          y: { min: 0, max: 100, title: { display: true, text: '强度 (%)' } }
        }
      }
    };
  }

  /**
   * 生成雷达图数据（单一时间点的情绪分布）
   * @param {Object} emotionResult - 单次情绪分析结果
   * @returns {Object} 图表配置数据
   */
  generateRadarChart(emotionResult) {
    if (!emotionResult || !emotionResult.scores) {
      throw new Error('无效的情绪分析结果');
    }

    const labels = Object.keys(emotionResult.scores).map(e => this._translateEmotion(e));
    const data = Object.values(emotionResult.scores).map(v => v * 100);
    const backgroundColors = Object.keys(emotionResult.scores).map(e => this.colors[e] + '66');
    const borderColors = Object.keys(emotionResult.scores).map(e => this.colors[e]);

    return {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: '当前情绪',
          data,
          backgroundColor: backgroundColors[0] || 'rgba(54,162,235,0.2)',
          borderColor: borderColors[0] || '#36A2EB',
          pointBackgroundColor: borderColors,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: '情绪分布雷达图' } },
        scales: { r: { min: 0, max: 100 } }
      }
    };
  }

  /**
   * 生成情绪日历热力图数据
   * @param {Object[]} emotionData - 带日期的情绪数据
   * @returns {Object} 热力图数据
   */
  generateCalendarHeatmap(emotionData) {
    const heatmapData = emotionData.map(d => ({
      date: d.date || d.timestamp?.split('T')[0],
      value: d.riskScore || d.intensityScore || 0,
      emotion: d.primaryEmotion || 'neutral'
    }));

    return {
      type: 'calendar',
      data: heatmapData,
      colorRange: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
      maxValue: 100
    };
  }

  /**
   * 情绪翻译
   */
  _translateEmotion(emotion) {
    const translations = {
      happy: '快乐', sad: '悲伤', angry: '愤怒', anxious: '焦虑',
      fearful: '恐惧', surprised: '惊讶', neutral: '平静', disgusted: '厌恶'
    };
    return translations[emotion] || emotion;
  }

  /**
   * 导出图表为JSON
   */
  exportChart(chartData) {
    return JSON.stringify(chartData, null, 2);
  }
}

module.exports = { EmotionChart, DEFAULT_COLORS };

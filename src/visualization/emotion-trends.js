/**
 * Emotion Trend Visualization Module
 * Generates data structures for emotion trend charts over time
 * Supports line charts, area charts, and heatmap visualizations
 */

class EmotionTrendChart {
  constructor(options = {}) {
    this.timeRange = options.timeRange || 30; // days
    this.granularity = options.granularity || 'day'; // day, week, month
    this.emotionColors = {
      joy: '#FFD700',
      sadness: '#4169E1',
      anxiety: '#FF6347',
      anger: '#DC143C',
      confusion: '#9370DB',
      hope: '#32CD32',
      gratitude: '#FF69B4',
      apathy: '#808080',
    };
  }

  /**
   * Generate line chart data for emotion trends
   * @param {Array} emotionHistory - Array of emotion analysis entries
   * @param {Array} emotions - Emotion types to include (default: all)
   * @returns {Object} Chart.js compatible data structure
   */
  generateLineChart(emotionHistory, emotions = null) {
    const grouped = this._groupByTimePeriod(emotionHistory);
    const timeLabels = Object.keys(grouped).sort();
    const emotionTypes = emotions || this._getAllEmotionTypes(emotionHistory);

    const datasets = emotionTypes.map(emotion => ({
      label: this._getEmotionLabel(emotion),
      data: timeLabels.map(label => {
        const entries = grouped[label] || [];
        const scores = entries
          .map(e => e.analysis?.emotions?.[emotion]?.score || 0);
        return scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
          : null;
      }),
      borderColor: this.emotionColors[emotion] || '#666666',
      backgroundColor: (this.emotionColors[emotion] || '#666666') + '20',
      fill: false,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
    }));

    return {
      type: 'line',
      data: {
        labels: timeLabels.map(l => this._formatLabel(l)),
        datasets,
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '情绪趋势变化图',
            font: { size: 16 },
          },
          legend: {
            position: 'bottom',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          y: {
            min: 0,
            max: 1,
            title: { display: true, text: '情绪强度' },
            ticks: { callback: (val) => `${Math.round(val * 100)}%` },
          },
          x: {
            title: { display: true, text: '时间' },
          },
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false,
        },
      },
    };
  }

  /**
   * Generate area chart data for sentiment overview
   * @param {Array} emotionHistory - Emotion history entries
   * @returns {Object} Chart.js compatible stacked area chart
   */
  generateAreaChart(emotionHistory) {
    const grouped = this._groupByTimePeriod(emotionHistory);
    const timeLabels = Object.keys(grouped).sort();

    const positiveData = timeLabels.map(label => {
      const entries = grouped[label] || [];
      const scores = entries.map(e => e.analysis?.sentiment?.positive || 0);
      return scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0;
    });

    const negativeData = timeLabels.map(label => {
      const entries = grouped[label] || [];
      const scores = entries.map(e => e.analysis?.sentiment?.negative || 0);
      return scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0;
    });

    const neutralData = timeLabels.map(label => {
      const entries = grouped[label] || [];
      const scores = entries.map(e => e.analysis?.sentiment?.neutral || 0);
      return scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0;
    });

    return {
      type: 'line',
      data: {
        labels: timeLabels.map(l => this._formatLabel(l)),
        datasets: [
          {
            label: '积极情绪',
            data: positiveData,
            borderColor: '#32CD32',
            backgroundColor: '#32CD3240',
            fill: true,
            tension: 0.4,
          },
          {
            label: '中性情绪',
            data: neutralData,
            borderColor: '#FFD700',
            backgroundColor: '#FFD70040',
            fill: true,
            tension: 0.4,
          },
          {
            label: '消极情绪',
            data: negativeData,
            borderColor: '#FF6347',
            backgroundColor: '#FF634740',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '情绪倾向面积图',
            font: { size: 16 },
          },
          legend: { position: 'bottom' },
        },
        scales: {
          y: {
            stacked: false,
            min: 0,
            max: 1,
            title: { display: true, text: '比例' },
          },
        },
      },
    };
  }

  /**
   * Generate heatmap data for emotion intensity by day/hour
   * @param {Array} emotionHistory - Emotion history entries
   * @returns {Object} Heatmap data structure
   */
  generateHeatmap(emotionHistory) {
    const daysOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

    // Initialize heatmap grid
    const grid = Array(7).fill(null).map(() => Array(24).fill(0));
    const counts = Array(7).fill(null).map(() => Array(24).fill(0));

    for (const entry of emotionHistory) {
      const date = new Date(entry.timestamp);
      const day = date.getDay();
      const hour = date.getHours();
      const intensity = entry.analysis?.emotionalIntensity || 0;

      grid[day][hour] += intensity;
      counts[day][hour]++;
    }

    // Calculate averages
    const data = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const avg = counts[day][hour] > 0 ? grid[day][hour] / counts[day][hour] : 0;
        data.push({ x: hour, y: day, v: Math.round(avg * 100) / 100 });
      }
    }

    return {
      type: 'heatmap',
      data: {
        labels: { x: hours, y: daysOfWeek },
        datasets: [{
          label: '情绪强度热力图',
          data,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '情绪强度时间分布热力图',
            font: { size: 16 },
          },
        },
      },
    };
  }

  /**
   * Generate radar chart for emotion profile
   * @param {Object} emotionSummary - Aggregated emotion data
   * @returns {Object} Radar chart data
   */
  generateRadarChart(emotionSummary) {
    const emotions = Object.keys(emotionSummary);
    const labels = emotions.map(e => this._getEmotionLabel(e));
    const values = emotions.map(e => emotionSummary[e]?.averageScore || 0);

    return {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: '情绪画像',
          data: values,
          borderColor: '#4A90D9',
          backgroundColor: '#4A90D940',
          pointBackgroundColor: emotions.map(e => this.emotionColors[e] || '#666'),
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#4A90D9',
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '情绪画像雷达图',
            font: { size: 16 },
          },
        },
        scales: {
          r: {
            min: 0,
            max: 1,
            ticks: { stepSize: 0.2 },
          },
        },
      },
    };
  }

  /**
   * Group entries by time period
   * @param {Array} entries - History entries
   * @returns {Object} Grouped entries
   */
  _groupByTimePeriod(entries) {
    const grouped = {};
    for (const entry of entries) {
      let key;
      const date = new Date(entry.timestamp);
      switch (this.granularity) {
        case 'hour':
          key = `${date.toISOString().substring(0, 13)}:00`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().substring(0, 10);
          break;
        case 'month':
          key = date.toISOString().substring(0, 7);
          break;
        default:
          key = date.toISOString().substring(0, 10);
      }
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    }
    return grouped;
  }

  _getAllEmotionTypes(history) {
    const types = new Set();
    for (const entry of history) {
      if (entry.analysis?.detectedEmotions) {
        for (const e of entry.analysis.detectedEmotions) {
          types.add(e.name);
        }
      }
    }
    return [...types];
  }

  _getEmotionLabel(emotion) {
    const labels = {
      joy: '快乐', sadness: '悲伤', anxiety: '焦虑', anger: '愤怒',
      confusion: '困惑', hope: '希望', gratitude: '感恩', apathy: '冷漠',
    };
    return labels[emotion] || emotion;
  }

  _formatLabel(label) {
    // Format date labels for display
    if (label.length === 10) return label.substring(5); // MM-DD
    if (label.length === 7) return label; // YYYY-MM
    return label;
  }
}

module.exports = { EmotionTrendChart };

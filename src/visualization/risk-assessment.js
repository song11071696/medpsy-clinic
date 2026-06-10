/**
 * Risk Assessment Visualization Module
 * Generates charts for psychological risk factor analysis and monitoring
 */

class RiskAssessmentChart {
  constructor(options = {}) {
    this.riskColors = {
      critical: '#FF0000',
      high: '#FF6347',
      moderate: '#FFD700',
      low: '#32CD32',
      minimal: '#87CEEB',
    };
  }

  /**
   * Generate risk factor radar chart
   * @param {Object} riskFactors - Risk factor scores
   * @returns {Object} Radar chart data
   */
  generateRiskRadar(riskFactors) {
    const factors = [
      { key: 'depression', label: '抑郁风险' },
      { key: 'anxiety', label: '焦虑风险' },
      { key: 'ptsd', label: 'PTSD风险' },
      { key: 'suicidal', label: '自杀风险' },
      { key: 'substance', label: '物质滥用风险' },
      { key: 'social', label: '社会功能风险' },
      { key: 'sleep', label: '睡眠风险' },
      { key: 'stress', label: '压力水平' },
    ];

    const labels = factors.map(f => f.label);
    const values = factors.map(f => riskFactors[f.key] || 0);

    // Determine colors based on risk levels
    const bgColors = values.map(v => {
      if (v >= 0.8) return this.riskColors.critical + '40';
      if (v >= 0.6) return this.riskColors.high + '40';
      if (v >= 0.4) return this.riskColors.moderate + '40';
      if (v >= 0.2) return this.riskColors.low + '40';
      return this.riskColors.minimal + '40';
    });

    return {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: '风险评估',
          data: values,
          borderColor: '#FF6347',
          backgroundColor: '#FF634730',
          pointBackgroundColor: bgColors.map(c => c.replace('40', 'FF')),
          pointBorderColor: '#fff',
          pointRadius: 5,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '心理健康风险评估雷达图',
            font: { size: 16 },
          },
        },
        scales: {
          r: {
            min: 0,
            max: 1,
            ticks: {
              stepSize: 0.2,
              callback: (val) => `${Math.round(val * 100)}%`,
            },
            pointLabels: { font: { size: 12 } },
          },
        },
      },
    };
  }

  /**
   * Generate risk trend over time
   * @param {Array} riskHistory - Historical risk assessments
   * @returns {Object} Line chart data
   */
  generateRiskTrend(riskHistory) {
    const sorted = [...riskHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const labels = sorted.map(r => new Date(r.timestamp).toLocaleDateString('zh-CN'));
    const overallRisk = sorted.map(r => r.overallRisk || 0);
    const riskLevel = sorted.map(r => this._getRiskLevel(r.overallRisk || 0));

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '整体风险指数',
            data: overallRisk,
            borderColor: '#FF6347',
            backgroundColor: '#FF634720',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: overallRisk.map(v => this._getRiskColor(v)),
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '心理健康风险趋势图',
            font: { size: 16 },
          },
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                const idx = context.dataIndex;
                return `风险等级: ${riskLevel[idx]}`;
              },
            },
          },
        },
        scales: {
          y: {
            min: 0,
            max: 1,
            title: { display: true, text: '风险指数' },
            ticks: { callback: (val) => `${Math.round(val * 100)}%` },
          },
        },
      },
    };
  }

  /**
   * Generate risk distribution pie chart
   * @param {Array} riskAssessments - Risk assessment data
   * @returns {Object} Pie chart data
   */
  generateRiskDistribution(riskAssessments) {
    const distribution = { critical: 0, high: 0, moderate: 0, low: 0, minimal: 0 };

    for (const assessment of riskAssessments) {
      const level = this._getRiskLevelKey(assessment.overallRisk || 0);
      distribution[level]++;
    }

    return {
      type: 'pie',
      data: {
        labels: ['紧急', '高危', '中等', '低风险', '最低'],
        datasets: [{
          data: Object.values(distribution),
          backgroundColor: [
            this.riskColors.critical,
            this.riskColors.high,
            this.riskColors.moderate,
            this.riskColors.low,
            this.riskColors.minimal,
          ],
          borderWidth: 2,
          borderColor: '#ffffff',
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '风险等级分布',
            font: { size: 16 },
          },
          legend: { position: 'bottom' },
        },
      },
    };
  }

  /**
   * Generate risk factors comparison bar chart
   * @param {Object} currentRisk - Current risk factors
   * @param {Object} previousRisk - Previous risk factors for comparison
   * @returns {Object} Grouped bar chart
   */
  generateRiskComparison(currentRisk, previousRisk) {
    const factors = ['depression', 'anxiety', 'ptsd', 'suicidal', 'social', 'sleep', 'stress'];
    const labels = ['抑郁', '焦虑', 'PTSD', '自杀', '社会功能', '睡眠', '压力'];

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '当前评估',
            data: factors.map(f => currentRisk[f] || 0),
            backgroundColor: '#FF634780',
            borderColor: '#FF6347',
            borderWidth: 1,
          },
          {
            label: '上次评估',
            data: factors.map(f => previousRisk[f] || 0),
            backgroundColor: '#4A90D980',
            borderColor: '#4A90D9',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '风险因素对比（当前 vs 上次）',
            font: { size: 16 },
          },
        },
        scales: {
          y: {
            min: 0,
            max: 1,
            title: { display: true, text: '风险水平' },
            ticks: { callback: (val) => `${Math.round(val * 100)}%` },
          },
        },
      },
    };
  }

  /**
   * Generate alert history timeline
   * @param {Array} alerts - Crisis alert history
   * @returns {Object} Timeline chart data
   */
  generateAlertTimeline(alerts) {
    const sorted = [...alerts].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return {
      type: 'scatter',
      data: {
        datasets: [{
          label: '危机警报',
          data: sorted.map(a => ({
            x: new Date(a.createdAt).getTime(),
            y: a.severity === 'critical' ? 4 : a.severity === 'high' ? 3 : a.severity === 'moderate' ? 2 : 1,
          })),
          backgroundColor: sorted.map(a => this.riskColors[a.severity] || '#808080'),
          pointRadius: sorted.map(a => a.severity === 'critical' ? 10 : a.severity === 'high' ? 8 : 6),
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '危机警报时间线',
            font: { size: 16 },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const idx = context.dataIndex;
                const alert = sorted[idx];
                return `严重程度: ${alert.severity} | ${alert.summary || ''}`;
              },
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: '时间' },
            ticks: {
              callback: (val) => new Date(val).toLocaleDateString('zh-CN'),
            },
          },
          y: {
            min: 0,
            max: 5,
            title: { display: true, text: '严重程度' },
            ticks: {
              callback: (val) => ['', '低', '中', '高', '紧急'][val] || '',
              stepSize: 1,
            },
          },
        },
      },
    };
  }

  _getRiskColor(value) {
    if (value >= 0.8) return this.riskColors.critical;
    if (value >= 0.6) return this.riskColors.high;
    if (value >= 0.4) return this.riskColors.moderate;
    if (value >= 0.2) return this.riskColors.low;
    return this.riskColors.minimal;
  }

  _getRiskLevel(value) {
    if (value >= 0.8) return '紧急';
    if (value >= 0.6) return '高危';
    if (value >= 0.4) return '中等';
    if (value >= 0.2) return '低风险';
    return '最低';
  }

  _getRiskLevelKey(value) {
    if (value >= 0.8) return 'critical';
    if (value >= 0.6) return 'high';
    if (value >= 0.4) return 'moderate';
    if (value >= 0.2) return 'low';
    return 'minimal';
  }
}

module.exports = { RiskAssessmentChart };

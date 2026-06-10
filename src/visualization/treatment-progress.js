/**
 * Treatment Progress Visualization Module
 * Generates charts for tracking therapy progress, goal completion, and outcomes
 */

class TreatmentProgressChart {
  constructor(options = {}) {
    this.colors = {
      primary: '#4A90D9',
      success: '#32CD32',
      warning: '#FFD700',
      danger: '#FF6347',
      info: '#9370DB',
      neutral: '#808080',
    };
  }

  /**
   * Generate assessment score progress chart
   * @param {Array} assessmentHistory - Assessment history entries
   * @param {string} assessmentType - Type of assessment (PHQ-9, GAD-7, etc.)
   * @returns {Object} Chart.js compatible line chart
   */
  generateScoreProgress(assessmentHistory, assessmentType = 'PHQ-9') {
    const filtered = assessmentHistory
      .filter(a => a.assessmentId === assessmentType)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const labels = filtered.map(a => new Date(a.timestamp).toLocaleDateString('zh-CN'));
    const scores = filtered.map(a => a.totalScore);
    const maxScore = filtered.length > 0 ? filtered[0].maxScore : 27;

    // Severity bands
    const severityBands = this._getSeverityBands(assessmentType);

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `${assessmentType} 评分`,
            data: scores,
            borderColor: this.colors.primary,
            backgroundColor: this.colors.primary + '20',
            fill: false,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: scores.map(s => this._getScoreColor(s, assessmentType)),
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${assessmentType} 评估分数变化趋势`,
            font: { size: 16 },
          },
          annotation: {
            annotations: severityBands,
          },
        },
        scales: {
          y: {
            min: 0,
            max: maxScore,
            title: { display: true, text: '评分' },
          },
          x: {
            title: { display: true, text: '评估日期' },
          },
        },
      },
    };
  }

  /**
   * Generate goal completion chart
   * @param {Array} goals - Treatment goals
   * @returns {Object} Chart.js compatible bar/doughnut chart
   */
  generateGoalCompletion(goals) {
    const statusCounts = {
      active: 0,
      completed: 0,
      paused: 0,
      abandoned: 0,
    };

    for (const goal of goals) {
      const status = goal.status || 'active';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }

    return {
      type: 'doughnut',
      data: {
        labels: ['进行中', '已完成', '已暂停', '已放弃'],
        datasets: [{
          data: [statusCounts.active, statusCounts.completed, statusCounts.paused, statusCounts.abandoned],
          backgroundColor: [
            this.colors.info,
            this.colors.success,
            this.colors.warning,
            this.colors.neutral,
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
            text: '治疗目标完成情况',
            font: { size: 16 },
          },
          legend: { position: 'bottom' },
        },
        cutout: '50%',
      },
    };
  }

  /**
   * Generate session frequency chart
   * @param {Array} sessions - Therapy session records
   * @returns {Object} Bar chart for session frequency
   */
  generateSessionFrequency(sessions) {
    const monthlyCounts = {};

    for (const session of sessions) {
      const month = new Date(session.timestamp).toISOString().substring(0, 7);
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    }

    const sortedMonths = Object.keys(monthlyCounts).sort();
    const counts = sortedMonths.map(m => monthlyCounts[m]);

    // Calculate average
    const avg = counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;

    return {
      type: 'bar',
      data: {
        labels: sortedMonths,
        datasets: [
          {
            label: '治疗次数',
            data: counts,
            backgroundColor: this.colors.primary + '80',
            borderColor: this.colors.primary,
            borderWidth: 1,
          },
          {
            label: '平均值',
            data: sortedMonths.map(() => Math.round(avg * 10) / 10),
            type: 'line',
            borderColor: this.colors.warning,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '月度治疗频率',
            font: { size: 16 },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: '次数' },
            ticks: { stepSize: 1 },
          },
        },
      },
    };
  }

  /**
   * Generate mood before/after session comparison
   * @param {Array} sessions - Session records with mood data
   * @returns {Object} Comparison chart
   */
  generateMoodComparison(sessions) {
    const sessionsWithMood = sessions.filter(s => s.moodBefore != null && s.moodAfter != null);
    const labels = sessionsWithMood.map((_, i) => `第${i + 1}次`);

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '治疗前情绪',
            data: sessionsWithMood.map(s => s.moodBefore),
            backgroundColor: this.colors.danger + '60',
            borderColor: this.colors.danger,
            borderWidth: 1,
          },
          {
            label: '治疗后情绪',
            data: sessionsWithMood.map(s => s.moodAfter),
            backgroundColor: this.colors.success + '60',
            borderColor: this.colors.success,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '治疗前后情绪对比',
            font: { size: 16 },
          },
        },
        scales: {
          y: {
            min: 0,
            max: 10,
            title: { display: true, text: '情绪评分（0-10）' },
          },
        },
      },
    };
  }

  /**
   * Generate comprehensive progress dashboard data
   * @param {Object} profile - User cognitive profile
   * @returns {Object} Dashboard chart collection
   */
  generateDashboard(profile) {
    const charts = {};

    if (profile.history && profile.history.length > 0) {
      const assessmentTypes = [...new Set(profile.history.map(h => h.assessmentId))];
      for (const type of assessmentTypes) {
        charts[`score_${type}`] = this.generateScoreProgress(profile.history, type);
      }
    }

    return {
      charts,
      summary: {
        totalSessions: profile.history?.length || 0,
        assessmentTypes: [...new Set((profile.history || []).map(h => h.assessmentId))],
      },
    };
  }

  /**
   * Get severity bands for annotation
   * @param {string} assessmentType - Assessment type
   * @returns {Array} Severity band annotations
   */
  _getSeverityBands(assessmentType) {
    const bands = {
      'PHQ-9': [
        { yMin: 0, yMax: 4, backgroundColor: '#32CD3220', label: '无抑郁' },
        { yMin: 5, yMax: 9, backgroundColor: '#FFD70020', label: '轻度' },
        { yMin: 10, yMax: 14, backgroundColor: '#FFA50020', label: '中度' },
        { yMin: 15, yMax: 27, backgroundColor: '#FF634720', label: '重度' },
      ],
      'GAD-7': [
        { yMin: 0, yMax: 4, backgroundColor: '#32CD3220', label: '无焦虑' },
        { yMin: 5, yMax: 9, backgroundColor: '#FFD70020', label: '轻度' },
        { yMin: 10, yMax: 14, backgroundColor: '#FFA50020', label: '中度' },
        { yMin: 15, yMax: 21, backgroundColor: '#FF634720', label: '重度' },
      ],
    };
    return bands[assessmentType] || [];
  }

  /**
   * Get color based on score severity
   * @param {number} score - Assessment score
   * @param {string} type - Assessment type
   * @returns {string} Color hex code
   */
  _getScoreColor(score, type) {
    if (type === 'PHQ-9') {
      if (score <= 4) return this.colors.success;
      if (score <= 9) return this.colors.warning;
      if (score <= 14) return '#FFA500';
      return this.colors.danger;
    }
    if (type === 'GAD-7') {
      if (score <= 4) return this.colors.success;
      if (score <= 9) return this.colors.warning;
      if (score <= 14) return '#FFA500';
      return this.colors.danger;
    }
    return this.colors.primary;
  }
}

module.exports = { TreatmentProgressChart };

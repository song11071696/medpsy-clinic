/**
 * Assessment Module Entry Point
 *
 * Exports PHQ-9 depression scale, GAD-7 anxiety scale,
 * and the unified Scorer for clinical use.
 */

const { PHQ9, PHQ9_QUESTIONS } = require('./phq9');
const { GAD7, GAD7_QUESTIONS } = require('./gad7');
const { Scorer, INSTRUMENTS, CLINICAL_GUIDELINES } = require('./scorer');

/**
 * Create a pre-configured scorer instance
 */
function createScorer(options = {}) {
  return new Scorer(options);
}

module.exports = {
  // Classes
  PHQ9,
  GAD7,
  Scorer,

  // Constants
  PHQ9_QUESTIONS,
  GAD7_QUESTIONS,
  INSTRUMENTS,
  CLINICAL_GUIDELINES,

  // Factory
  createScorer,
};

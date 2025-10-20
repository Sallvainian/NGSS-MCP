/**
 * NGSS MCP Server - Shared Enum Values
 *
 * This file contains the authoritative enum values for SEP (Science and Engineering Practices)
 * and CCC (Crosscutting Concepts) used throughout the codebase.
 *
 * These values are extracted from the NGSS Middle School standards data and have been
 * corrected for OCR errors as documented in ADR-002.
 *
 * @see docs/adr/002-ocr-data-quality-handling.md
 */

/**
 * Science and Engineering Practice (SEP) values
 * Total: 10 unique values
 */
export const SEP_VALUES = [
  'Analyze and interpret data to determine similarities and differences in findings.',
  'Analyze and interpret data to provide evidence for phenomena.',
  'Analyze displays of data to identify linear and nonlinear relationships.',
  'Ask questions that can be investigated within the scope of the classroom, outdoor environment, and museums and other public facilities with available resources and, when appropriate, frame a hypothesis based on observations and scientific principles.',
  'Ask questions to identify and clarify evidence of an argument.',
  'Construct an explanation that includes qualitative or quantitative relationships between variables that predict phenomena.',
  'Develop a model to describe unobservable mechanisms.',
  'Develop a model to predict and/or describe phenomena.',
  'Develop and use a model to describe phenomena.',
  'Unknown'  // Note: 5 standards have "Unknown" SEP
] as const;

/**
 * Crosscutting Concept (CCC) values
 * Total: 8 unique values
 */
export const CCC_VALUES = [
  'Cause and effect relationships may be used to predict phenomena in natural or designed systems.',
  'Cause and effect relationships may be used to predict phenomena in natural systems.',
  'Graphs and charts can be used to identify patterns in data.',
  'Graphs, charts, and images can be used to identify patterns in data.',
  'Macroscopic patterns are related to the nature of microscopic and atomic-level structure.',
  'Patterns can be used to identify cause and effect relationships.',
  'Patterns in rates of change and other numerical relationships can provide information about natural systems.',
  'Proportional relationships (e.g., speed as the ratio of distance traveled to time taken) among different types of quantities provide information about the magnitude of properties and processes.'
] as const;

/**
 * Disciplinary Core Idea (DCI) values
 * Total: 35 unique values across all NGSS middle school domains
 *
 * Physical Science (10 DCIs): PS1.A, PS1.B, PS2.A, PS2.B, PS3.A, PS3.B, PS3.C, PS4.A, PS4.B, PS4.C
 * Life Science (14 DCIs): LS1.A, LS1.B, LS1.C, LS1.D, LS2.A, LS2.B, LS2.C, LS3.A, LS3.B, LS4.A, LS4.B, LS4.C, LS4.D
 * Earth & Space Science (11 DCIs): ESS1.A, ESS1.B, ESS1.C, ESS2.A, ESS2.B, ESS2.C, ESS2.D, ESS2.E, ESS3.A, ESS3.B, ESS3.C, ESS3.D
 *
 * Note: Some DCIs may not have dedicated standards in the current dataset (32 of 35 are mapped).
 */
export const DCI_VALUES = [
  'Adaptation',
  'Biodiversity and Humans',
  'Biogeology',
  'Chemical Reactions',
  'Conservation of Energy and Energy Transfer',
  'Cycles of Matter and Energy Transfer in Ecosystems',
  'Definitions of Energy',
  'Earth and the Solar System',
  'Earth Materials and Systems',
  'Ecosystem Dynamics, Functioning, and Resilience',
  'Electromagnetic Radiation',
  'Evidence of Common Ancestry and Diversity',
  'Forces and Motion',
  'Global Climate Change',
  'Growth and Development of Organisms',
  'Human Impacts on Earth Systems',
  'Information Processing',
  'Information Technologies and Instrumentation',
  'Inheritance of Traits',
  'Interdependent Relationships in Ecosystems',
  'Natural Hazards',
  'Natural Resources',
  'Natural Selection',
  'Organization for Matter and Energy Flow in Organisms',
  'Plate Tectonics and Large-Scale System Interactions',
  'Relationship Between Energy and Forces',
  'Structure and Function',
  'Structure and Properties of Matter',
  'The History of Planet Earth',
  'The Roles of Water in Earth\'s Surface Processes',
  'The Universe and Its Stars',
  'Types of Interactions',
  'Variation of Traits',
  'Wave Properties',
  'Weather and Climate'
] as const;

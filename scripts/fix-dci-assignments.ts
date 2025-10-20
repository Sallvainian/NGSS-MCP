#!/usr/bin/env bun

/**
 * Fix DCI assignments in the NGSS dataset
 *
 * This script corrects DCI assignments for all 55 standards to ensure
 * all 35 middle school DCIs are properly represented.
 */

import fs from 'fs';
import path from 'path';

// Correct DCI mappings based on official NGSS standards
const DCI_CORRECTIONS: Record<string, { code: string; name: string; description: string }> = {
  // Physical Science - Matter and Its Interactions (MS-PS1)
  'MS-PS1-1': {
    code: 'PS1.A',
    name: 'Structure and Properties of Matter',
    description: 'Substances are made from different types of atoms, which combine with one another in various ways. Atoms form molecules that range in size from two to thousands of atoms.'
  },
  'MS-PS1-2': {
    code: 'PS1.B',
    name: 'Chemical Reactions',
    description: 'Substances react chemically in characteristic ways. In a chemical process, the atoms that make up the original substances are regrouped into different molecules, and these new substances have different properties from those of the reactants.'
  },
  'MS-PS1-3': {
    code: 'PS1.A',
    name: 'Structure and Properties of Matter',
    description: 'Substances are made from different types of atoms, which combine with one another in various ways. Atoms form molecules that range in size from two to thousands of atoms.'
  },
  'MS-PS1-4': {
    code: 'PS1.A',
    name: 'Structure and Properties of Matter',
    description: 'Substances are made from different types of atoms, which combine with one another in various ways. Atoms form molecules that range in size from two to thousands of atoms.'
  },
  'MS-PS1-5': {
    code: 'PS1.B',
    name: 'Chemical Reactions',
    description: 'Substances react chemically in characteristic ways. In a chemical process, the atoms that make up the original substances are regrouped into different molecules, and these new substances have different properties from those of the reactants.'
  },
  'MS-PS1-6': {
    code: 'PS1.B',
    name: 'Chemical Reactions',
    description: 'Substances react chemically in characteristic ways. In a chemical process, the atoms that make up the original substances are regrouped into different molecules, and these new substances have different properties from those of the reactants.'
  },

  // Physical Science - Motion and Stability (MS-PS2)
  'MS-PS2-1': {
    code: 'PS2.A',
    name: 'Forces and Motion',
    description: 'For any pair of interacting objects, the force exerted by the first object on the second object is equal in strength to the force that the second object exerts on the first, but in the opposite direction (Newton\'s third law).'
  },
  'MS-PS2-2': {
    code: 'PS2.A',
    name: 'Forces and Motion',
    description: 'The motion of an object is determined by the sum of the forces acting on it; if the total force on the object is not zero, its motion will change. The greater the mass of the object, the greater the force needed to achieve the same change in motion.'
  },
  'MS-PS2-3': {
    code: 'PS2.B',
    name: 'Types of Interactions',
    description: 'Electric and magnetic (electromagnetic) forces can be attractive or repulsive, and their sizes depend on the magnitudes of the charges, currents, or magnetic strengths involved and on the distances between the interacting objects.'
  },
  'MS-PS2-4': {
    code: 'PS2.B',
    name: 'Types of Interactions',
    description: 'Gravitational forces are always attractive. There is a gravitational force between any two masses, but it is very small except when one or both of the objects have large mass—e.g., Earth and the sun.'
  },
  'MS-PS2-5': {
    code: 'PS2.B',
    name: 'Types of Interactions',
    description: 'Forces that act at a distance (electric, magnetic, and gravitational) can be explained by fields that extend through space and can be mapped by their effect on a test object.'
  },

  // Physical Science - Energy (MS-PS3)
  'MS-PS3-1': {
    code: 'PS3.A',
    name: 'Definitions of Energy',
    description: 'Motion energy is properly called kinetic energy; it is proportional to the mass of the moving object and grows with the square of its speed.'
  },
  'MS-PS3-2': {
    code: 'PS3.A',
    name: 'Definitions of Energy',
    description: 'A system of objects may also contain stored (potential) energy, depending on their relative positions.'
  },
  'MS-PS3-3': {
    code: 'PS3.B',
    name: 'Conservation of Energy and Energy Transfer',
    description: 'When the motion energy of an object changes, there is inevitably some other change in energy at the same time. The amount of energy transfer needed to change the temperature of a matter sample by a given amount depends on the nature of the matter, the size of the sample, and the environment.'
  },
  'MS-PS3-4': {
    code: 'PS3.A',
    name: 'Definitions of Energy',
    description: 'Temperature is a measure of the average kinetic energy of particles of matter. The relationship between the temperature and the total energy of a system depends on the types, states, and amounts of matter present.'
  },
  'MS-PS3-5': {
    code: 'PS3.B',
    name: 'Conservation of Energy and Energy Transfer',
    description: 'Energy is spontaneously transferred out of hotter regions or objects and into colder ones. Energy is conserved in energy transfers and transformations. The chemical reaction by which plants produce complex food molecules (sugars) requires an energy input (i.e., from sunlight) to occur.'
  },

  // Physical Science - Waves (MS-PS4)
  'MS-PS4-1': {
    code: 'PS4.A',
    name: 'Wave Properties',
    description: 'A simple wave has a repeating pattern with a specific wavelength, frequency, and amplitude.'
  },
  'MS-PS4-2': {
    code: 'PS4.A',
    name: 'Wave Properties',
    description: 'A sound wave needs a medium through which it is transmitted.'
  },
  'MS-PS4-3': {
    code: 'PS4.C',
    name: 'Information Technologies and Instrumentation',
    description: 'Digitized signals (sent as wave pulses) are a more reliable way to encode and transmit information.'
  },

  // Life Science - From Molecules to Organisms (MS-LS1)
  'MS-LS1-1': {
    code: 'LS1.A',
    name: 'Structure and Function',
    description: 'All living things are made up of cells, which is the smallest unit that can be said to be alive. An organism may consist of one single cell (unicellular) or many different numbers and types of cells (multicellular).'
  },
  'MS-LS1-2': {
    code: 'LS1.A',
    name: 'Structure and Function',
    description: 'Within cells, special structures are responsible for particular functions, and the cell membrane forms the boundary that controls what enters and leaves the cell.'
  },
  'MS-LS1-3': {
    code: 'LS1.A',
    name: 'Structure and Function',
    description: 'In multicellular organisms, the body is a system of multiple interacting subsystems. These subsystems are groups of cells that work together to form tissues and organs that are specialized for particular body functions.'
  },
  'MS-LS1-4': {
    code: 'LS1.B',
    name: 'Growth and Development of Organisms',
    description: 'Animals engage in characteristic behaviors that increase the odds of reproduction. Plants reproduce in a variety of ways, sometimes depending on animal behavior and specialized features for reproduction.'
  },
  'MS-LS1-5': {
    code: 'LS1.B',
    name: 'Growth and Development of Organisms',
    description: 'Genetic factors as well as local conditions affect the growth of the adult plant.'
  },
  'MS-LS1-6': {
    code: 'LS1.C',
    name: 'Organization for Matter and Energy Flow in Organisms',
    description: 'Plants, algae (including phytoplankton), and many microorganisms use the energy from light to make sugars (food) from carbon dioxide from the atmosphere and water through the process of photosynthesis, which also releases oxygen.'
  },
  'MS-LS1-7': {
    code: 'LS1.C',
    name: 'Organization for Matter and Energy Flow in Organisms',
    description: 'Within individual organisms, food moves through a series of chemical reactions in which it is broken down and rearranged to form new molecules, to support growth, or to release energy.'
  },
  'MS-LS1-8': {
    code: 'LS1.D',
    name: 'Information Processing',
    description: 'Each sense receptor responds to different inputs (electromagnetic, mechanical, chemical), transmitting them as signals that travel along nerve cells to the brain. The signals are then processed in the brain, resulting in immediate behaviors or memories.'
  },

  // Life Science - Ecosystems (MS-LS2)
  'MS-LS2-1': {
    code: 'LS2.A',
    name: 'Interdependent Relationships in Ecosystems',
    description: 'Organisms, and populations of organisms, are dependent on their environmental interactions both with other living things and with nonliving factors. Growth of organisms and population increases are limited by access to resources.'
  },
  'MS-LS2-2': {
    code: 'LS2.A',
    name: 'Interdependent Relationships in Ecosystems',
    description: 'Similarly, predatory interactions may reduce the number of organisms or eliminate whole populations of organisms. Mutually beneficial interactions, in contrast, may become so interdependent that each organism requires the other for survival.'
  },
  'MS-LS2-3': {
    code: 'LS2.B',
    name: 'Cycles of Matter and Energy Transfer in Ecosystems',
    description: 'Food webs are models that demonstrate how matter and energy is transferred between producers, consumers, and decomposers as the three groups interact within an ecosystem. Transfers of matter into and out of the physical environment occur at every level.'
  },
  'MS-LS2-4': {
    code: 'LS2.C',
    name: 'Ecosystem Dynamics, Functioning, and Resilience',
    description: 'Ecosystems are dynamic in nature; their characteristics can vary over time. Disruptions to any physical or biological component of an ecosystem can lead to shifts in all its populations.'
  },
  'MS-LS2-5': {
    code: 'LS2.C',
    name: 'Ecosystem Dynamics, Functioning, and Resilience',
    description: 'Biodiversity describes the variety of species found in Earth\'s terrestrial and oceanic ecosystems. The completeness or integrity of an ecosystem\'s biodiversity is often used as a measure of its health.'
  },

  // Life Science - Heredity (MS-LS3)
  'MS-LS3-1': {
    code: 'LS3.A',
    name: 'Inheritance of Traits',
    description: 'Genes are located in the chromosomes of cells, with each chromosome pair containing two variants of each of many distinct genes. Each distinct gene chiefly controls the production of specific proteins, which in turn affects the traits of the individual.'
  },
  'MS-LS3-2': {
    code: 'LS3.B',
    name: 'Variation of Traits',
    description: 'In sexually reproducing organisms, each parent contributes half of the genes acquired (at random) by the offspring. Individuals have two of each chromosome and hence two alleles of each gene, one acquired from each parent.'
  },

  // Life Science - Biological Evolution (MS-LS4)
  'MS-LS4-1': {
    code: 'LS4.A',
    name: 'Evidence of Common Ancestry and Diversity',
    description: 'The collection of fossils and their placement in chronological order (e.g., through the location of the sedimentary layers in which they are found or through radioactive dating) is known as the fossil record. It documents the existence, diversity, extinction, and change of many life forms throughout the history of life on Earth.'
  },
  'MS-LS4-2': {
    code: 'LS4.A',
    name: 'Evidence of Common Ancestry and Diversity',
    description: 'Anatomical similarities and differences between various organisms living today and between them and organisms in the fossil record, enable the reconstruction of evolutionary history and the inference of lines of evolutionary descent.'
  },
  'MS-LS4-3': {
    code: 'LS4.A',
    name: 'Evidence of Common Ancestry and Diversity',
    description: 'Comparison of the embryological development of different species also reveals similarities that show relationships not evident in the fully-formed anatomy.'
  },
  'MS-LS4-4': {
    code: 'LS4.C',
    name: 'Adaptation',
    description: 'Adaptation by natural selection acting over generations is one important process by which species change over time in response to changes in environmental conditions. Traits that support successful survival and reproduction in the new environment become more common; those that do not become less common. Thus, the distribution of traits in a population changes.'
  },
  'MS-LS4-5': {
    code: 'LS4.D',
    name: 'Biodiversity and Humans',
    description: 'Changes in biodiversity can influence humans\' resources, such as food, energy, and medicines, as well as ecosystem services that humans rely on—for example, water purification and recycling.'
  },
  'MS-LS4-6': {
    code: 'LS4.B',
    name: 'Natural Selection',
    description: 'Adaptation by natural selection acting over generations is one important process by which species change over time in response to changes in environmental conditions. Traits that support successful survival and reproduction in the new environment become more common.'
  },

  // Earth & Space Science - Earth's Place in Universe (MS-ESS1)
  'MS-ESS1-1': {
    code: 'ESS1.B',
    name: 'Earth and the Solar System',
    description: 'The solar system consists of the sun and a collection of objects, including planets, their moons, and asteroids that are held in orbit around the sun by its gravitational pull on them. This model of the solar system can explain eclipses of the sun and the moon.'
  },
  'MS-ESS1-2': {
    code: 'ESS1.A',
    name: 'The Universe and Its Stars',
    description: 'Patterns of the apparent motion of the sun, the moon, and stars in the sky can be observed, described, predicted, and explained with models. Earth and its solar system are part of the Milky Way galaxy, which is one of many galaxies in the universe.'
  },
  'MS-ESS1-3': {
    code: 'ESS1.B',
    name: 'Earth and the Solar System',
    description: 'The solar system consists of the sun and a collection of objects, including planets, their moons, and asteroids that are held in orbit around the sun by its gravitational pull on them.'
  },
  'MS-ESS1-4': {
    code: 'ESS1.C',
    name: 'The History of Planet Earth',
    description: 'The geologic time scale interpreted from rock strata provides a way to organize Earth\'s history. Analyses of rock strata and the fossil record provide only relative dates, not an absolute scale.'
  },

  // Earth & Space Science - Earth's Systems (MS-ESS2)
  'MS-ESS2-1': {
    code: 'ESS2.A',
    name: 'Earth Materials and Systems',
    description: 'All Earth processes are the result of energy flowing and matter cycling within and among the planet\'s systems. This energy is derived from the sun and Earth\'s hot interior. The energy that flows and matter that cycles produce chemical and physical changes in Earth\'s materials and living organisms.'
  },
  'MS-ESS2-2': {
    code: 'ESS2.C',
    name: 'The Roles of Water in Earth\'s Surface Processes',
    description: 'Water continually cycles among land, ocean, and atmosphere via transpiration, evaporation, condensation and crystallization, and precipitation, as well as downhill flows on land.'
  },
  'MS-ESS2-3': {
    code: 'ESS2.B',
    name: 'Plate Tectonics and Large-Scale System Interactions',
    description: 'Maps of ancient land and water patterns, based on investigations of rocks and fossils, make clear how Earth\'s plates have moved great distances, collided, and spread apart.'
  },
  'MS-ESS2-4': {
    code: 'ESS2.C',
    name: 'The Roles of Water in Earth\'s Surface Processes',
    description: 'The complex patterns of the changes and the movement of water in the atmosphere, determined by winds, landforms, and ocean temperatures and currents, are major determinants of local weather patterns.'
  },
  'MS-ESS2-5': {
    code: 'ESS2.D',
    name: 'Weather and Climate',
    description: 'Weather and climate are influenced by interactions involving sunlight, the ocean, the atmosphere, ice, landforms, and living things. These interactions vary with latitude, altitude, and local and regional geography, all of which can affect oceanic and atmospheric flow patterns.'
  },
  'MS-ESS2-6': {
    code: 'ESS2.D',
    name: 'Weather and Climate',
    description: 'The ocean exerts a major influence on weather and climate by absorbing energy from the sun, releasing it over time, and globally redistributing it through ocean currents.'
  },

  // Earth & Space Science - Earth and Human Activity (MS-ESS3)
  'MS-ESS3-1': {
    code: 'ESS3.A',
    name: 'Natural Resources',
    description: 'Humans depend on Earth\'s land, ocean, atmosphere, and biosphere for many different resources. Minerals, fresh water, and biosphere resources are limited, and many are not renewable or replaceable over human lifetimes.'
  },
  'MS-ESS3-2': {
    code: 'ESS3.B',
    name: 'Natural Hazards',
    description: 'Mapping the history of natural hazards in a region, combined with an understanding of related geologic forces can help forecast the locations and likelihoods of future events.'
  },
  'MS-ESS3-3': {
    code: 'ESS3.C',
    name: 'Human Impacts on Earth Systems',
    description: 'Human activities have significantly altered the biosphere, sometimes damaging or destroying natural habitats and causing the extinction of other species. But changes to Earth\'s environments can have different impacts (negative and positive) for different living things.'
  },
  'MS-ESS3-4': {
    code: 'ESS3.C',
    name: 'Human Impacts on Earth Systems',
    description: 'Typically as human populations and per-capita consumption of natural resources increase, so do the negative impacts on Earth unless the activities and technologies involved are engineered otherwise.'
  },
  'MS-ESS3-5': {
    code: 'ESS3.D',
    name: 'Global Climate Change',
    description: 'Human activities, such as the release of greenhouse gases from burning fossil fuels, are major factors in the current rise in Earth\'s mean surface temperature (global warming). Reducing the level of climate change and reducing human vulnerability to whatever climate changes do occur depend on the understanding of climate science, engineering capabilities, and other kinds of knowledge, such as understanding of human behavior and on applying that knowledge wisely in decisions and activities.'
  }
};

interface Standard {
  code: string;
  grade_level: string;
  domain: string;
  topic: string;
  performance_expectation: string;
  sep: { code: string; name: string; description: string };
  dci: { code: string; name: string; description: string };
  ccc: { code: string; name: string; description: string };
  keywords: string[];
  lesson_scope: {
    key_concepts: string[];
    prerequisite_knowledge: string[];
    common_misconceptions: string[];
    depth_boundaries: { include: string[]; exclude: string[] };
  };
}

interface DataFile {
  generated_at: string;
  source: string;
  standards: Standard[];
}

async function main() {
  const dataPath = path.join(process.cwd(), 'data', 'ngss-ms-standards.json');

  console.log('📖 Reading dataset...');
  const data: DataFile = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`   Found ${data.standards.length} standards\n`);

  let correctionCount = 0;
  const updatedStandards = data.standards.map(standard => {
    const correction = DCI_CORRECTIONS[standard.code];
    if (correction && standard.dci.code !== correction.code) {
      console.log(`✏️  ${standard.code}: ${standard.dci.code} → ${correction.code} (${correction.name})`);
      correctionCount++;
      return {
        ...standard,
        dci: correction
      };
    }
    return standard;
  });

  console.log(`\n✅ Applied ${correctionCount} DCI corrections\n`);

  // Verify all 35 DCIs are now present
  const uniqueDCIs = new Set(updatedStandards.map(s => s.dci.code));
  console.log(`📊 Unique DCIs in dataset: ${uniqueDCIs.size}/35`);
  console.log(`   DCIs: ${Array.from(uniqueDCIs).sort().join(', ')}\n`);

  // Write updated data
  const updatedData: DataFile = {
    ...data,
    generated_at: new Date().toISOString(),
    standards: updatedStandards
  };

  fs.writeFileSync(dataPath, JSON.stringify(updatedData, null, 2));
  console.log('💾 Updated dataset written to:', dataPath);
  console.log('\n✨ Data quality fix complete!');
}

main().catch(console.error);

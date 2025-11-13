import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';

export const generateAvatar = (name: string) => {
  return createAvatar(adventurer, {
    seed: name,
    eyebrows: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05'],
    eyes: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05'],
    mouth: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05'],
    skinColor: ['ecac98', 'f2d3b1', 'ac6651'],
    hair: ['short01', 'short02', 'short03', 'long01', 'long02'],
    hairColor: ['#000000', '#77311D', '#FC909F', '#D2EFF3', '#506AF4', '#F48150'],
    glasses: ['variant01', 'variant02', 'variant03'],
    glassesProbability: 30,
    scale: 90,
    size: 400,
  }).toDataUri();
};

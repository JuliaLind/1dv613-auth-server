/**
 * Module for helper functions.
 *
 */

import { differenceInYears } from 'date-fns'

/**
 * Calculates current age based on the birth date.
 *
 * @param {string} birthDate - any date string that can be parsed by the Date constructor
 * @returns {number} - the age in years
 */
export function getAge (birthDate) {
  return differenceInYears(new Date(), new Date(birthDate))
}

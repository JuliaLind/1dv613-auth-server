/**
 * Module for helper functions.
 *
 */

import { startOfDay, differenceInYears, endOfDay } from 'date-fns'

/**
 * Calculates current age based on the birth date.
 *
 * @param {string} birthDate - any date string that can be parsed by the Date constructor
 * @returns {number} - the age in years
 */
export function getAge (birthDate) {
  return differenceInYears(endOfDay(new Date()), startOfDay(new Date(birthDate)))
}

/**
 * Module for helper functions.
 *
 */

import { differenceInYears, subDays } from 'date-fns'

/**
 * Calculates current age based on the birth date.
 *
 * @param {string} birthDate - any date string that can be parsed by the Date constructor
 * @returns {number} - the age in years
 */
export function getAge (birthDate) {
  // subtract one day to avoid issues with time zones and daylight saving time
  const years = differenceInYears(new Date(), subDays(new Date(birthDate), 1))
  console.log(`Age calculated from birth date ${birthDate}: ${years} years`)
  return years
}

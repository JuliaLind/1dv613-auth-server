/**
 * Module for helper functions.
 *
 */

import { differenceInYears } from 'date-fns'

export function getAge (birthDate) {
  return differenceInYears(new Date(), new Date(birthDate))
}

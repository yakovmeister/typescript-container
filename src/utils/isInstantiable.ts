
/**
 * Check whether the given Object is instantiable.
 * @param Class Object.
 * @returns boolean
 */
export const isInstantiable = (Class: any) : boolean => {
  if (typeof Class.prototype !== 'object') {
    return false
  }

  return typeof Reflect.get(Class.prototype, 'constructor') === 'function'
}

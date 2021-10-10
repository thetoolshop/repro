export const copyArray = <T>(arr: Array<T>) => arr.slice()
export const copyObject = <T extends object>(obj: T): T => ({ ...obj })
export const copyObjectDeep = <T extends object>(obj: T): T => JSON.parse(JSON.stringify(obj))


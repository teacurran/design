import { snakeCase } from "lodash"
import { map, toPairs, fromPairs } from "ramda"

const mapObj = (fn: ([key, value]: [string, any]) => [string, any], data: object): object => {
  return fromPairs(map(fn, toPairs(data)))
}

export function toSnake(data: any): any {
  // typeof null is object, but don't output an empty object below.
  if (!data) {
    return data
  }
  if (Array.isArray(data)) {
    return data.map((v) => toSnake(v))
  }
  if (typeof data === "object") {
    return mapObj(([k, v]) => [snakeCase(k), toSnake(v)], data)
  }
  return data
}

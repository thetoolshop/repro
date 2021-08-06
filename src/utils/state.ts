import { useCallback, useEffect, useState } from 'react'
import { BehaviorSubject } from 'rxjs'

export function atom<T>(val: T) {
  return new BehaviorSubject(val)
}

export function useAtomValue<T>(atom: BehaviorSubject<T>) {
  const [value, setValue] = useState(atom.getValue())

  useEffect(() => {
    const subscription = atom.subscribe(setValue)
    return () => subscription.unsubscribe()
  }, [atom, setValue])

  return value
}

type Factory<T> = (prev: T) => T

function isValueFactory<T>(val: T | Factory<T>): val is Factory<T> {
  return typeof val === 'function'
}

export function createSetter<T>(atom: BehaviorSubject<T>) {
  return (val: T | Factory<T>) => {
    atom.next(isValueFactory(val) ? val(atom.getValue()) : val)
  }
}

export function useSetAtomValue<T>(atom: BehaviorSubject<T>) {
  return useCallback(createSetter(atom), [atom])
}

type AtomState<T> = [T, (val: T | Factory<T>) => void]

export function useAtomState<T>(atom: BehaviorSubject<T>): AtomState<T> {
  return [useAtomValue(atom), useSetAtomValue(atom)]
}


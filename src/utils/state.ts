import { useCallback, useEffect, useState } from 'react'
import { BehaviorSubject } from 'rxjs'

export type Atom<T> = BehaviorSubject<T>

export function atom<T>(val: T): Atom<T> {
  return new BehaviorSubject(val)
}

type Factory<T> = (prev: T) => T

function isValueFactory<T>(val: T | Factory<T>): val is Factory<T> {
  return typeof val === 'function'
}

export function createSetter<T>(atom: Atom<T>) {
  return (val: T | Factory<T>) => {
    atom.next(isValueFactory(val) ? val(atom.getValue()) : val)
  }
}

type AtomState<T> = [T, (val: T | Factory<T>) => void]

export function useAtomState<T>(atom: Atom<T>): AtomState<T> {
  const [value, setValue] = useState(atom.getValue())

  useEffect(() => {
    const subscription = atom.subscribe(setValue)
    return () => subscription.unsubscribe()
  }, [atom, setValue])

  return [value, useCallback(createSetter(atom), [atom])]
}

export function useAtomValue<T>(atom: Atom<T>) {
  return useAtomState(atom)[0]
}

export function useSetAtomValue<T>(atom: Atom<T>) {
  return useAtomState(atom)[1]
}

export function createValueHook<T>(atom: Atom<T>) {
  return () => useAtomValue(atom)
}

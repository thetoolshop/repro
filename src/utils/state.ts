import { useCallback, useEffect, useState } from 'react'
import { asapScheduler, BehaviorSubject } from 'rxjs'
import { observeOn } from 'rxjs/operators'

export type Atom<T> = BehaviorSubject<T>

function atom<T>(val: T): Atom<T> {
  return new BehaviorSubject(val)
}

function createGetter<T>(atom: Atom<T>) {
  return () => atom.getValue()
}

type Factory<T> = (prev: T) => T

function isValueFactory<T>(val: T | Factory<T>): val is Factory<T> {
  return typeof val === 'function'
}

function createSetter<T>(atom: Atom<T>) {
  return (val: T | Factory<T>) => {
    atom.next(isValueFactory(val) ? val(atom.getValue()) : val)
  }
}

export function createAtom<T>(val: T) {
  const $atom = atom(val)
  return [$atom, createGetter($atom), createSetter($atom)] as const
}

type AtomState<T> = [T, (val: T | Factory<T>) => void]

export function useAtomState<T>(atom: Atom<T>): AtomState<T> {
  const [value, setValue] = useState(atom.getValue())

  useEffect(() => {
    const subscription = atom
      .pipe(observeOn(asapScheduler))
      .subscribe(setValue)
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

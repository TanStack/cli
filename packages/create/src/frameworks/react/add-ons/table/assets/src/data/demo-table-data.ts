import { en, Faker, faker } from '@faker-js/faker'

export type Person = {
  id: number
  firstName: string
  lastName: string
  age: number
  visits: number
  progress: number
  status: 'relationship' | 'complicated' | 'single'
  subRows?: Person[]
}

const range = (len: number) => {
  const arr: number[] = []
  for (let i = 0; i < len; i++) {
    arr.push(i)
  }
  return arr
}

const newPerson = (num: number, source: Faker): Person => {
  return {
    id: num,
    firstName: source.person.firstName(),
    lastName: source.person.lastName(),
    age: source.number.int(40),
    visits: source.number.int(1000),
    progress: source.number.int(100),
    status: source.helpers.shuffle<Person['status']>([
      'relationship',
      'complicated',
      'single',
    ])[0]!,
  }
}

function makeDataWithFaker(source: Faker, lens: number[]) {
  const makeDataLevel = (depth = 0): Person[] => {
    const len = lens[depth]!
    return range(len).map((index): Person => {
      return {
        ...newPerson(index, source),
        subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined,
      }
    })
  }

  return makeDataLevel()
}

export function makeData(...lens: number[]) {
  return makeDataWithFaker(faker, lens)
}

export function makeInitialData(length: number) {
  const source = new Faker({ locale: [en] })
  source.seed(42)
  return makeDataWithFaker(source, [length])
}

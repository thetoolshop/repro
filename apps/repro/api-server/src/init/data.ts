export const subscription_plan_configuration = {
  0: {
    name: 'Free',
    isPaidPlan: false,
    minSeats: 1,
    maxSeats: 1,
    uploadLimit: 50,
    order: 0,
  },

  1: {
    name: 'Team',
    isPaidPlan: true,
    minSeats: 5,
    maxSeats: null,
    uploadLimit: null,
    order: 1,
  },
}

export const teams = {
  0: { name: 'Team A' },
  1: { name: 'Team B' },
  2: { name: 'Team C' },
}

export const users = {
  0: {
    name: 'Walter White',
    email: 'walt@example.com',
    password: 'foo',
    teamId: 0,
  },
  1: {
    name: 'Jesse Pinkman',
    email: 'jesse@example.com',
    password: 'bar',
    teamId: 0,
  },
  2: {
    name: 'Gustavo Fring',
    email: 'gus@example.com',
    password: 'baz',
    teamId: 1,
  },
  3: {
    name: 'Mike Ehrmantraut',
    email: 'mike@example.com',
    password: 'red',
    teamId: 1,
  },
  4: {
    name: 'Saul Goodman',
    email: 'saul@example.com',
    password: 'blue',
    teamId: 2,
  },
}

export const projects = {
  0: { name: 'Project A', teamId: 0 },
  1: { name: 'Project B', teamId: 0 },
  2: { name: 'Project C', teamId: 1 },
  3: { name: 'Project D', teamId: 2 },
}

export const members = [
  { projectId: 0, userId: 0, role: 'admin' },
  { projectId: 0, userId: 1, role: 'member' },
  { projectId: 1, userId: 0, role: 'admin' },
  { projectId: 2, userId: 2, role: 'admin' },
  { projectId: 2, userId: 3, role: 'member' },
  { projectId: 3, userId: 4, role: 'admin' },
] as const

export const recordings = {}

import { Schema, Table, column } from '@powersync/web'

const todos = new Table(
  {
    created_at: column.text,
    description: column.text,
    completed: column.integer,
  },
  { indexes: { created_at: ['created_at'] } },
)

export const AppSchema = new Schema({
  todos,
})

export type Database = (typeof AppSchema)['types']
export type TodoRecord = Database['todos']

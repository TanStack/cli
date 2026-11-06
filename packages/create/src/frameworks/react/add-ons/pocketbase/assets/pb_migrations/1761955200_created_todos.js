/// <reference path="../pb_data/types.d.ts" />

// Creates the `todos` collection used by the /demo/pocketbase route.
// Applied automatically when running `./pocketbase serve`.
//
// Every todo belongs to the user in `owner`. The API rules below let users
// read and change only their own todos (realtime events follow `listRule`),
// and stop them from creating todos for someone else or handing theirs over.
const ownerOnly = '@request.auth.id != "" && owner = @request.auth.id'

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    const collection = new Collection({
      type: 'base',
      name: 'todos',
      listRule: ownerOnly,
      viewRule: ownerOnly,
      createRule: '@request.auth.id != "" && @request.body.owner = @request.auth.id',
      updateRule: `${ownerOnly} && (@request.body.owner:isset = false || @request.body.owner = @request.auth.id)`,
      deleteRule: ownerOnly,
      fields: [
        { name: 'text', type: 'text', required: true, max: 500 },
        { name: 'completed', type: 'bool' },
        {
          name: 'owner',
          type: 'relation',
          required: true,
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_todos_owner ON todos (owner)'],
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('todos')
    app.delete(collection)
  },
)

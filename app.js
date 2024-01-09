const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at 3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

//Get todos whose status is 'TO DO'
app.get('/todos/', async (request, response) => {
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`
      break
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`
  }

  const data = await db.all(getTodosQuery)
  response.send(data)
})

//Get todo based on todo ID
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const getTodoByIdQuery = `
  SELECT * 
  FROM todo 
  WHERE 
  id = ${todoId}`

  const data = await db.get(getTodoByIdQuery)
  response.send(data)
})

//Add todo in th todo table
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body

  const addTodoQuery = `
  INSERT INTO 
  todo (id, todo, priority, status) 
  VALUES (${id}, '${todo}', '${priority}', '${status}')`

  await db.run(addTodoQuery)
  response.send('Todo Successfully Added')
})

//Update todo based on todo ID
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestDetails = request.body
  const previousTodoQuery = `
  SELECT * FROM 
  todo 
  WHERE 
  id = ${todoId}`
  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = requestDetails

  let updateColumn = ''
  switch (true) {
    case requestDetails.status !== undefined:
      updateColumn = 'Status'
      break
    case requestDetails.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestDetails.todo !== undefined:
      updateColumn = 'Todo'
      break
  }

  const updateTodoQuery = `
  UPDATE todo 
  SET 
  todo = '${todo}', priority = '${priority}', status = '${status}'
  WHERE 
  id = ${todoId}`

  await db.run(updateTodoQuery)
  response.send(`${updateColumn} Updated`)
})

//Delete a todo from table based on todoId
app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params

  const deleteTodoQuery = `
  DELETE FROM 
  todo 
  WHERE 
  id = ${todoId}`

  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
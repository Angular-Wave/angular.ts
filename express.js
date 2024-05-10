import express from 'express'
const app = express()
const port = 3000

app.use('/post', express.json());
app.use('/nocontent', express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Change * to your desired origin if needed
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  // Additional headers you may need to allow

  // Set the allowed methods
  if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
      return res.status(200).json({});
  }

  next();
});

app.post('/post', (req, res) => {
  console.log(req.body)
  res.json(req.body)
})

app.post('/invalidarray', (req, res) => {
  res.json('{1, 2, 3]')
})

app.post('/nocontent', (req, res) => {
  console.log(req.body)
  res.removeHeader('Content-type')
  res.json(req.body)
})

app.post('/form', (req, res) => {
  res.send(req.body)
}) 

app.post('/blob', (req, res) => {
  res.send(req.body)
})

app.head('/head', (req, res) => {
  res.send(req.body)
})

app.delete('/delete', (req, res) => {
  res.send(req.body)
})

app.put('/put', (req, res) => {
  res.json('Hello')
})

app.patch('/patch', (req, res) => {
  res.json('Hello')
})

app.post('/hello', (req, res) => {
  res.json('Hello')
})


app.get('/interpolation', (req, res) => {
  res.send('{{expr}}') 
})

app.get('/jsoninterpolation', (req, res) => {
  res.json('{{expr}}') 
})

app.get('/scopeinit', (req, res) => {
  res.send('<div ng-init="name=1"></div>') 
})

app.get('/directive', (req, res) => {
  res.send('<div><div test></div></div>') 
})

app.get('/empty', (req, res) => {
  res.send(' ') 
})

app.get('/hello', (req, res) => {
  res.send('Hello') 
})

app.get('/div', (req, res) => {
  res.send('<div>Hello</div>') 
})

app.get('/divexpr', (req, res) => {
  res.send('<div>{{expr}}</div>') 
})

app.get('/divctrlexpr', (req, res) => {
  res.send('<div>{{$ctrl.expr}}</div>') 
})

app.get('/template.html', (req, res) => {
  res.send('<p>template.html</p>') 
})

app.get('/circle-svg', (req, res) => {
  res.send('<circle></circle>') 
})

app.get('/hello2', (req, res) => {
  res.send('Hello2') 
})

app.get('/third', (req, res) => {
  res.send('<div third>{{1+2}}</div>') 
})

app.get('/script', (req, res) => {
  res.send('<div><script>window.SCRIPT_RAN = true;</script></div>') 
})

app.get("/401", (req, res) => {
  res.sendStatus(401)
})

app.get("/404", (req, res) => {
  res.sendStatus(404)
})

app.get("/never", (req, res) => {
  setTimeout(() => {}, 500)
})

app.get("/my-rect.html", (req, res) => {
  res.send("<g ng-include=\"'/mock/include.svg'\"></g>");
})

app.get("/my-rect2.html", (req, res) => {
  res.send("<g ng-include=\"'/mock/include.svg'\"><a></a></g>");
})

app.get("/include.svg", (req, res) => {
  res.send("<rect></rect><rect></rect>");
})

app.get('/', (req, res) => {
  res.send('Hello')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


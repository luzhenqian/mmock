const { MongoClient, ObjectId } = require("mongodb");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Mock = require("mockjs");
const { getAllProjects } = require("./services");

const uri =
  "mongodb+srv://luzhenqian:DsGgkcKDzDuUt3SI@cluster0.f06j5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let appCollection;

function initConnect() {
  return new Promise((resolve, reject) => {
    client.connect((err) => {
      appCollection = client.db("mmock").collection("projects");
      resolve();
    });
  });
}

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
const port = 3333;

app.post("/projects", (req, res) => {
  const { projectName } = req.body;
  appCollection
    .findOne({ name: projectName })
    .then((result) => {
      if (result !== null) {
        res.send(jsonToString({ message: "project name repeat" }));
        return;
      }
      appCollection.insertOne({
        name: projectName,
        description: "",
        services: [],
      });
      res.send(jsonToString({ message: "project successfully created" }));
    })
    .catch((err) => {
      console.log("project create error:", err);
    });
});

app.post("/services", (req, res) => {
  appCollection
    .findOne({ name: req.body.projectName })
    .then((result) => {
      if (result === null) {
        res.send(jsonToString({ message: "project is not available" }));
        return;
      }
      const service = result.services.find(
        (service) => service.name === req.body.projectName
      );
      if (service) {
        res.send(jsonToString({ message: "service is available" }));
        return;
      }
      result.services.push({
        name: req.body.serviceName,
        description: "",
        requests: [],
      });
      appCollection.updateOne(
        { _id: new ObjectId(result._id) },
        { $set: { services: result.services } }
      );
      res.send(jsonToString({ message: "service successfully created" }));
    })
    .catch((err) => {
      console.log("service create error:", err);
    });
});

app.post("/requests", (req, res) => {
  const {
    projectName,
    serviceName,
    requestName,
    method,
    url,
    queryParameters,
    headers,
    timeout,
    body,
  } = req.body;
  appCollection
    .findOne({ name: projectName })
    .then((result) => {
      if (result === null) {
        res.send(jsonToString({ message: "project is not available" }));
        return;
      }
      const service = result.services.find(
        (service) => service.name === serviceName
      );
      if (service === null) {
        res.send(jsonToString({ message: "service is not available" }));
        return;
      }
      const request = service.requests.find(
        (request) => request.name === requestName
      );
      if (request) {
        res.statusCode = 200;
        res.send(jsonToString({ message: "request is not available" }));
        return;
      }
      service.requests.push({
        name: requestName,
        method,
        url,
        queryParameters,
        headers,
        body,
        timeout,
        description: "",
      });
      appCollection.updateOne(
        { _id: new ObjectId(result._id) },
        { $set: { services: result.services } }
      );
      addApi(method, url, body);
      res.statusCode = 200;
      res.send(jsonToString({ message: "request successfully created" }));
    })
    .catch((err) => {
      console.log("request create error:", err);
    });
});

app.put("/requests", (req, res) => {
  const {
    projectName,
    serviceName,
    requestName,
    method,
    url,
    queryParameters,
    headers,
    timeout,
    body,
  } = req.body;
  appCollection
    .findOne({ name: projectName })
    .then((result) => {
      if (result === null) {
        res.send(jsonToString({ message: "project is not available" }));
        return;
      }
      const service = result.services.find(
        (service) => service.name === serviceName
      );
      if (service === null) {
        res.send(jsonToString({ message: "service is not available" }));
        return;
      }
      const request = service.requests.find(
        (request) => request.name === requestName
      );
      if (!request) {
        res.statusCode = 200;
        res.send(jsonToString({ message: "request is not available" }));
        return;
      }
      // requests.name = requestName;
      request.method = method;
      request.url = url;
      request.body = body;

      appCollection.updateOne(
        { _id: new ObjectId(result._id) },
        { $set: { services: result.services } }
      );
      addApi(method, url, body);
      res.statusCode = 200;
      res.send(jsonToString({ message: "request successfully created" }));
    })
    .catch((err) => {
      console.log("request create error:", err);
    });
});

app.get("/projects", async (req, res) => {
  const result = await getAllProjects(appCollection);
  res.send(result);
});

app.delete("/projects/:_id", async (req, res) => {
  const { _id } = req.params;
  const result = await appCollection.deleteOne({ _id: new ObjectId(_id) });
  if (result.deletedCount === 1) {
    res.send(jsonToString({ message: "project successfully deleted" }));
  }
});

async function initAllApi() {
  const result = await getAllProjects(appCollection);
  const requests = [];
  await result.forEach((project) => {
    project.services.forEach((service) => {
      requests.push(...service.requests);
    });
  });
  requests.forEach((request) => {
    const { method, url, body } = request;
    addApi(method, url, body);
  });
}

function addApi(method, url, body) {
  const methods = ["get", "put", "post", "delete"];
  if (methods.includes(method)) {
    app[method](url, (req, res) => {
      try {
        eval(`var data = ${body}`)
        const mockBody = Mock.mock(data);
        res.send(jsonToString(mockBody));
      } catch (err) {
        res.send(body);
      }
    });
  }
}

function jsonToString(dataString) {
  return JSON.stringify(dataString);
}

initConnect().then(() => {
  initAllApi().then((result) => {
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  });
});
